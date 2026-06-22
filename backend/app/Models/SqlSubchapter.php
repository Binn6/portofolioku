<?php
namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class SqlSubchapter extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'sql_subchapters';

    protected $fillable = ['chapter_id', 'name', 'description', 'order'];

    protected $casts = [
        'order' => 'integer',
    ];
}
