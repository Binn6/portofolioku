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
