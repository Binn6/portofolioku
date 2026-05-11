<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profile;

class ProfileController extends Controller
{
    public function show()
    {
        $profile = Profile::first();
        if (!$profile) {
            return response()->json(null);
        }

        if ($profile->cv_path) {
            $profile->cv_url = $profile->cv_path;
        }
        if ($profile->photo_path) {
            $profile->photo_url = $profile->photo_path;
        }

        $profile->makeHidden(['cv_path', 'photo_path', 'photo_public_id', 'cv_public_id']);

        return response()->json($profile);
    }
}
