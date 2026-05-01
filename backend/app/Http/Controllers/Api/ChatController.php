<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function send(Request $request)
    {
        $data = $request->validate([
            'session_id' => 'required|string|max:100',
            'name'       => 'required|string|max:100',
            'email'      => 'required|email',
            'message'    => 'required|string|max:2000',
        ]);

        $msg = ChatMessage::create([
            ...$data,
            'sender'  => 'client',
            'is_read' => false,
        ]);

        return response()->json($msg, 201);
    }

    public function messages($sessionId)
    {
        $messages = ChatMessage::where('session_id', $sessionId)
            ->orderBy('created_at', 'asc')
            ->get();

        // Mark admin replies as read when client polls
        ChatMessage::where('session_id', $sessionId)
            ->where('sender', 'admin')
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json($messages);
    }
}
