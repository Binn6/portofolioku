<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;

class ProjectController extends Controller
{
    public function index()
    {
        $projects = Project::all()->map(function ($p) {
            if ($p->thumbnail_path) {
                $p->thumbnail_url = url('storage/' . $p->thumbnail_path);
            }
            return $p;
        });
        return response()->json($projects);
    }
}
