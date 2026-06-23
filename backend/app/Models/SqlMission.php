<?php
namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class SqlMission extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'sql_missions';

    protected $fillable = [
        'dataset_id', 'stage_order', 'title', 'briefing',
        'tables', 'objectives', 'ordering_hint', 'ordered',
        'starter_sql', 'solution_query', 'rank_unlock', 'is_active', 'difficulty',
    ];

    protected $casts = [
        'tables'      => 'array',
        'objectives'  => 'array',
        'ordered'     => 'boolean',
        'is_active'   => 'boolean',
        'stage_order' => 'integer',
        'difficulty'  => 'integer',
    ];
}
