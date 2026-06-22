# SQL Mission Control — Plan 1: Backend + Admin Panel

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Laravel backend (MongoDB models, API endpoints, dataset import services) and React admin pages so admin can import datasets from UCI/URL/upload, toggle them on/off, and CRUD missions.

**Architecture:** Two new MongoDB collections (`sql_datasets`, `sql_missions`) exposed via a public config endpoint and admin CRUD endpoints. Three import paths for datasets: UCI API (server-side ZIP download + parse), URL fetch (server-side CSV/JSON), and direct file upload. Admin panel adds a new "SQL Game" section to the existing `/binn` admin with two sub-pages: Datasets and Missions.

**Tech Stack:** Laravel 11 + MongoDB (mongodb/laravel-mongodb ^5.7), Laravel Http facade, PHP ZipArchive, React 19 + Vite, Tailwind CSS, Axios, @dnd-kit/core + @dnd-kit/sortable (new, for mission drag reorder)

---

## File Map

**Backend — create:**
- `backend/app/Models/SqlDataset.php`
- `backend/app/Models/SqlMission.php`
- `backend/app/Services/UciDatasetService.php`
- `backend/app/Services/DatasetParserService.php`
- `backend/app/Http/Controllers/Api/SqlGameController.php`
- `backend/app/Http/Controllers/Api/Admin/AdminSqlDatasetController.php`
- `backend/app/Http/Controllers/Api/Admin/AdminSqlMissionController.php`

**Backend — modify:**
- `backend/routes/api.php` — add 10 new routes

**Frontend — install:**
- `@dnd-kit/core @dnd-kit/sortable` (mission drag reorder in admin)

**Frontend — modify:**
- `frontend/tailwind.config.js` — add `sql-*` color tokens + JetBrains Mono font
- `frontend/index.html` — add JetBrains Mono Google Fonts link
- `frontend/src/services/api.js` — add sql-game API functions
- `frontend/src/App.jsx` — add `/binn/sql-game/*` routes
- `frontend/src/components/layout/AdminLayout.jsx` — add SQL Game nav item

**Frontend — create:**
- `frontend/src/pages/admin/SqlGameDatasets.jsx`
- `frontend/src/pages/admin/SqlGameMissions.jsx`
- `frontend/src/pages/admin/sql-game/UciBrowserModal.jsx`
- `frontend/src/pages/admin/sql-game/DatasetEditor.jsx`
- `frontend/src/pages/admin/sql-game/MissionForm.jsx`

---

## Task 1: Backend MongoDB Models

**Files:**
- Create: `backend/app/Models/SqlDataset.php`
- Create: `backend/app/Models/SqlMission.php`

- [ ] **Step 1: Create SqlDataset model**

```php
<?php
// backend/app/Models/SqlDataset.php
namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class SqlDataset extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'sql_datasets';

    protected $fillable = [
        'name', 'description', 'source', 'source_ref',
        'schema_sql', 'seed_sql', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
```

- [ ] **Step 2: Create SqlMission model**

```php
<?php
// backend/app/Models/SqlMission.php
namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class SqlMission extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'sql_missions';

    protected $fillable = [
        'dataset_id', 'stage_order', 'title', 'briefing',
        'tables', 'objectives', 'ordering_hint', 'ordered',
        'starter_sql', 'solution_query', 'rank_unlock', 'is_active',
    ];

    protected $casts = [
        'tables'      => 'array',
        'objectives'  => 'array',
        'ordered'     => 'boolean',
        'is_active'   => 'boolean',
        'stage_order' => 'integer',
    ];
}
```

- [ ] **Step 3: Smoke test via Tinker**

```bash
cd backend
php artisan tinker
# In tinker:
# App\Models\SqlDataset::create(['name'=>'test','schema_sql'=>'','seed_sql'=>'','source'=>'upload','is_active'=>false]);
# App\Models\SqlDataset::count();  // should return 1
# App\Models\SqlDataset::where('name','test')->delete();
```

Expected: no errors, count returns 1, then delete cleans up.

- [ ] **Step 4: Commit**

```bash
git add backend/app/Models/SqlDataset.php backend/app/Models/SqlMission.php
git commit -m "feat(sql-game): add SqlDataset and SqlMission MongoDB models"
```

---

## Task 2: UCI Dataset Service

**Files:**
- Create: `backend/app/Services/UciDatasetService.php`

- [ ] **Step 1: Create the service**

```php
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

        // 2. Build download URL (UCI pattern: /static/public/{id}/{slug}.zip)
        $slug = strtolower(str_replace([' ', '-'], '_', $name));
        $zipUrl = "https://archive.ics.uci.edu/static/public/{$uciId}/{$slug}.zip";

        // 3. Download ZIP
        $zipContent = Http::timeout(30)->get($zipUrl)->body();
        if (empty($zipContent)) {
            throw new \RuntimeException("Gagal mengunduh dataset dari {$zipUrl}");
        }

        $tmpZip = tempnam(sys_get_temp_dir(), 'uci_') . '.zip';
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
        $files = array_diff(scandir($tmpDir), ['.', '..']);
        $dataFile = null;
        $namesFile = null;
        foreach ($files as $f) {
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
            ? $this->parseColumnNames("{$tmpDir}/{$namesFile}")
            : null;

        $rawContent = file_get_contents("{$tmpDir}/{$dataFile}");
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
                $vals[] = $v === '' ? 'NULL' : "'" . addslashes($v) . "'";
            }
            $seed .= "INSERT INTO {$table} (" . implode(', ', $cols) . ") VALUES (" . implode(', ', $vals) . ");\n";
        }

        return [$schema, $seed];
    }

    private function cleanupDir(string $dir): void
    {
        if (!is_dir($dir)) return;
        foreach (array_diff(scandir($dir), ['.', '..']) as $f) {
            unlink("{$dir}/{$f}");
        }
        rmdir($dir);
    }
}
```

