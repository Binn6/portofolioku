<?php
namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Project extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'projects';

    protected $fillable = [
        'title', 'description', 'tech_stack', 'thumbnail_path',
        'github_url', 'live_url', 'is_featured',
    ];

    protected $casts = [
        'tech_stack' => 'array',
        'is_featured' => 'boolean',
    ];
}
