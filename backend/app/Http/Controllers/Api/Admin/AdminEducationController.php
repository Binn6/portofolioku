<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Education;
use Illuminate\Http\Request;

class AdminEducationController extends Controller
{
    public function index()
    {
        return response()->json(Education::all());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'institution' => 'required|string|max:200',
            'degree' => 'required|string|max:100',
            'field' => 'required|string|max:100',
            'start_year' => 'required|integer',
            'end_year' => 'nullable|integer',
            'description' => 'nullable|string',
        ]);
        return response()->json(Education::create($data), 201);
    }

    public function update(Request $request, $id)
    {
        $edu = Education::findOrFail($id);
        $data = $request->validate([
            'institution' => 'sometimes|string|max:200',
            'degree' => 'sometimes|string|max:100',
            'field' => 'sometimes|string|max:100',
            'start_year' => 'sometimes|integer',
            'end_year' => 'nullable|integer',
            'description' => 'nullable|string',
        ]);
        $edu->update($data);
        return response()->json($edu);
    }

    public function destroy($id)
    {
        Education::findOrFail($id)->delete();
        return response()->json(null, 204);
    }
}
