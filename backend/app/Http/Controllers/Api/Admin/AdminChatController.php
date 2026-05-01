<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use Illuminate\Http\Request;

class AdminChatController extends Controller
{
    public function index()
    {
        $messages = ChatMessage::orderBy('created_at', 'desc')->get();

        $conversations = [];
        foreach ($messages as $msg) {
            $sid = $msg->session_id;
            if (!array_key_exists($sid, $conversations)) {
                $conversations[$sid] = [
                    'session_id'   => $sid,
                    'name'         => $msg->name,
                    'email'        => $msg->email,
                    'last_message' => $msg->message,
                    'last_sender'  => $msg->sender,
                    'last_at'      => $msg->created_at,
                    'unread'       => 0,
                ];
            }
            if ($msg->sender === 'client' && !$msg->is_read) {
                $conversations[$sid]['unread']++;
            }
        }

        return response()->json(array_values($conversations));
    }

    public function show($sessionId)
    {
        $messages = ChatMessage::where('session_id', $sessionId)
            ->orderBy('created_at', 'asc')
            ->get();

        ChatMessage::where('session_id', $sessionId)
            ->where('sender', 'client')
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json($messages);
    }

    public function reply(Request $request, $sessionId)
    {
        $data = $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        $first = ChatMessage::where('session_id', $sessionId)->first();
        if (!$first) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }

        $msg = ChatMessage::create([
            'session_id' => $sessionId,
            'name'       => $first->name,
            'email'      => $first->email,
            'message'    => $data['message'],
            'sender'     => 'admin',
            'is_read'    => false,
        ]);

        return response()->json($msg, 201);
    }

    public function destroy($sessionId)
    {
        ChatMessage::where('session_id', $sessionId)->delete();
        return response()->json(null, 204);
    }
}
