<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Experience;
use Illuminate\Http\Request;

class AdminExperienceController extends Controller
{
    public function index()
    {
        return response()->json(Experience::all());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:200',
            'company' => 'required|string|max:200',
            'type' => 'required|in:internship,organization',
            'start_date' => 'required|string',
            'end_date' => 'nullable|string',
            'description' => 'required|string',
            'is_current' => 'boolean',
        ]);
        return response()->json(Experience::create($data), 201);
    }

    public function update(Request $request, $id)
    {
        $exp = Experience::findOrFail($id);
        $data = $request->validate([
            'title' => 'sometimes|string|max:200',
            'company' => 'sometimes|string|max:200',
            'type' => 'sometimes|in:internship,organization',
            'start_date' => 'sometimes|string',
            'end_date' => 'nullable|string',
            'description' => 'sometimes|string',
            'is_current' => 'boolean',
        ]);
        $exp->update($data);
        return response()->json($exp);
    }

    public function destroy($id)
    {
        Experience::findOrFail($id)->delete();
        return response()->json(null, 204);
    }
}
