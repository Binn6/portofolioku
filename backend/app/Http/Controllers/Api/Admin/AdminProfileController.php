<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Services\CloudinaryService;
use Illuminate\Http\Request;

class AdminProfileController extends Controller
{
    public function __construct(private CloudinaryService $cloudinary) {}

    private function withUrls(Profile $profile): Profile
    {
        if ($profile->photo_path) {
            $profile->photo_url = $profile->photo_path;
        }
        if ($profile->cv_path) {
            $profile->cv_url = $profile->cv_path;
        }
        return $profile;
    }

    public function show()
    {
        $profile = Profile::first();
        if ($profile) {
            $profile = $this->withUrls($profile);
        }
        return response()->json($profile);
    }

    public function update(Request $request)
    {
        $input = array_map(
            fn($v) => $v === '' ? null : $v,
            $request->only(['name', 'title', 'bio', 'location', 'email', 'phone', 'github', 'linkedin', 'instagram'])
        );

        $data = validator($input, [
            'name'      => 'sometimes|nullable|string|max:100',
            'title'     => 'sometimes|nullable|string|max:100',
            'bio'       => 'sometimes|nullable|string|max:2000',
            'location'  => 'sometimes|nullable|string|max:100',
            'email'     => 'sometimes|nullable|email',
            'phone'     => 'sometimes|nullable|string|max:20',
            'github'    => 'sometimes|nullable|url|max:255',
            'linkedin'  => 'sometimes|nullable|url|max:255',
            'instagram' => 'sometimes|nullable|url|max:255',
        ])->validate();

        $profile = Profile::first();
        if ($profile) {
            $profile->update($data);
        } else {
            $profile = Profile::create($data);
        }

        return response()->json($this->withUrls($profile));
    }

    public function updatePhoto(Request $request)
    {
        $request->validate([
            'photo' => 'required|file|mimes:jpeg,png,webp|max:2048',
        ]);

        $profile = Profile::first() ?? Profile::create([]);

        if ($profile->photo_public_id) {
            $this->cloudinary->delete($profile->photo_public_id);
        }

        $uploaded = $this->cloudinary->upload($request->file('photo'), 'portfolio/profile');

        $profile->photo_path      = $uploaded['url'];
        $profile->photo_public_id = $uploaded['public_id'];
        $profile->save();

        return response()->json(['photo_url' => $uploaded['url']]);
    }
}
