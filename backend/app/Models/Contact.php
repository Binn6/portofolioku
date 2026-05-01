<?php
namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Contact extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'contacts';

    protected $fillable = ['name', 'email', 'message', 'is_read'];

    protected $casts = ['is_read' => 'boolean'];
}
