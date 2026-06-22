<?php
// backend/app/Services/DatasetParserService.php
namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;

class DatasetParserService
{
    public function parseFromUpload(UploadedFile $file): array
    {
        $content  = file_get_contents($file->getRealPath());
        $filename = $file->getClientOriginalName();
        $ext      = strtolower($file->getClientOriginalExtension());

        return $ext === 'json'
            ? $this->parseJson($content, $filename)
            : $this->parseCsv($content, $filename);
    }

    public function parseFromUrl(string $url): array
    {
        $response = Http::timeout(20)->get($url);
        if (!$response->ok()) {
            throw new \RuntimeException("Gagal mengambil data dari URL: {$url}");
        }

        $content  = $response->body();
        $filename = basename(parse_url($url, PHP_URL_PATH)) ?: 'dataset.csv';
        $ext      = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

        return $ext === 'json'
            ? $this->parseJson($content, $filename)
            : $this->parseCsv($content, $filename);
    }

    private function parseCsv(string $content, string $filename): array
    {
        $tableName = $this->toTableName($filename);
        $lines     = array_filter(explode("\n", trim($content)), fn($l) => trim($l) !== '');

        if (count($lines) < 2) {
            throw new \RuntimeException('CSV harus memiliki minimal 1 header + 1 baris data');
        }

        $headers = str_getcsv(array_shift($lines));
        $headers = array_map(fn($h) => preg_replace('/[^a-z0-9_]/', '_', strtolower(trim($h))), $headers);

        $rows = array_map('str_getcsv', array_slice($lines, 0, 500));

        // Detect numeric columns
        $types = [];
        foreach ($headers as $i => $col) {
            $vals    = array_map(fn($r) => trim($r[$i] ?? ''), $rows);
            $nonEmpty = array_filter($vals, fn($v) => $v !== '');
            $types[$col] = !empty($nonEmpty) && count(array_filter($nonEmpty, 'is_numeric')) === count($nonEmpty)
                ? 'REAL'
                : 'TEXT';
        }

        $schema = "CREATE TABLE {$tableName} (\n  id INTEGER PRIMARY KEY AUTOINCREMENT";
        foreach ($headers as $col) {
            $schema .= ",\n  {$col} {$types[$col]}";
        }
        $schema .= "\n);";

        $seed = '';
        foreach ($rows as $row) {
            if (count($row) < count($headers)) continue;
            $vals = [];
            foreach ($headers as $i => $col) {
                $v = trim($row[$i] ?? '');
                if ($v === '') { $vals[] = 'NULL'; continue; }
                $vals[] = $types[$col] === 'REAL' && is_numeric($v)
                    ? $v
                    : "'" . str_replace("'", "''", $v) . "'";
            }
            $seed .= "INSERT INTO {$tableName} (" . implode(', ', $headers) . ") VALUES (" . implode(', ', $vals) . ");\n";
        }

        return ['schema_sql' => $schema, 'seed_sql' => $seed];
    }

    private function parseJson(string $content, string $filename): array
    {
        $data = json_decode($content, true);
        if (!is_array($data)) {
            throw new \RuntimeException('JSON harus berupa array of objects');
        }
        // Flatten if nested under a key
        if (!isset($data[0]) && is_array(reset($data))) {
            $data = reset($data);
        }
        if (empty($data) || !is_array($data[0])) {
            throw new \RuntimeException('JSON tidak mengandung array of objects');
        }

        $headers = array_map(
            fn($h) => preg_replace('/[^a-z0-9_]/', '_', strtolower($h)),
            array_keys($data[0])
        );

        $tableName = $this->toTableName($filename);
        $schema    = "CREATE TABLE {$tableName} (\n  id INTEGER PRIMARY KEY AUTOINCREMENT";
        foreach ($headers as $col) {
            $schema .= ",\n  {$col} TEXT";
        }
        $schema .= "\n);";

        $seed = '';
        foreach (array_slice($data, 0, 500) as $row) {
            $vals = array_map(fn($v) => $v === null ? 'NULL' : "'" . str_replace("'", "''", (string) $v) . "'", array_values($row));
            $seed .= "INSERT INTO {$tableName} (" . implode(', ', $headers) . ") VALUES (" . implode(', ', $vals) . ");\n";
        }

        return ['schema_sql' => $schema, 'seed_sql' => $seed];
    }

    private function toTableName(string $filename): string
    {
        $name = pathinfo($filename, PATHINFO_FILENAME);
        return preg_replace('/[^a-z0-9]/', '_', strtolower($name));
    }
}