- [ ] **Step 2: Quick test via Tinker**

```bash
php artisan tinker
# $svc = new App\Services\UciDatasetService();
# $list = $svc->listDatasets();
# count($list); // should be 400+
# $data = $svc->fetchDataset(53); // Iris
# array_keys($data); // ['name','description','source_ref','schema_sql','seed_sql']
# echo substr($data['schema_sql'], 0, 200);
```

Expected: list has 400+ items, Iris returns schema_sql starting with `CREATE TABLE iris`.

- [ ] **Step 3: Commit**

```bash
git add backend/app/Services/UciDatasetService.php
git commit -m "feat(sql-game): add UCI dataset import service"
```

---

## Task 3: CSV/URL Dataset Parser Service

**Files:**
- Create: `backend/app/Services/DatasetParserService.php`

- [ ] **Step 1: Create the service**

```php
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
                    : "'" . addslashes($v) . "'";
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
            $vals = array_map(fn($v) => $v === null ? 'NULL' : "'" . addslashes((string) $v) . "'", array_values($row));
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
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/Services/DatasetParserService.php
git commit -m "feat(sql-game): add CSV/JSON/URL dataset parser service"
```

---

## Task 4: Public Config Controller

**Files:**
- Create: `backend/app/Http/Controllers/Api/SqlGameController.php`

- [ ] **Step 1: Create controller**

```php
<?php
// backend/app/Http/Controllers/Api/SqlGameController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SqlDataset;
use App\Models\SqlMission;

class SqlGameController extends Controller
{
    public function config()
    {
        $datasets = SqlDataset::where('is_active', true)
            ->get(['_id', 'name', 'description', 'schema_sql', 'seed_sql'])
            ->map(fn($d) => array_merge($d->toArray(), ['id' => (string) $d->_id]));

        $missions = SqlMission::where('is_active', true)
            ->orderBy('stage_order')
            ->get([
                '_id', 'dataset_id', 'stage_order', 'title', 'briefing',
                'tables', 'objectives', 'ordering_hint', 'ordered',
                'starter_sql', 'solution_query', 'rank_unlock',
            ])
            ->map(fn($m) => array_merge($m->toArray(), ['id' => (string) $m->_id]));

        return response()->json([
            'datasets' => $datasets->values(),
            'missions' => $missions->values(),
        ]);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/Http/Controllers/Api/SqlGameController.php
git commit -m "feat(sql-game): add public config endpoint controller"
```

---

## Task 5: Admin Dataset Controller

**Files:**
- Create: `backend/app/Http/Controllers/Api/Admin/AdminSqlDatasetController.php`

- [ ] **Step 1: Create controller**

```php
<?php
// backend/app/Http/Controllers/Api/Admin/AdminSqlDatasetController.php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SqlDataset;
use App\Services\DatasetParserService;
use App\Services\UciDatasetService;
use Illuminate\Http\Request;

class AdminSqlDatasetController extends Controller
{
    public function __construct(
        private UciDatasetService    $uciService,
        private DatasetParserService $parserService,
    ) {}

    public function index()
    {
        $datasets = SqlDataset::orderBy('created_at', 'desc')->get()
            ->map(fn($d) => array_merge($d->toArray(), ['id' => (string) $d->_id]));

        return response()->json($datasets->values());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'source'      => 'required|in:uci,url,upload',
            'source_ref'  => 'nullable|string',
            'schema_sql'  => 'required|string',
            'seed_sql'    => 'required|string',
            'is_active'   => 'boolean',
        ]);

        $dataset = SqlDataset::create($data);

        return response()->json(
            array_merge($dataset->toArray(), ['id' => (string) $dataset->_id]),
            201
        );
    }

    public function update(Request $request, string $id)
    {
        $dataset = SqlDataset::findOrFail($id);

        $data = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'source_ref'  => 'nullable|string',
            'schema_sql'  => 'sometimes|string',
            'seed_sql'    => 'sometimes|string',
            'is_active'   => 'boolean',
        ]);

        $dataset->update($data);

        return response()->json(array_merge($dataset->fresh()->toArray(), ['id' => $id]));
    }

    public function destroy(string $id)
    {
        $dataset = SqlDataset::findOrFail($id);
        // Hapus missions terkait
        \App\Models\SqlMission::where('dataset_id', $id)->delete();
        $dataset->delete();

        return response()->json(['message' => 'Dataset dihapus']);
    }

    public function toggle(string $id)
    {
        $dataset = SqlDataset::findOrFail($id);
        $dataset->update(['is_active' => !$dataset->is_active]);

        return response()->json(['is_active' => $dataset->fresh()->is_active]);
    }

    public function fetchUci(Request $request)
    {
        $request->validate(['uci_id' => 'required|integer']);

        try {
            $result = $this->uciService->fetchDataset((int) $request->uci_id);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json($result);
    }

    public function fetchUrl(Request $request)
    {
        $request->validate(['url' => 'required|url']);

        try {
            $result = $this->parserService->parseFromUrl($request->url);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json($result);
    }

    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt,json|max:5120',
            'name' => 'required|string|max:255',
        ]);

        try {
            $result = $this->parserService->parseFromUpload($request->file('file'));
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json(array_merge($result, ['name' => $request->name]));
    }

    public function uciList()
    {
        try {
            $list = $this->uciService->listDatasets();
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return response()->json($list);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/Http/Controllers/Api/Admin/AdminSqlDatasetController.php
git commit -m "feat(sql-game): add admin dataset controller with UCI/URL/upload import"
```

---

## Task 6: Admin Mission Controller

**Files:**
- Create: `backend/app/Http/Controllers/Api/Admin/AdminSqlMissionController.php`

