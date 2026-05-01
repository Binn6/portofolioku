<?php
namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Education extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'education';

    protected $fillable = [
        'institution', 'degree', 'field', 'start_year', 'end_year', 'description',
    ];
}
