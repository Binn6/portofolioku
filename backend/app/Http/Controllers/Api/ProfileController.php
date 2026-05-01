<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profile;

class ProfileController extends Controller
{
    public function show()
    {
        $profile = Profile::first();
        if ($profile && $profile->cv_path) {
            $profile->cv_url = url('storage/' . $profile->cv_path);
        }
        return response()->json($profile);
    }
}
