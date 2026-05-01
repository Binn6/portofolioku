<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use Illuminate\Http\Request;

class AdminProfileController extends Controller
{
    public function show()
    {
        return response()->json(Profile::first());
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:100',
            'title' => 'sometimes|string|max:100',
            'bio' => 'sometimes|string|max:2000',
            'location' => 'sometimes|string|max:100',
            'email' => 'sometimes|email',
            'phone' => 'sometimes|string|max:20',
            'github' => 'sometimes|nullable|url',
            'linkedin' => 'sometimes|nullable|url',
            'instagram' => 'sometimes|nullable|url',
        ]);

        $profile = Profile::first();
        if ($profile) {
            $profile->update($data);
        } else {
            $profile = Profile::create($data);
        }

        return response()->json($profile);
    }
}
