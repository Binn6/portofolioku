<?php
namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class ChatMessage extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'chat_messages';

    protected $fillable = [
        'session_id', 'name', 'email', 'message', 'sender', 'is_read',
    ];

    protected $casts = ['is_read' => 'boolean'];
}
