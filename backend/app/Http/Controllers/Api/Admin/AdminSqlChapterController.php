<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SqlChapter;
use App\Models\SqlSubchapter;
use Illuminate\Http\Request;

class AdminSqlChapterController extends Controller
{
    public function index()
    {
        $chapters = SqlChapter::orderBy('order')
            ->get()
            ->map(fn($c) => array_merge($c->toArray(), ['id' => (string) $c->_id]));

        return response()->json($chapters->values());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'order'       => 'required|integer',
            'color'       => 'nullable|string|max:20',
        ]);

        $chapter = SqlChapter::create($data);

        return response()->json(
            array_merge($chapter->toArray(), ['id' => (string) $chapter->_id]),
            201
        );
    }

    public function update(Request $request, string $id)
    {
        $chapter = SqlChapter::findOrFail($id);

        $data = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'order'       => 'sometimes|integer',
            'color'       => 'nullable|string|max:20',
        ]);

        $chapter->update($data);

        return response()->json(array_merge($chapter->fresh()->toArray(), ['id' => $id]));
    }

    public function destroy(string $id)
    {
        $chapter = SqlChapter::findOrFail($id);

        SqlSubchapter::where('chapter_id', $id)->delete();
        \App\Models\SqlDataset::where('chapter_id', $id)
            ->update(['chapter_id' => null, 'subchapter_id' => null]);

        $chapter->delete();

        return response()->json(['message' => 'Chapter dihapus']);
    }
}
