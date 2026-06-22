<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SqlChapter;
use App\Models\SqlDataset;
use App\Models\SqlMission;
use App\Models\SqlSubchapter;

class SqlGameController extends Controller
{
    public function config()
    {
        $chapters = SqlChapter::orderBy('order')
            ->get()
            ->map(fn($c) => array_merge($c->toArray(), ['id' => (string) $c->_id]));

        $subchapters = SqlSubchapter::orderBy('order')
            ->get()
            ->map(fn($s) => array_merge($s->toArray(), ['id' => (string) $s->_id]));

        $datasets = SqlDataset::where('is_active', true)
            ->get(['_id', 'name', 'description', 'schema_sql', 'seed_sql', 'chapter_id', 'subchapter_id'])
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
            'chapters'    => $chapters->values(),
            'subchapters' => $subchapters->values(),
            'datasets'    => $datasets->values(),
            'missions'    => $missions->values(),
        ]);
    }
}