- [ ] **Step 1: Create controller**

```php
<?php
// backend/app/Http/Controllers/Api/Admin/AdminSqlMissionController.php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SqlMission;
use Illuminate\Http\Request;

class AdminSqlMissionController extends Controller
{
    public function index(Request $request)
    {
        $query = SqlMission::orderBy('stage_order');

        if ($request->has('dataset_id')) {
            $query->where('dataset_id', $request->dataset_id);
        }

        $missions = $query->get()
            ->map(fn($m) => array_merge($m->toArray(), ['id' => (string) $m->_id]));

        return response()->json($missions->values());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'dataset_id'    => 'required|string',
            'stage_order'   => 'required|integer|min:1',
            'title'         => 'required|string|max:255',
            'briefing'      => 'required|string',
            'tables'        => 'required|array',
            'tables.*'      => 'string',
            'objectives'    => 'required|array',
            'objectives.*.col'  => 'required|string',
            'objectives.*.desc' => 'required|string',
            'ordering_hint' => 'nullable|string',
            'ordered'       => 'boolean',
            'starter_sql'   => 'nullable|string',
            'solution_query'=> 'required|string',
            'rank_unlock'   => 'nullable|string|max:100',
            'is_active'     => 'boolean',
        ]);

        $mission = SqlMission::create($data);

        return response()->json(
            array_merge($mission->toArray(), ['id' => (string) $mission->_id]),
            201
        );
    }

    public function update(Request $request, string $id)
    {
        $mission = SqlMission::findOrFail($id);

        $data = $request->validate([
            'dataset_id'    => 'sometimes|string',
            'stage_order'   => 'sometimes|integer|min:1',
            'title'         => 'sometimes|string|max:255',
            'briefing'      => 'sometimes|string',
            'tables'        => 'sometimes|array',
            'tables.*'      => 'string',
            'objectives'    => 'sometimes|array',
            'objectives.*.col'  => 'required_with:objectives|string',
            'objectives.*.desc' => 'required_with:objectives|string',
            'ordering_hint' => 'nullable|string',
            'ordered'       => 'boolean',
            'starter_sql'   => 'nullable|string',
            'solution_query'=> 'sometimes|string',
            'rank_unlock'   => 'nullable|string|max:100',
            'is_active'     => 'boolean',
        ]);

        $mission->update($data);

        return response()->json(array_merge($mission->fresh()->toArray(), ['id' => $id]));
    }

    public function destroy(string $id)
    {
        SqlMission::findOrFail($id)->delete();
        return response()->json(['message' => 'Mission dihapus']);
    }

    public function reorder(Request $request)
    {
        $request->validate([
            'order'    => 'required|array',
            'order.*'  => 'string',
        ]);

        foreach ($request->order as $index => $missionId) {
            SqlMission::where('_id', $missionId)->update(['stage_order' => $index + 1]);
        }

        return response()->json(['message' => 'Urutan disimpan']);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/Http/Controllers/Api/Admin/AdminSqlMissionController.php
git commit -m "feat(sql-game): add admin mission controller"
```

---

## Task 7: Backend Routes

**Files:**
- Modify: `backend/routes/api.php`

- [ ] **Step 1: Add routes to api.php**

Add this block at the end of the file, inside the existing `auth:sanctum` middleware group (mirroring the pattern of other admin routes):

```php
// ── SQL GAME — Public ───────────────────────────────────────
Route::get('/sql-game/config', [
    \App\Http\Controllers\Api\SqlGameController::class, 'config'
]);

// ── SQL GAME — Admin ────────────────────────────────────────
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {

    // Datasets
    Route::get('/sql-game/datasets',          [\App\Http\Controllers\Api\Admin\AdminSqlDatasetController::class, 'index']);
    Route::post('/sql-game/datasets',         [\App\Http\Controllers\Api\Admin\AdminSqlDatasetController::class, 'store']);
    Route::put('/sql-game/datasets/{id}',     [\App\Http\Controllers\Api\Admin\AdminSqlDatasetController::class, 'update']);
    Route::delete('/sql-game/datasets/{id}',  [\App\Http\Controllers\Api\Admin\AdminSqlDatasetController::class, 'destroy']);
    Route::patch('/sql-game/datasets/{id}/toggle', [\App\Http\Controllers\Api\Admin\AdminSqlDatasetController::class, 'toggle']);
    Route::post('/sql-game/datasets/fetch-uci',    [\App\Http\Controllers\Api\Admin\AdminSqlDatasetController::class, 'fetchUci']);
    Route::post('/sql-game/datasets/fetch-url',    [\App\Http\Controllers\Api\Admin\AdminSqlDatasetController::class, 'fetchUrl']);
    Route::post('/sql-game/datasets/upload',       [\App\Http\Controllers\Api\Admin\AdminSqlDatasetController::class, 'upload']);
    Route::get('/sql-game/datasets/uci-list',      [\App\Http\Controllers\Api\Admin\AdminSqlDatasetController::class, 'uciList']);

    // Missions
    Route::get('/sql-game/missions',          [\App\Http\Controllers\Api\Admin\AdminSqlMissionController::class, 'index']);
    Route::post('/sql-game/missions',         [\App\Http\Controllers\Api\Admin\AdminSqlMissionController::class, 'store']);
    Route::put('/sql-game/missions/{id}',     [\App\Http\Controllers\Api\Admin\AdminSqlMissionController::class, 'update']);
    Route::delete('/sql-game/missions/{id}',  [\App\Http\Controllers\Api\Admin\AdminSqlMissionController::class, 'destroy']);
    Route::post('/sql-game/missions/reorder', [\App\Http\Controllers\Api\Admin\AdminSqlMissionController::class, 'reorder']);
});
```

