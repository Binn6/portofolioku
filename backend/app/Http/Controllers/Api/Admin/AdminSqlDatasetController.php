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
            'file' => 'required|file|max:10240',
            'name' => 'required|string|max:255',
        ]);

        $allowed = ['csv', 'txt', 'json', 'xlsx', 'xls'];
        $ext     = strtolower($request->file('file')->getClientOriginalExtension());
        if (!in_array($ext, $allowed)) {
            return response()->json(['error' => 'Format file tidak didukung. Gunakan CSV, JSON, atau Excel (.xlsx/.xls)'], 422);
        }

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
