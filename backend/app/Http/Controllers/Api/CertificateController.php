<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;

class CertificateController extends Controller
{
    public function index()
    {
        $certs = Certificate::all()->map(function ($c) {
            if ($c->file_path) {
                $c->file_url = url('storage/' . $c->file_path);
            }
            return $c;
        });
        return response()->json($certs);
    }
}