- [ ] **Step 2: Test routes are registered**

```bash
cd backend
php artisan route:list | grep sql-game
```

Expected: 14 routes listed (1 public + 13 admin).

- [ ] **Step 3: Test public endpoint (no datasets yet, should return empty)**

```bash
curl http://localhost:8000/api/sql-game/config
# Expected: {"datasets":[],"missions":[]}
```

- [ ] **Step 4: Commit**

```bash
git add backend/routes/api.php
git commit -m "feat(sql-game): register all sql-game API routes"
```

---

## Task 8: Frontend — Packages + Tailwind + Font

**Files:**
- Modify: `frontend/tailwind.config.js`
- Modify: `frontend/index.html`

- [ ] **Step 1: Install dnd-kit**

```bash
cd frontend
npm install @dnd-kit/core @dnd-kit/sortable
```

- [ ] **Step 2: Update tailwind.config.js**

Add `sql-*` color tokens and JetBrains Mono font inside `theme.extend`:

```js
// frontend/tailwind.config.js  — inside theme.extend.colors add:
colors: {
  // ... existing colors (background, surface, surface-2, border, accent, accent-muted, accent-dim)
  'sql-primary':   '#00FF41',
  'sql-secondary': '#00E5FF',
  'sql-tertiary':  '#FF00E5',
  'sql-dim':       '#6B7280',
},
// inside theme.extend.fontFamily add:
fontFamily: {
  // ... existing (sans, display)
  mono: ['"JetBrains Mono"', 'monospace'],
},
```

- [ ] **Step 3: Add JetBrains Mono to index.html**

In `frontend/index.html`, add this inside `<head>` after the existing font link:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

- [ ] **Step 4: Commit**

```bash
git add frontend/tailwind.config.js frontend/index.html frontend/package.json frontend/package-lock.json
git commit -m "feat(sql-game): add sql-* tailwind tokens, JetBrains Mono font, dnd-kit"
```

---

## Task 9: Frontend API Service Functions

**Files:**
- Modify: `frontend/src/services/api.js`

- [ ] **Step 1: Add sql-game functions to api.js**

Append these functions at the end of the existing `api.js` file (following the same pattern as existing admin functions):

```js
// ─── SQL GAME — Public ────────────────────────────────────────
export const getSqlGameConfig = () =>
  api.get('/sql-game/config').then(r => r.data)

// ─── SQL GAME — Admin Datasets ───────────────────────────────
export const adminGetSqlDatasets = () =>
  api.get('/admin/sql-game/datasets').then(r => r.data)

export const adminCreateSqlDataset = (data) =>
  api.post('/admin/sql-game/datasets', data).then(r => r.data)

export const adminUpdateSqlDataset = (id, data) =>
  api.put(`/admin/sql-game/datasets/${id}`, data).then(r => r.data)

export const adminDeleteSqlDataset = (id) =>
  api.delete(`/admin/sql-game/datasets/${id}`).then(r => r.data)

export const adminToggleSqlDataset = (id) =>
  api.patch(`/admin/sql-game/datasets/${id}/toggle`).then(r => r.data)

export const adminFetchUciDataset = (uciId) =>
  api.post('/admin/sql-game/datasets/fetch-uci', { uci_id: uciId }).then(r => r.data)

export const adminFetchUrlDataset = (url) =>
  api.post('/admin/sql-game/datasets/fetch-url', { url }).then(r => r.data)

export const adminUploadDataset = (formData) =>
  api.post('/admin/sql-game/datasets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)

export const adminGetUciList = () =>
  api.get('/admin/sql-game/datasets/uci-list').then(r => r.data)

// ─── SQL GAME — Admin Missions ────────────────────────────────
export const adminGetSqlMissions = (datasetId) =>
  api.get('/admin/sql-game/missions', { params: datasetId ? { dataset_id: datasetId } : {} }).then(r => r.data)

export const adminCreateSqlMission = (data) =>
  api.post('/admin/sql-game/missions', data).then(r => r.data)

export const adminUpdateSqlMission = (id, data) =>
  api.put(`/admin/sql-game/missions/${id}`, data).then(r => r.data)

export const adminDeleteSqlMission = (id) =>
  api.delete(`/admin/sql-game/missions/${id}`).then(r => r.data)

export const adminReorderSqlMissions = (order) =>
  api.post('/admin/sql-game/missions/reorder', { order }).then(r => r.data)
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/services/api.js
git commit -m "feat(sql-game): add sql-game API service functions"
```

---

## Task 10: Admin Routing + Layout

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/layout/AdminLayout.jsx`

- [ ] **Step 1: Add routes to App.jsx**

Add imports and routes inside the existing admin `<Route path="/binn">` group (after the last existing admin route):

```jsx
// Add imports at top of App.jsx:
import SqlGameDatasets from './pages/admin/SqlGameDatasets'
import SqlGameMissions from './pages/admin/SqlGameMissions'
import DatasetEditor from './pages/admin/sql-game/DatasetEditor'

// Inside <Route path="/binn"> group, add all four routes:
<Route path="sql-game/datasets" element={<RequireAuth><SqlGameDatasets /></RequireAuth>} />
<Route path="sql-game/datasets/new" element={<RequireAuth><DatasetEditor /></RequireAuth>} />
<Route path="sql-game/datasets/:id/edit" element={<RequireAuth><DatasetEditor /></RequireAuth>} />
<Route path="sql-game/missions" element={<RequireAuth><SqlGameMissions /></RequireAuth>} />
```

- [ ] **Step 2: Add SQL Game to AdminLayout sidebar**

In `frontend/src/components/layout/AdminLayout.jsx`, add a nav item for SQL Game. Find the existing navItems array and add:

```jsx
// Add import at top:
import { Database } from 'lucide-react'

