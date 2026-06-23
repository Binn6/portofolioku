<?php
// backend/app/Http/Controllers/Api/SqlProgressController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SqlGameProgress;
use App\Models\SqlMission;
use Carbon\Carbon;
use Illuminate\Http\Request;

class SqlProgressController extends Controller
{
    public function show(Request $request)
    {
        $request->validate(['dataset_id' => 'required|string']);

        $player   = $request->user();
        $progress = SqlGameProgress::where('player_id', (string) $player->_id)
            ->where('dataset_id', $request->dataset_id)
            ->first();

        if (!$progress) {
            return response()->json(null);
        }

        return response()->json([
            'solved_missions' => $progress->solved_missions ?? [],
            'mission_times'   => $progress->mission_times ?? [],
            'completed_at'    => $progress->completed_at?->toISOString(),
            'total_seconds'   => $progress->total_seconds,
        ]);
    }

    public function sync(Request $request)
    {
        $data = $request->validate([
            'dataset_id' => 'required|string',
            'mission_id' => 'required|string',
            'seconds'    => 'required|integer|min:0',
        ]);

        $player   = $request->user();
        $playerId = (string) $player->_id;

        $progress = SqlGameProgress::firstOrNew([
            'player_id'  => $playerId,
            'dataset_id' => $data['dataset_id'],
        ]);

        $solved = $progress->solved_missions ?? [];
        $times  = $progress->mission_times  ?? [];

        if (!in_array($data['mission_id'], $solved)) {
            $solved[] = $data['mission_id'];
        }
        $times[$data['mission_id']] = $data['seconds'];

        if (!$progress->started_at) {
            $progress->started_at = Carbon::now();
        }

        $totalSeconds = array_sum($times);

        // Mark completed if all active missions are solved
        $activeMissionIds = SqlMission::where('dataset_id', $data['dataset_id'])
            ->where('is_active', true)
            ->get()
            ->map(fn($m) => (string) $m->_id)
            ->toArray();

        $allSolved = count($activeMissionIds) > 0
            && count(array_diff($activeMissionIds, $solved)) === 0;

        $progress->solved_missions = $solved;
        $progress->mission_times   = $times;
        $progress->total_seconds   = $totalSeconds;
        $progress->completed_at    = $allSolved
            ? ($progress->completed_at ?? Carbon::now())
            : $progress->completed_at;
        $progress->save();

        return response()->json(['synced' => true]);
    }
}
