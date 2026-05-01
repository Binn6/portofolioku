<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminProjectController extends Controller
{
    public function index()
    {
        return response()->json(Project::all()->map(fn($p) => $this->withUrl($p)));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:200',
            'description' => 'required|string',
            'tech_stack' => 'required|array',
            'thumbnail' => 'nullable|file|mimes:jpeg,png,webp|max:2048',
            'github_url' => 'nullable|url',
            'live_url' => 'nullable|url',
            'is_featured' => 'boolean',
        ]);

        if ($request->hasFile('thumbnail')) {
            $data['thumbnail_path'] = $request->file('thumbnail')->store('projects', 'public');
        }
        unset($data['thumbnail']);

        return response()->json($this->withUrl(Project::create($data)), 201);
    }

    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        $data = $request->validate([
            'title' => 'sometimes|string|max:200',
            'description' => 'sometimes|string',
            'tech_stack' => 'sometimes|array',
            'thumbnail' => 'nullable|file|mimes:jpeg,png,webp|max:2048',
            'github_url' => 'nullable|url',
            'live_url' => 'nullable|url',
            'is_featured' => 'boolean',
        ]);

        if ($request->hasFile('thumbnail')) {
            if ($project->thumbnail_path) {
                Storage::disk('public')->delete($project->thumbnail_path);
            }
            $data['thumbnail_path'] = $request->file('thumbnail')->store('projects', 'public');
        }
        unset($data['thumbnail']);

        $project->update($data);
        return response()->json($this->withUrl($project));
    }

    public function destroy($id)
    {
        $project = Project::findOrFail($id);
        if ($project->thumbnail_path) {
            Storage::disk('public')->delete($project->thumbnail_path);
        }
        $project->delete();
        return response()->json(null, 204);
    }

    private function withUrl($project)
    {
        if ($project->thumbnail_path) {
            $project->thumbnail_url = url('storage/' . $project->thumbnail_path);
        }
        return $project;
    }
}