// Add to navItems array (after existing items):
{ icon: Database, label: 'SQL Game', path: '/binn/sql-game/datasets' },
```

- [ ] **Step 3: Verify**

Start frontend dev server (`npm run dev`), log in to admin, confirm "SQL Game" appears in sidebar. Clicking it should navigate to `/binn/sql-game/datasets` (page will be blank — that's fine for now).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.jsx frontend/src/components/layout/AdminLayout.jsx
git commit -m "feat(sql-game): add sql-game routes and admin sidebar nav item"
```

---

## Task 11: Admin Datasets Page

**Files:**
- Create: `frontend/src/pages/admin/SqlGameDatasets.jsx`

- [ ] **Step 1: Create the page**

```jsx
// frontend/src/pages/admin/SqlGameDatasets.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Link, Upload, Search, ToggleLeft, ToggleRight, Pencil, Trash2 } from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout'
import {
  adminGetSqlDatasets, adminDeleteSqlDataset, adminToggleSqlDataset,
  adminCreateSqlDataset, adminFetchUrlDataset, adminUploadDataset,
} from '../../services/api'
import { useConfirm } from '../../hooks/useConfirm'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import UciBrowserModal from './sql-game/UciBrowserModal'

const sourceLabel = { uci: 'UCI', url: 'URL', upload: 'Upload' }

export default function SqlGameDatasets() {
  const navigate = useNavigate()
  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUci, setShowUci] = useState(false)
  const [urlModal, setUrlModal] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlError, setUrlError] = useState('')
  const { confirm, dialogProps } = useConfirm()

  useEffect(() => { load() }, [])

  const load = () => {
    setLoading(true)
    adminGetSqlDatasets()
      .then(setDatasets)
      .finally(() => setLoading(false))
  }

  const handleToggle = async (id) => {
    await adminToggleSqlDataset(id)
    load()
  }

  const handleDelete = async (id, name) => {
    if (!await confirm(`Hapus dataset "${name}"? Semua missions terkait juga akan dihapus.`)) return
    await adminDeleteSqlDataset(id)
    load()
  }

  const handleUciImport = (preview) => {
    // preview = { name, description, source_ref, schema_sql, seed_sql }
    setShowUci(false)
    navigate('/binn/sql-game/datasets/new', { state: { preview: { ...preview, source: 'uci' } } })
  }

  const handleUrlFetch = async () => {
    if (!urlInput.trim()) return
    setUrlLoading(true)
    setUrlError('')
    try {
      const preview = await adminFetchUrlDataset(urlInput.trim())
      setUrlModal(false)
      setUrlInput('')
      navigate('/binn/sql-game/datasets/new', { state: { preview: { ...preview, source: 'url', source_ref: urlInput.trim() } } })
    } catch (e) {
      setUrlError(e.response?.data?.error || 'Gagal mengambil data dari URL')
    } finally {
      setUrlLoading(false)
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const name = prompt('Nama dataset:', file.name.replace(/\.[^.]+$/, ''))
    if (!name) return
    const form = new FormData()
    form.append('file', file)
    form.append('name', name)
    try {
      const preview = await adminUploadDataset(form)
      navigate('/binn/sql-game/datasets/new', { state: { preview: { ...preview, name, source: 'upload' } } })
    } catch (e) {
      alert(e.response?.data?.error || 'Gagal memparse file')
    }
    e.target.value = ''
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-accent">SQL Game — Datasets</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowUci(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md text-accent hover:border-accent transition">
              <Search size={14} /> Browse UCI
            </button>
            <button onClick={() => setUrlModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md text-accent hover:border-accent transition">
              <Link size={14} /> Fetch URL
            </button>
            <label className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md text-accent hover:border-accent transition cursor-pointer">
              <Upload size={14} /> Upload
              <input type="file" accept=".csv,.json,.txt" className="hidden" onChange={handleUpload} />
            </label>
          </div>
        </div>

        {loading ? (
          <p className="text-accent-muted text-sm">Memuat...</p>
        ) : datasets.length === 0 ? (
          <p className="text-accent-muted text-sm">Belum ada dataset. Import dataset pertama kamu.</p>
        ) : (
          <div className="space-y-2">
            {datasets.map(d => (
              <div key={d.id} className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-accent font-medium truncate">{d.name}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-surface-2 text-accent-muted rounded">
                      {sourceLabel[d.source] || d.source}
                    </span>
                  </div>
                  {d.description && (
                    <p className="text-xs text-accent-muted mt-0.5 truncate">{d.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <button onClick={() => handleToggle(d.id)} title={d.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                    {d.is_active
                      ? <ToggleRight size={22} className="text-green-500" />
                      : <ToggleLeft size={22} className="text-accent-muted" />}
                  </button>
                  <button onClick={() => navigate(`/binn/sql-game/datasets/${d.id}/edit`)}
                    className="p-1.5 text-accent-muted hover:text-accent transition">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(d.id, d.name)}
                    className="p-1.5 text-accent-muted hover:text-red-400 transition">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* URL Fetch Modal */}
      {urlModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md">
            <h3 className="text-accent font-semibold mb-4">Fetch dari URL</h3>
            <input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="https://... (CSV atau JSON)"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm mb-2 outline-none focus:border-accent"
            />
            {urlError && <p className="text-red-400 text-xs mb-2">{urlError}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setUrlModal(false); setUrlError('') }}
                className="px-4 py-2 text-sm text-accent-muted hover:text-accent">Batal</button>
              <button onClick={handleUrlFetch} disabled={urlLoading}
                className="px-4 py-2 text-sm bg-accent text-background rounded-lg disabled:opacity-50">
                {urlLoading ? 'Mengambil...' : 'Fetch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUci && <UciBrowserModal onSelect={handleUciImport} onClose={() => setShowUci(false)} />}
      <ConfirmDialog {...dialogProps} />
    </AdminLayout>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/admin/SqlGameDatasets.jsx frontend/src/App.jsx
git commit -m "feat(sql-game): add datasets admin page"
```

