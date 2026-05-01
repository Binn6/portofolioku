<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminCvController extends Controller
{
    public function update(Request $request)
    {
        $request->validate([
            'cv' => 'required|file|mimes:pdf|max:5120',
        ]);

        $profile = Profile::first();
        if ($profile && $profile->cv_path) {
            Storage::disk('public')->delete($profile->cv_path);
        }

        $path = $request->file('cv')->storeAs('cv', 'cv.pdf', 'public');

        if ($profile) {
            $profile->update(['cv_path' => $path]);
        }

        return response()->json(['cv_url' => url('storage/' . $path)]);
    }
}
