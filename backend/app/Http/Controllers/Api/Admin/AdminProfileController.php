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
        // Whitelist fields and convert empty strings to null before validation
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
            'github'    => 'sometimes|nullable|string|max:255',
            'linkedin'  => 'sometimes|nullable|string|max:255',
            'instagram' => 'sometimes|nullable|string|max:255',
        ])->validate();

        $profile = Profile::first();
        if ($profile) {
            $profile->update($data);
        } else {
            $profile = Profile::create($data);
        }

        return response()->json($profile);
    }
}
