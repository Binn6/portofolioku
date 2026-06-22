<?php
namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class SqlChapter extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'sql_chapters';

    protected $fillable = ['name', 'description', 'order', 'color'];

    protected $casts = [
        'order' => 'integer',
    ];
}
