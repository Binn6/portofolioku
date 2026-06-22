<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SqlSubchapter;
use Illuminate\Http\Request;

class AdminSqlSubchapterController extends Controller
{
    public function index(Request $request)
    {
        $query = SqlSubchapter::orderBy('order');

        if ($request->filled('chapter_id')) {
            $query->where('chapter_id', $request->chapter_id);
        }

        $items = $query->get()
            ->map(fn($s) => array_merge($s->toArray(), ['id' => (string) $s->_id]));

        return response()->json($items->values());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'chapter_id'  => 'required|string',
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'order'       => 'required|integer',
        ]);

        $sub = SqlSubchapter::create($data);

        return response()->json(
            array_merge($sub->toArray(), ['id' => (string) $sub->_id]),
            201
        );
    }

    public function update(Request $request, string $id)
    {
        $sub = SqlSubchapter::findOrFail($id);

        $data = $request->validate([
            'chapter_id'  => 'sometimes|string',
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'order'       => 'sometimes|integer',
        ]);

        $sub->update($data);

        return response()->json(array_merge($sub->fresh()->toArray(), ['id' => $id]));
    }

    public function destroy(string $id)
    {
        $sub = SqlSubchapter::findOrFail($id);

        \App\Models\SqlDataset::where('subchapter_id', $id)
            ->update(['subchapter_id' => null]);

        $sub->delete();

        return response()->json(['message' => 'Sub-chapter dihapus']);
    }
}