---

## Task 12: UCI Browser Modal

**Files:**
- Create: `frontend/src/pages/admin/sql-game/UciBrowserModal.jsx`

- [ ] **Step 1: Create directory and file**

```bash
mkdir -p frontend/src/pages/admin/sql-game
```

```jsx
// frontend/src/pages/admin/sql-game/UciBrowserModal.jsx
import { useState, useEffect } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { adminGetUciList, adminFetchUciDataset } from '../../../services/api'

export default function UciBrowserModal({ onSelect, onClose }) {
  const [list, setList] = useState([])
  const [filtered, setFiltered] = useState([])
  const [query, setQuery] = useState('')
  const [listLoading, setListLoading] = useState(true)
  const [fetchLoading, setFetchLoading] = useState(null) // id being fetched
  const [error, setError] = useState('')

  useEffect(() => {
    adminGetUciList()
      .then(data => { setList(data); setFiltered(data) })
      .catch(() => setError('Gagal memuat daftar UCI datasets'))
      .finally(() => setListLoading(false))
  }, [])

  useEffect(() => {
    const q = query.toLowerCase()
    setFiltered(list.filter(d => d.name.toLowerCase().includes(q)))
  }, [query, list])

  const handleSelect = async (dataset) => {
    setFetchLoading(dataset.id)
    setError('')
    try {
      const preview = await adminFetchUciDataset(dataset.id)
      onSelect(preview)
    } catch (e) {
      setError(e.response?.data?.error || `Gagal mengambil dataset ${dataset.name}`)
      setFetchLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-xl w-full max-w-lg flex flex-col" style={{ maxHeight: '80vh' }}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-accent font-semibold">Browse UCI ML Repository</h3>
          <button onClick={onClose} className="text-accent-muted hover:text-accent">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-muted" />
            <input
              type="text"
              placeholder="Cari dataset..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-accent text-sm outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {listLoading ? (
            <div className="flex items-center justify-center py-12 text-accent-muted">
              <Loader2 size={18} className="animate-spin mr-2" /> Memuat...
            </div>
          ) : error ? (
            <p className="text-red-400 text-sm text-center py-8">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="text-accent-muted text-sm text-center py-8">Tidak ditemukan</p>
          ) : (
            filtered.slice(0, 100).map(d => (
              <button
                key={d.id}
                onClick={() => handleSelect(d)}
                disabled={fetchLoading !== null}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-surface-2 transition text-left disabled:opacity-60"
              >
                <span className="text-accent text-sm">{d.name}</span>
                {fetchLoading === d.id && <Loader2 size={14} className="animate-spin text-accent-muted" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/admin/sql-game/UciBrowserModal.jsx
git commit -m "feat(sql-game): add UCI browser modal for admin dataset import"
```

---

## Task 13: Dataset Editor Page

**Files:**
- Create: `frontend/src/pages/admin/sql-game/DatasetEditor.jsx`

- [ ] **Step 1: Create the editor**

```jsx
// frontend/src/pages/admin/sql-game/DatasetEditor.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Save, ArrowLeft } from 'lucide-react'
import AdminLayout from '../../../components/layout/AdminLayout'
import {
  adminCreateSqlDataset, adminUpdateSqlDataset, adminGetSqlDatasets,
} from '../../../services/api'

const empty = {
  name: '', description: '', source: 'upload',
  source_ref: '', schema_sql: '', seed_sql: '', is_active: false,
}

export default function DatasetEditor() {
  const navigate = useNavigate()
  const { id } = useParams()           // undefined = new
  const { state } = useLocation()      // { preview } from import flow
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isNew = !id || id === 'new'

  useEffect(() => {
    if (state?.preview) {
      setForm(f => ({ ...f, ...state.preview }))
    } else if (!isNew) {
      adminGetSqlDatasets().then(list => {
        const found = list.find(d => d.id === id)
        if (found) setForm({ ...empty, ...found })
      })
    }
  }, [id])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))
  const setCheck = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.checked }))

  const handleSave = async () => {
    if (!form.name.trim() || !form.schema_sql.trim() || !form.seed_sql.trim()) {
      setError('Nama, Schema SQL, dan Seed SQL wajib diisi')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (isNew) {
        await adminCreateSqlDataset({ ...form, source: form.source || 'upload' })
      } else {
        await adminUpdateSqlDataset(id, form)
      }
      navigate('/binn/sql-game/datasets')
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/binn/sql-game/datasets')}
            className="text-accent-muted hover:text-accent transition">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-semibold text-accent">
            {isNew ? 'Import Dataset Baru' : 'Edit Dataset'}
          </h1>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-accent-muted mb-1">Nama Dataset *</label>
              <input value={form.name} onChange={set('name')}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-xs text-accent-muted mb-1">Sumber</label>
              <select value={form.source} onChange={set('source')}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent">
                <option value="uci">UCI ML Repository</option>
                <option value="url">URL</option>
                <option value="upload">Upload</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-accent-muted mb-1">Deskripsi</label>
            <textarea value={form.description} onChange={set('description')} rows={2}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent resize-none" />
          </div>

          <div>
            <label className="block text-xs text-accent-muted mb-1">Schema SQL (DDL) *</label>
            <textarea value={form.schema_sql} onChange={set('schema_sql')} rows={10}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm font-mono outline-none focus:border-accent resize-y" />
          </div>

          <div>
            <label className="block text-xs text-accent-muted mb-1">Seed SQL (INSERT) *</label>
            <textarea value={form.seed_sql} onChange={set('seed_sql')} rows={10}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm font-mono outline-none focus:border-accent resize-y" />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" checked={form.is_active} onChange={setCheck('is_active')}
              className="rounded" />
            <label htmlFor="is_active" className="text-sm text-accent">Aktifkan dataset (tampil di game)</label>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-accent text-background rounded-lg text-sm font-medium disabled:opacity-50">
              <Save size={14} /> {saving ? 'Menyimpan...' : 'Simpan Dataset'}
            </button>
            <button onClick={() => navigate('/binn/sql-game/datasets')}
              className="px-5 py-2 border border-border rounded-lg text-sm text-accent-muted hover:text-accent transition">
              Batal
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/admin/sql-game/DatasetEditor.jsx
git commit -m "feat(sql-game): add dataset editor page (schema + seed textarea)"
```

