<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Services\CloudinaryService;
use Illuminate\Http\Request;

class AdminCvController extends Controller
{
    public function __construct(private CloudinaryService $cloudinary) {}

    public function update(Request $request)
    {
        $request->validate([
            'cv' => 'required|file|mimes:pdf|max:5120',
        ]);

        $profile = Profile::first();

        if ($profile && $profile->cv_public_id) {
            $this->cloudinary->delete($profile->cv_public_id, 'raw');
        }

        $uploaded = $this->cloudinary->upload($request->file('cv'), 'portfolio/cv', 'raw');

        Profile::updateOrCreate([], [
            'cv_path'      => $uploaded['url'],
            'cv_public_id' => $uploaded['public_id'],
        ]);

        return response()->json(['cv_url' => $uploaded['url']]);
    }
}
