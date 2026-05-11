<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Services\CloudinaryService;
use Illuminate\Http\Request;

class AdminCertificateController extends Controller
{
    public function __construct(private CloudinaryService $cloudinary) {}

    public function index()
    {
        return response()->json(Certificate::all()->map(fn($c) => $this->withUrl($c)));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'    => 'required|string|max:200',
            'issuer'   => 'required|string|max:200',
            'date'     => 'required|string',
            'category' => 'required|in:Web,Data',
            'file'     => 'nullable|file|mimes:jpeg,png,webp,pdf|max:5120',
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $resourceType = $file->getMimeType() === 'application/pdf' ? 'raw' : 'image';
            $uploaded = $this->cloudinary->upload($file, 'portfolio/certificates', $resourceType);
            $data['file_path']      = $uploaded['url'];
            $data['file_public_id'] = $uploaded['public_id'];
        }
        unset($data['file']);

        return response()->json($this->withUrl(Certificate::create($data)), 201);
    }

    public function update(Request $request, $id)
    {
        $cert = Certificate::findOrFail($id);
        $data = $request->validate([
            'title'    => 'sometimes|string|max:200',
            'issuer'   => 'sometimes|string|max:200',
            'date'     => 'sometimes|string',
            'category' => 'sometimes|in:Web,Data',
            'file'     => 'nullable|file|mimes:jpeg,png,webp,pdf|max:5120',
        ]);

        if ($request->hasFile('file')) {
            if ($cert->file_public_id) {
                $resourceType = str_contains($cert->file_path ?? '', '/raw/upload/') ? 'raw' : 'image';
                $this->cloudinary->delete($cert->file_public_id, $resourceType);
            }
            $file = $request->file('file');
            $resourceType = $file->getMimeType() === 'application/pdf' ? 'raw' : 'image';
            $uploaded = $this->cloudinary->upload($file, 'portfolio/certificates', $resourceType);
            $data['file_path']      = $uploaded['url'];
            $data['file_public_id'] = $uploaded['public_id'];
        }
        unset($data['file']);

        $cert->update($data);
        return response()->json($this->withUrl($cert));
    }

    public function destroy($id)
    {
        $cert = Certificate::findOrFail($id);
        if ($cert->file_public_id) {
            $resourceType = str_contains($cert->file_path ?? '', '/raw/upload/') ? 'raw' : 'image';
            $this->cloudinary->delete($cert->file_public_id, $resourceType);
        }
        $cert->delete();
        return response()->json(null, 204);
    }

    private function withUrl($cert)
    {
        if ($cert->file_path) {
            $cert->file_url = $cert->file_path;
        }
        return $cert;
    }
}