---

## Task 14: Admin Missions Page

**Files:**
- Create: `frontend/src/pages/admin/SqlGameMissions.jsx`
- Create: `frontend/src/pages/admin/sql-game/MissionForm.jsx`

- [ ] **Step 1: Create MissionForm component**

```jsx
// frontend/src/pages/admin/sql-game/MissionForm.jsx
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

const emptyObjective = { col: '', desc: '' }

export default function MissionForm({ form, onChange, datasets }) {
  const set = (key) => (e) => onChange({ ...form, [key]: e.target.value })
  const setCheck = (key) => (e) => onChange({ ...form, [key]: e.target.checked })

  const setTables = (e) => {
    const raw = e.target.value
    onChange({ ...form, tablesRaw: raw, tables: raw.split(',').map(s => s.trim()).filter(Boolean) })
  }

  const addObjective = () => onChange({ ...form, objectives: [...form.objectives, { ...emptyObjective }] })
  const removeObjective = (i) => onChange({ ...form, objectives: form.objectives.filter((_, idx) => idx !== i) })
  const setObjective = (i, key, val) => {
    const objs = [...form.objectives]
    objs[i] = { ...objs[i], [key]: val }
    onChange({ ...form, objectives: objs })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-accent-muted mb-1">Judul Mission *</label>
          <input value={form.title} onChange={set('title')}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent" />
        </div>
        <div>
          <label className="block text-xs text-accent-muted mb-1">Dataset *</label>
          <select value={form.dataset_id} onChange={set('dataset_id')}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent">
            <option value="">Pilih dataset...</option>
            {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-accent-muted mb-1">Stage Order *</label>
          <input type="number" min="1" value={form.stage_order} onChange={set('stage_order')}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent" />
        </div>
        <div>
          <label className="block text-xs text-accent-muted mb-1">Rank Unlock</label>
          <input value={form.rank_unlock} onChange={set('rank_unlock')} placeholder="Query Runner"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent" />
        </div>
      </div>

      <div>
        <label className="block text-xs text-accent-muted mb-1">Briefing *</label>
        <textarea value={form.briefing} onChange={set('briefing')} rows={3}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent resize-none" />
      </div>

      <div>
        <label className="block text-xs text-accent-muted mb-1">Tabel (pisahkan dengan koma)</label>
        <input value={form.tablesRaw} onChange={setTables} placeholder="instruktur, kursus, pendaftaran"
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-accent-muted">Objectives *</label>
          <button type="button" onClick={addObjective}
            className="flex items-center gap-1 text-xs text-accent-muted hover:text-accent">
            <Plus size={12} /> Tambah
          </button>
        </div>
        {form.objectives.map((obj, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input value={obj.col} onChange={e => setObjective(i, 'col', e.target.value)}
              placeholder="nama_kolom"
              className="w-1/3 bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent font-mono" />
            <input value={obj.desc} onChange={e => setObjective(i, 'desc', e.target.value)}
              placeholder="Deskripsi objektif"
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent" />
            <button type="button" onClick={() => removeObjective(i)}
              className="text-accent-muted hover:text-red-400 px-2">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs text-accent-muted mb-1">Ordering Hint (teks magenta di sidebar)</label>
        <input value={form.ordering_hint} onChange={set('ordering_hint')}
          placeholder="Urutkan berdasarkan total_mahasiswa DESC."
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent" />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-accent cursor-pointer">
          <input type="checkbox" checked={form.ordered} onChange={setCheck('ordered')} />
          Urutan baris diuji (ordered)
        </label>
        <label className="flex items-center gap-2 text-sm text-accent cursor-pointer">
          <input type="checkbox" checked={form.is_active} onChange={setCheck('is_active')} />
          Aktif
        </label>
      </div>

      <div>
        <label className="block text-xs text-accent-muted mb-1">Starter SQL</label>
        <textarea value={form.starter_sql} onChange={set('starter_sql')} rows={4}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm font-mono outline-none focus:border-accent resize-y" />
      </div>

      <div>
        <label className="block text-xs text-accent-muted mb-1">Solution Query *</label>
        <textarea value={form.solution_query} onChange={set('solution_query')} rows={8}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm font-mono outline-none focus:border-accent resize-y" />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create SqlGameMissions page**

```jsx
// frontend/src/pages/admin/SqlGameMissions.jsx
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, GripVertical, Save, X } from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import AdminLayout from '../../components/layout/AdminLayout'
import {
  adminGetSqlMissions, adminGetSqlDatasets, adminCreateSqlMission,
  adminUpdateSqlMission, adminDeleteSqlMission, adminReorderSqlMissions,
} from '../../services/api'
import { useConfirm } from '../../hooks/useConfirm'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import MissionForm from './sql-game/MissionForm'

const emptyForm = {
  dataset_id: '', stage_order: 1, title: '', briefing: '',
  tables: [], tablesRaw: '', objectives: [{ col: '', desc: '' }],
  ordering_hint: '', ordered: false, starter_sql: '', solution_query: '',
  rank_unlock: '', is_active: true,
}

