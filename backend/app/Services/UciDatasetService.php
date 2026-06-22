<?php
// backend/app/Services/UciDatasetService.php
namespace App\Services;

use Illuminate\Support\Facades\Http;
use ZipArchive;

class UciDatasetService
{
    public function listDatasets(): array
    {
        $response = Http::timeout(10)
            ->get('https://archive.ics.uci.edu/api/datasets/list');

        if (!$response->ok()) {
            throw new \RuntimeException('UCI API tidak dapat diakses: ' . $response->status());
        }

        return $response->json('data', []);
    }

    public function fetchDataset(int $uciId): array
    {
        // 1. Get metadata
        $meta = Http::timeout(10)
            ->get("https://archive.ics.uci.edu/api/dataset?id={$uciId}")
            ->json('data', []);

        $name = $meta['name'] ?? "UCI Dataset {$uciId}";
        $description = $meta['abstract'] ?? '';

        // 2. Build download URL — UCI uses lowercase name with spaces as '+'
        // e.g. "Breast Cancer" → "breast+cancer.zip"
        $slugPlus  = strtolower(preg_replace('/[^a-zA-Z0-9 ]/', '', $name));
        $slugPlus  = preg_replace('/\s+/', '+', trim($slugPlus));
        $slugUnder = str_replace('+', '_', $slugPlus);

        $candidates = [
            "https://archive.ics.uci.edu/static/public/{$uciId}/{$slugPlus}.zip",
            "https://archive.ics.uci.edu/static/public/{$uciId}/{$slugUnder}.zip",
        ];

        $zipUrl   = null;
        $zipResponse = null;
        foreach ($candidates as $candidate) {
            $r = Http::timeout(30)->get($candidate);
            if ($r->ok()) {
                $zipUrl      = $candidate;
                $zipResponse = $r;
                break;
            }
        }

        if (!$zipUrl || !$zipResponse) {
            throw new \RuntimeException(
                "Gagal mengunduh dataset. URL dicoba: " . implode(', ', $candidates)
            );
        }
        $zipContent = $zipResponse->body();

        $tmpZip = tempnam(sys_get_temp_dir(), 'uci_zip_');
        file_put_contents($tmpZip, $zipContent);

        // 4. Extract to temp dir
        $tmpDir = sys_get_temp_dir() . '/uci_' . $uciId . '_' . time();
        mkdir($tmpDir, 0755, true);

        $zip = new ZipArchive();
        if ($zip->open($tmpZip) !== true) {
            unlink($tmpZip);
            throw new \RuntimeException('Gagal membuka file ZIP');
        }
        $zip->extractTo($tmpDir);
        $zip->close();
        unlink($tmpZip);

        // 5. Find data + names files
        // Recursively find data and names files in extracted directory
        $allFiles = $this->listFilesRecursive($tmpDir);
        $dataFile = null;
        $namesFile = null;
        foreach ($allFiles as $f) {
            $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
            if (in_array($ext, ['data', 'csv']) && !$dataFile) $dataFile = $f;
            if ($ext === 'names') $namesFile = $f;
        }

        if (!$dataFile) {
            $this->cleanupDir($tmpDir);
            throw new \RuntimeException('File data (.data/.csv) tidak ditemukan dalam ZIP');
        }

        // 6. Parse
        $tableName = preg_replace('/[^a-z0-9]/', '_', strtolower($name));
        $columns = $namesFile
            ? $this->parseColumnNames($namesFile)
            : null;

        $rawContent = file_get_contents($dataFile);
        $lines = array_filter(explode("\n", trim($rawContent)), fn($l) => trim($l) !== '');
        $rows = array_map(fn($l) => str_getcsv(trim($l)), array_slice($lines, 0, 500));

        if (empty($rows)) {
            $this->cleanupDir($tmpDir);
            throw new \RuntimeException('File data kosong');
        }

        $colCount = max(array_map('count', $rows));
        if (!$columns || count($columns) !== $colCount) {
            $columns = array_map(fn($i) => "col{$i}", range(1, $colCount));
        }

        [$schemaSql, $seedSql] = $this->buildSql($tableName, $columns, $rows, 'TEXT');

        $this->cleanupDir($tmpDir);

        return [
            'name'        => $name,
            'description' => $description,
            'source_ref'  => (string) $uciId,
            'schema_sql'  => $schemaSql,
            'seed_sql'    => $seedSql,
        ];
    }

    private function parseColumnNames(string $path): array
    {
        $content = file_get_contents($path);
        $columns = [];
        // Match patterns like "1. sepal length" or "1) column_name"
        preg_match_all('/^\s*\d+[.)]\s+([^:\n,()]+)/m', $content, $matches);
        foreach (($matches[1] ?? []) as $col) {
            $columns[] = trim($col);
        }
        return $columns;
    }

    private function buildSql(string $table, array $columns, array $rows, string $defaultType): array
    {
        $cols = array_map(fn($c) => preg_replace('/[^a-z0-9_]/', '_', strtolower(trim($c))), $columns);

        $schema = "CREATE TABLE {$table} (\n  id INTEGER PRIMARY KEY AUTOINCREMENT";
        foreach ($cols as $col) {
            $schema .= ",\n  {$col} {$defaultType}";
        }
        $schema .= "\n);";

        $seed = '';
        foreach ($rows as $row) {
            if (count($row) < count($cols)) continue;
            $vals = [];
            foreach ($cols as $i => $col) {
                $v = trim($row[$i] ?? '');
                $vals[] = $v === '' ? 'NULL' : "'" . str_replace("'", "''", $v) . "'";
            }
            $seed .= "INSERT INTO {$table} (" . implode(', ', $cols) . ") VALUES (" . implode(', ', $vals) . ");\n";
        }

        return [$schema, $seed];
    }

    private function cleanupDir(string $dir): void
    {
        if (!is_dir($dir)) return;
        foreach (array_diff(scandir($dir), ['.', '..']) as $f) {
            $path = "{$dir}/{$f}";
            is_dir($path) ? $this->cleanupDir($path) : unlink($path);
        }
        rmdir($dir);
    }

    private function listFilesRecursive(string $dir): array
    {
        $result = [];
        foreach (array_diff(scandir($dir), ['.', '..']) as $f) {
            $path = "{$dir}/{$f}";
            if (is_dir($path)) {
                $result = array_merge($result, $this->listFilesRecursive($path));
            } else {
                $result[] = $path;
            }
        }
        return $result;
    }
}
