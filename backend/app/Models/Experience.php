<?php
namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Experience extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'experiences';

    protected $fillable = [
        'title', 'company', 'type', 'start_date', 'end_date',
        'description', 'is_current',
    ];

    protected $casts = ['is_current' => 'boolean'];
}
