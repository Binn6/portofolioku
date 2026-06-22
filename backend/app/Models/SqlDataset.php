<?php
namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class SqlDataset extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'sql_datasets';

    protected $fillable = [
        'name', 'description', 'source', 'source_ref',
        'schema_sql', 'seed_sql', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
