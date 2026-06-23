<?php
// backend/app/Models/SqlGameProgress.php
namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class SqlGameProgress extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'sql_game_progress';

    protected $fillable = [
        'player_id', 'dataset_id', 'solved_missions',
        'mission_times', 'started_at', 'completed_at', 'total_seconds',
    ];

    protected $casts = [
        'solved_missions' => 'array',
        'mission_times'   => 'array',
        'started_at'      => 'datetime',
        'completed_at'    => 'datetime',
        'total_seconds'   => 'integer',
    ];
}
