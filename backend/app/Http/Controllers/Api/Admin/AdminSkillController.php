<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Skill;
use Illuminate\Http\Request;

class AdminSkillController extends Controller
{
    public function index()
    {
        return response()->json(Skill::all());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'category' => 'required|in:Languages,Frameworks,Data,Tools,Soft Skills',
            'level' => 'required|integer|min:1|max:5',
        ]);
        return response()->json(Skill::create($data), 201);
    }

    public function update(Request $request, $id)
    {
        $skill = Skill::findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|string|max:100',
            'category' => 'sometimes|in:Languages,Frameworks,Data,Tools,Soft Skills',
            'level' => 'sometimes|integer|min:1|max:5',
        ]);
        $skill->update($data);
        return response()->json($skill);
    }

    public function destroy($id)
    {
        Skill::findOrFail($id)->delete();
        return response()->json(null, 204);
    }
}