function SortableRow({ mission, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: mission.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg">
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners} className="text-accent-muted cursor-grab active:cursor-grabbing">
          <GripVertical size={16} />
        </button>
        <div>
          <span className="text-xs text-accent-muted mr-2">Stage {mission.stage_order}</span>
          <span className="text-accent text-sm font-medium">{mission.title}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onEdit(mission)} className="p-1.5 text-accent-muted hover:text-accent">
          <Pencil size={14} />
        </button>
        <button onClick={() => onDelete(mission)} className="p-1.5 text-accent-muted hover:text-red-400">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

export default function SqlGameMissions() {
  const [missions, setMissions] = useState([])
  const [datasets, setDatasets] = useState([])
  const [filterDataset, setFilterDataset] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { confirm, dialogProps } = useConfirm()
  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => {
    adminGetSqlDatasets().then(setDatasets)
    loadMissions()
  }, [])

  useEffect(() => { loadMissions() }, [filterDataset])

  const loadMissions = () => adminGetSqlMissions(filterDataset || null).then(setMissions)

  const openCreate = () => {
    setForm({ ...emptyForm, dataset_id: filterDataset || '' })
    setEditId(null)
    setModal(true)
  }

  const openEdit = (m) => {
    setForm({ ...emptyForm, ...m, tablesRaw: (m.tables || []).join(', ') })
    setEditId(m.id)
    setModal(true)
  }

  const handleDelete = async (m) => {
    if (!await confirm(`Hapus mission "${m.title}"?`)) return
    await adminDeleteSqlMission(m.id)
    loadMissions()
  }

  const handleSave = async () => {
    if (!form.title || !form.dataset_id || !form.solution_query) {
      setError('Judul, Dataset, dan Solution Query wajib diisi')
      return
    }
    setSaving(true)
    setError('')
    const payload = { ...form }
    delete payload.tablesRaw
    try {
      if (editId) await adminUpdateSqlMission(editId, payload)
      else await adminCreateSqlMission(payload)
      setModal(false)
      loadMissions()
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return
    const oldIdx = missions.findIndex(m => m.id === active.id)
    const newIdx = missions.findIndex(m => m.id === over.id)
    const reordered = arrayMove(missions, oldIdx, newIdx)
    setMissions(reordered)
    await adminReorderSqlMissions(reordered.map(m => m.id))
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-accent">SQL Game — Missions</h1>
          <button onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-accent text-background rounded-lg">
            <Plus size={14} /> New Mission
          </button>
        </div>

        <div className="mb-4">
          <select value={filterDataset} onChange={e => setFilterDataset(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent">
            <option value="">Semua Dataset</option>
            {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={missions.map(m => m.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {missions.length === 0
                ? <p className="text-accent-muted text-sm">Belum ada mission untuk dataset ini.</p>
                : missions.map(m => (
                    <SortableRow key={m.id} mission={m} onEdit={openEdit} onDelete={handleDelete} />
                  ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Mission Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-surface border border-border rounded-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-accent font-semibold">{editId ? 'Edit Mission' : 'New Mission'}</h3>
              <button onClick={() => setModal(false)} className="text-accent-muted hover:text-accent">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <MissionForm form={form} onChange={setForm} datasets={datasets} />
              {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
              <div className="flex gap-3 mt-4">
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-accent text-background rounded-lg text-sm font-medium disabled:opacity-50">
                  <Save size={14} /> {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button onClick={() => setModal(false)}
                  className="px-5 py-2 border border-border rounded-lg text-sm text-accent-muted hover:text-accent">
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog {...dialogProps} />
    </AdminLayout>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/admin/sql-game/MissionForm.jsx frontend/src/pages/admin/SqlGameMissions.jsx
git commit -m "feat(sql-game): add missions admin page with drag reorder"
```

---

## Task 15: Smoke Test + Final Commit

- [ ] **Step 1: Test full backend flow**

```bash
# Start backend
cd backend && php artisan serve

# 1. Public config (should return empty)
curl http://localhost:8000/api/sql-game/config
# Expected: {"datasets":[],"missions":[]}

# 2. Login as admin (get token)
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASS"}' | jq -r '.token')

# 3. Get UCI list
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/admin/sql-game/datasets/uci-list | jq 'length'
# Expected: 400+

# 4. Create a dataset manually
curl -X POST http://localhost:8000/api/admin/sql-game/datasets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","source":"upload","schema_sql":"CREATE TABLE t (id INTEGER PRIMARY KEY)","seed_sql":"","is_active":true}'
# Expected: 201 with dataset object
```

- [ ] **Step 2: Test admin UI flow**

1. Start frontend (`npm run dev`)
2. Login ke admin → sidebar ada "SQL Game"
3. Klik "Browse UCI" → modal terbuka, tampil list dataset
4. Pilih "Iris" → loading → redirect ke DatasetEditor dengan schema/seed pre-filled
5. Cek schema_sql dan seed_sql ter-generate
6. Save → dataset muncul di list
7. Toggle ON/OFF bekerja
8. Buat 1 mission untuk dataset itu → pastikan form tersimpan
9. Drag reorder missions → urutan berubah

- [ ] **Step 3: Build check**

```bash
cd frontend && npm run build
# Expected: no errors, dist/ folder generated
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(sql-game): complete Plan 1 — backend + admin panel

- MongoDB models: SqlDataset, SqlMission
- UCI import service (ZIP download + parse)
- CSV/JSON/URL parser service
- Public config API endpoint
- Admin CRUD for datasets and missions
- Admin pages: datasets list, UCI browser, dataset editor, missions with drag reorder
- Tailwind sql-* tokens + JetBrains Mono font"
```
