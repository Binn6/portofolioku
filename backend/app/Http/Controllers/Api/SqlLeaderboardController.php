<?php
// backend/app/Http/Controllers/Api/SqlLeaderboardController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SqlGameProgress;
use App\Models\SqlMission;
use App\Models\SqlPlayer;
use Illuminate\Http\Request;

class SqlLeaderboardController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'dataset_id' => 'required|string',
            'type'       => 'required|in:xp,speed',
        ]);

        $datasetId = $request->dataset_id;
        $type      = $request->type;

        // Identify the caller (optional auth)
        $callerId = null;
        try {
            $caller = auth('sql_player')->user();
            if ($caller instanceof SqlPlayer) {
                $callerId = (string) $caller->_id;
            }
        } catch (\Throwable) {}

        // Load missions map for XP computation
        $missionsMap = SqlMission::where('dataset_id', $datasetId)
            ->where('is_active', true)
            ->get()
            ->keyBy(fn($m) => (string) $m->_id)
            ->toArray();

        if ($type === 'xp') {
            $progresses = SqlGameProgress::where('dataset_id', $datasetId)->get();
            $rows = [];

            foreach ($progresses as $progress) {
                $solved = $progress->solved_missions ?? [];
                $times  = $progress->mission_times  ?? [];
                if (empty($solved)) continue;

                $xp = $this->computeXp($solved, $times, $missionsMap);
                $rows[] = [
                    'player_id'    => $progress->player_id,
                    'xp'           => $xp,
                    'solved_count' => count($solved),
                ];
            }

            usort($rows, fn($a, $b) => $b['xp'] <=> $a['xp']);

        } else { // speed
            $progresses = SqlGameProgress::where('dataset_id', $datasetId)
                ->whereNotNull('completed_at')
                ->orderBy('total_seconds', 'asc')
                ->get();

            $rows = [];
            foreach ($progresses as $progress) {
                $rows[] = [
                    'player_id'     => $progress->player_id,
                    'total_seconds' => $progress->total_seconds ?? 0,
                    'solved_count'  => count($progress->solved_missions ?? []),
                ];
            }
        }

        // Load player usernames — cast to ObjectId because _id is stored as BSON ObjectId
        $rawIds    = array_column($rows, 'player_id');
        $objectIds = array_values(array_filter(array_map(function ($id) {
            try { return new \MongoDB\BSON\ObjectId((string) $id); } catch (\Throwable) { return null; }
        }, $rawIds)));

        $players = SqlPlayer::whereIn('_id', $objectIds)
            ->get()
            ->keyBy(fn($p) => (string) $p->_id);

        $top20  = array_slice($rows, 0, 20);
        $result = [];

        foreach ($top20 as $rank => $row) {
            $player = $players[(string) $row['player_id']] ?? null;
            $item   = [
                'rank'         => $rank + 1,
                'username'     => $player?->username ?? '???',
                'solved_count' => $row['solved_count'],
                'is_me'        => $callerId !== null && $row['player_id'] === $callerId,
            ];
            if ($type === 'xp') $item['xp']           = $row['xp'];
            else                $item['total_seconds'] = $row['total_seconds'];
            $result[] = $item;
        }

        // Append caller row if outside top 20
        $callerRow = null;
        if ($callerId && !collect($result)->contains('is_me', true)) {
            $callerIdx = array_search($callerId, array_column($rows, 'player_id'));
            if ($callerIdx !== false) {
                $row    = $rows[$callerIdx];
                $player = $players[(string) $callerId] ?? null;
                $item   = [
                    'rank'         => $callerIdx + 1,
                    'username'     => $player?->username ?? '???',
                    'solved_count' => $row['solved_count'],
                    'is_me'        => true,
                ];
                if ($type === 'xp') $item['xp']           = $row['xp'];
                else                $item['total_seconds'] = $row['total_seconds'];
                $callerRow = $item;
            }
        }

        return response()->json([
            'data'       => $result,
            'caller_row' => $callerRow,
        ]);
    }

    private function computeXp(array $solved, array $times, array $missionsMap): int
    {
        $xp = 0;
        foreach ($solved as $missionId) {
            $m = $missionsMap[$missionId] ?? null;
            if (!$m) continue;

            $stageOrder = (int) ($m['stage_order'] ?? 1);
            $difficulty = isset($m['difficulty']) && $m['difficulty'] !== null
                ? (int) $m['difficulty']
                : null;
            $weight    = $difficulty ?? (int) ceil($stageOrder / 2);
            $seconds   = $times[$missionId] ?? PHP_INT_MAX;

            $speedMult = $seconds <= 60 ? 1.5 : ($seconds <= 120 ? 1.25 : 1.0);
            $xp += (int) round(100 * $weight * $speedMult);
        }
        return $xp;
    }
}
