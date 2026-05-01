<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminCertificateController extends Controller
{
    public function index()
    {
        return response()->json(Certificate::all()->map(fn($c) => $this->withUrl($c)));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:200',
            'issuer' => 'required|string|max:200',
            'date' => 'required|string',
            'category' => 'required|in:Web,Data',
            'file' => 'nullable|file|mimes:jpeg,png,webp,pdf|max:5120',
        ]);

        if ($request->hasFile('file')) {
            $data['file_path'] = $request->file('file')->store('certificates', 'public');
        }
        unset($data['file']);

        return response()->json($this->withUrl(Certificate::create($data)), 201);
    }

    public function update(Request $request, $id)
    {
        $cert = Certificate::findOrFail($id);
        $data = $request->validate([
            'title' => 'sometimes|string|max:200',
            'issuer' => 'sometimes|string|max:200',
            'date' => 'sometimes|string',
            'category' => 'sometimes|in:Web,Data',
            'file' => 'nullable|file|mimes:jpeg,png,webp,pdf|max:5120',
        ]);

        if ($request->hasFile('file')) {
            if ($cert->file_path) {
                Storage::disk('public')->delete($cert->file_path);
            }
            $data['file_path'] = $request->file('file')->store('certificates', 'public');
        }
        unset($data['file']);

        $cert->update($data);
        return response()->json($this->withUrl($cert));
    }

    public function destroy($id)
    {
        $cert = Certificate::findOrFail($id);
        if ($cert->file_path) {
            Storage::disk('public')->delete($cert->file_path);
        }
        $cert->delete();
        return response()->json(null, 204);
    }

    private function withUrl($cert)
    {
        if ($cert->file_path) {
            $cert->file_url = url('storage/' . $cert->file_path);
        }
        return $cert;
    }
}
