<?php
// backend/app/Http/Controllers/Api/SqlGameController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SqlDataset;
use App\Models\SqlMission;

class SqlGameController extends Controller
{
    public function config()
    {
        $datasets = SqlDataset::where('is_active', true)
            ->get(['_id', 'name', 'description', 'schema_sql', 'seed_sql'])
            ->map(fn($d) => array_merge($d->toArray(), ['id' => (string) $d->_id]));

        $missions = SqlMission::where('is_active', true)
            ->orderBy('stage_order')
            ->get([
                '_id', 'dataset_id', 'stage_order', 'title', 'briefing',
                'tables', 'objectives', 'ordering_hint', 'ordered',
                'starter_sql', 'solution_query', 'rank_unlock',
            ])
            ->map(fn($m) => array_merge($m->toArray(), ['id' => (string) $m->_id]));

        return response()->json([
            'datasets' => $datasets->values(),
            'missions' => $missions->values(),
        ]);
    }
}
