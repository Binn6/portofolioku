<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Services\CloudinaryService;
use Illuminate\Http\Request;

class AdminProjectController extends Controller
{
    public function __construct(private CloudinaryService $cloudinary) {}

    public function index()
    {
        return response()->json(Project::all()->map(fn($p) => $this->withUrl($p)));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'       => 'required|string|max:200',
            'description' => 'required|string',
            'tech_stack'  => 'required|array',
            'thumbnail'   => 'nullable|file|mimes:jpeg,png,webp|max:2048',
            'github_url'  => 'nullable|url',
            'live_url'    => 'nullable|url',
            'is_featured' => 'boolean',
            'type'        => 'nullable|string|max:50',
        ]);

        if ($request->hasFile('thumbnail')) {
            $uploaded = $this->cloudinary->upload($request->file('thumbnail'), 'portfolio/projects');
            $data['thumbnail_path']      = $uploaded['url'];
            $data['thumbnail_public_id'] = $uploaded['public_id'];
        }
        unset($data['thumbnail']);

        return response()->json($this->withUrl(Project::create($data)), 201);
    }

    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        $data = $request->validate([
            'title'       => 'sometimes|string|max:200',
            'description' => 'sometimes|string',
            'tech_stack'  => 'sometimes|array',
            'thumbnail'   => 'nullable|file|mimes:jpeg,png,webp|max:2048',
            'github_url'  => 'nullable|url',
            'live_url'    => 'nullable|url',
            'is_featured' => 'boolean',
            'type'        => 'nullable|string|max:50',
        ]);

        if ($request->hasFile('thumbnail')) {
            if ($project->thumbnail_public_id) {
                $this->cloudinary->delete($project->thumbnail_public_id);
            }
            $uploaded = $this->cloudinary->upload($request->file('thumbnail'), 'portfolio/projects');
            $data['thumbnail_path']      = $uploaded['url'];
            $data['thumbnail_public_id'] = $uploaded['public_id'];
        }
        unset($data['thumbnail']);

        $project->update($data);
        return response()->json($this->withUrl($project));
    }

    public function destroy($id)
    {
        $project = Project::findOrFail($id);
        if ($project->thumbnail_public_id) {
            $this->cloudinary->delete($project->thumbnail_public_id);
        }
        $project->delete();
        return response()->json(null, 204);
    }

    private function withUrl($project)
    {
        if ($project->thumbnail_path) {
            $project->thumbnail_url = $project->thumbnail_path;
        }
        return $project;
    }
}
