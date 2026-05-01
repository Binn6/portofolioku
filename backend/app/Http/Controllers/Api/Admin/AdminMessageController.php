<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Contact;

class AdminMessageController extends Controller
{
    public function index()
    {
        return response()->json(Contact::orderBy('created_at', 'desc')->get());
    }

    public function markRead($id)
    {
        $contact = Contact::findOrFail($id);
        $contact->update(['is_read' => true]);
        return response()->json($contact);
    }
}
