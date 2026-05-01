<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Experience;

class ExperienceController extends Controller
{
    public function index()
    {
        return response()->json(Experience::orderBy('start_date', 'desc')->get());
    }
}
