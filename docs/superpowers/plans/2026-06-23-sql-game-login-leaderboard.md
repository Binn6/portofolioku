# SQL Game Login & Leaderboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional player accounts (register / login / password reset) with progress auto-sync and a public XP + Speed leaderboard to the SQL Mission Control game.

**Architecture:** Separate `SqlPlayer` model (Sanctum tokens, isolated from admin `User`), `SqlGameProgress` upserted after each solve, leaderboard computed on-the-fly from progress docs. Frontend: Zustand store gains player/token/timer state; AuthModal and LeaderboardModal are wired into GameShell.

**Tech Stack:** Laravel 11 + MongoDB (mongodb/laravel-mongodb), Laravel Sanctum, React + Zustand, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-06-23-sql-game-login-leaderboard-design.md`

---

## File Map

### New backend files
- `backend/app/Models/SqlPlayer.php`
- `backend/app/Models/SqlGameProgress.php`
- `backend/app/Http/Controllers/Api/SqlPlayerAuthController.php`
- `backend/app/Http/Controllers/Api/SqlProgressController.php`
- `backend/app/Http/Controllers/Api/SqlLeaderboardController.php`
- `backend/app/Notifications/SqlPlayerResetPassword.php`

### Modified backend files
- `backend/config/auth.php` — add `sql_player` guard + `sql_players` provider + password broker
- `backend/config/sanctum.php` — add `sql_player` to guard array
- `backend/routes/api.php` — register all new routes
- `backend/app/Models/SqlMission.php` — add `difficulty` to fillable + casts
- `backend/app/Http/Controllers/Api/Admin/AdminSqlMissionController.php` — add `difficulty` validation

### New frontend files
- `frontend/src/components/sql-game/auth/AuthModal.jsx`
- `frontend/src/components/sql-game/auth/LoginForm.jsx`
- `frontend/src/components/sql-game/auth/RegisterForm.jsx`
- `frontend/src/components/sql-game/auth/ForgotForm.jsx`
- `frontend/src/components/sql-game/leaderboard/LeaderboardModal.jsx`
- `frontend/src/components/sql-game/leaderboard/LeaderboardTable.jsx`
- `frontend/src/pages/ResetPassword.jsx`

### Modified frontend files
- `frontend/src/services/api.js` — add 9 new SQL player API functions
- `frontend/src/store/useSqlGameStore.js` — add player/token/timer state + actions
- `frontend/src/components/sql-game/GameShell.jsx` — wire modals, auth check, login handler
- `frontend/src/App.jsx` — add `/reset-password` route

---

## Task 1: SqlPlayer model + auth guard config

**Files:**
- Create: `backend/app/Models/SqlPlayer.php`
- Modify: `backend/config/auth.php`
- Modify: `backend/config/sanctum.php`

- [ ] **Step 1: Create SqlPlayer model**

```php
<?php
// backend/app/Models/SqlPlayer.php
namespace App\Models;

use MongoDB\Laravel\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class SqlPlayer extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $connection = 'mongodb';
    protected $collection = 'sql_players';

    protected $fillable = ['username', 'email', 'password'];
    protected $hidden   = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }
}
```

- [ ] **Step 2: Add sql_player guard + provider to config/auth.php**

In `backend/config/auth.php`, add inside `'guards'`:
```php
'sql_player' => [
    'driver'   => 'session',
    'provider' => 'sql_players',
],
```

Add inside `'providers'`:
```php
'sql_players' => [
    'driver' => 'eloquent',
    'model'  => App\Models\SqlPlayer::class,
],
```

- [ ] **Step 3: Add sql_player to sanctum guard list**

In `backend/config/sanctum.php`, change:
```php
'guard' => ['web'],
```
to:
```php
'guard' => ['web', 'sql_player'],
```

This tells Sanctum to authenticate bearer tokens against both `web` (admin User) and `sql_player` (SqlPlayer) providers.

- [ ] **Step 4: Verify model resolves**

```bash
cd backend && php artisan tinker --execute="echo App\Models\SqlPlayer::count();"
```

Expected output: `0` (or however many records exist — no error).

- [ ] **Step 5: Commit**

```bash
git add backend/app/Models/SqlPlayer.php backend/config/auth.php backend/config/sanctum.php
git commit -m "feat: add SqlPlayer model and sanctum guard config"
```

---

## Task 2: SqlGameProgress model

**Files:**
- Create: `backend/app/Models/SqlGameProgress.php`

- [ ] **Step 1: Create model**

```php
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
```

- [ ] **Step 2: Verify**

```bash
cd backend && php artisan tinker --execute="echo App\Models\SqlGameProgress::count();"
```

Expected: `0` with no error.

- [ ] **Step 3: Commit**

```bash
git add backend/app/Models/SqlGameProgress.php
git commit -m "feat: add SqlGameProgress model"
```

---

## Task 3: SqlPlayerAuthController (register, login, logout, me)

**Files:**
- Create: `backend/app/Http/Controllers/Api/SqlPlayerAuthController.php`

- [ ] **Step 1: Create controller with the four core actions**

```php
<?php
// backend/app/Http/Controllers/Api/SqlPlayerAuthController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SqlPlayer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SqlPlayerAuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'username' => ['required', 'string', 'max:30', Rule::unique(SqlPlayer::class, 'username')],
            'email'    => ['required', 'email',           Rule::unique(SqlPlayer::class, 'email')],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $player = SqlPlayer::create($data);
        $token  = $player->createToken('sql-player')->plainTextToken;

        return response()->json([
            'token'  => $token,
            'player' => $this->playerShape($player),
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'login'    => 'required|string',
            'password' => 'required|string',
        ]);

        $login  = $request->login;
        $player = filter_var($login, FILTER_VALIDATE_EMAIL)
            ? SqlPlayer::where('email', $login)->first()
            : SqlPlayer::where('username', $login)->first();

        if (!$player || !Hash::check($request->password, $player->password)) {
            throw ValidationException::withMessages([
                'login' => ['Username/email atau password salah.'],
            ]);
        }

        $token = $player->createToken('sql-player')->plainTextToken;

        return response()->json([
            'token'  => $token,
            'player' => $this->playerShape($player),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        return response()->json($this->playerShape($request->user()));
    }

    private function playerShape(SqlPlayer $player): array
    {
        return [
            'id'       => (string) $player->_id,
            'username' => $player->username,
            'email'    => $player->email,
        ];
    }
}
```

- [ ] **Step 2: Verify syntax**

```bash
cd backend && php artisan route:list 2>&1 | head -5
```

Expected: no parse errors (route list works fine even without the new routes registered yet).

- [ ] **Step 3: Commit**

```bash
git add backend/app/Http/Controllers/Api/SqlPlayerAuthController.php
git commit -m "feat: add SqlPlayerAuthController register/login/logout/me"
```

---

## Task 4: Password reset flow

**Files:**
- Modify: `backend/app/Http/Controllers/Api/SqlPlayerAuthController.php` — add forgotPassword + resetPassword
- Create: `backend/app/Notifications/SqlPlayerResetPassword.php`
- Modify: `backend/config/auth.php` — add sql_players password broker

- [ ] **Step 1: Create reset password notification**

```php
<?php
// backend/app/Notifications/SqlPlayerResetPassword.php
namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class SqlPlayerResetPassword extends Notification
{
    public function __construct(
        private string $token,
        private string $email
    ) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $frontendUrl = env('FRONTEND_URL', config('app.url'));
        $url = $frontendUrl . '/reset-password?token=' . $this->token . '&email=' . urlencode($this->email);

        return (new MailMessage)
            ->subject('Reset Password - SQL Mission Control')
            ->line('Kamu menerima email ini karena ada permintaan reset password untuk akunmu.')
            ->action('Reset Password', $url)
            ->line('Link ini kadaluarsa dalam 60 menit.')
            ->line('Jika kamu tidak meminta reset password, abaikan email ini.');
    }
}
```

- [ ] **Step 2: Add password broker for sql_players in config/auth.php**

Inside `'passwords'` array, add:
```php
'sql_players' => [
    'provider'   => 'sql_players',
    'table'      => 'sql_player_password_resets',
    'expire'     => 60,
    'throttle'   => 60,
    'connection' => 'mongodb',
],
```

- [ ] **Step 3: Add forgotPassword and resetPassword to SqlPlayerAuthController**

Add these imports at the top:
```php
use App\Notifications\SqlPlayerResetPassword;
use Illuminate\Support\Facades\Password;
```

Add these methods inside the class (after `me()`):
```php
public function forgotPassword(Request $request)
{
    $request->validate(['email' => 'required|email']);

    // Check mail is configured
    $mailer = config('mail.default', 'log');
    $host   = config("mail.mailers.{$mailer}.host", null);
    if (!$host || $host === 'localhost' || $host === '127.0.0.1') {
        return response()->json(['message' => 'Layanan email belum dikonfigurasi'], 503);
    }

    $status = Password::broker('sql_players')->sendResetLink(
        $request->only('email')
    );

    return $status === Password::RESET_LINK_SENT
        ? response()->json(['message' => 'Link reset password telah dikirim ke email kamu.'])
        : response()->json(['message' => 'Email tidak ditemukan.'], 422);
}

public function resetPassword(Request $request)
{
    $request->validate([
        'token'                 => 'required|string',
        'email'                 => 'required|email',
        'password'              => 'required|string|min:8|confirmed',
        'password_confirmation' => 'required|string',
    ]);

    $status = Password::broker('sql_players')->reset(
        $request->only('email', 'password', 'password_confirmation', 'token'),
        function (SqlPlayer $player, string $password) {
            $player->forceFill(['password' => $password])->save();
            $player->tokens()->delete();
        }
    );

    return $status === Password::PASSWORD_RESET
        ? response()->json(['message' => 'Password berhasil direset. Silakan login.'])
        : response()->json(['message' => __($status)], 422);
}
```

- [ ] **Step 4: Wire SqlPlayer to use the custom notification**

Add this method to `backend/app/Models/SqlPlayer.php`:
```php
public function sendPasswordResetNotification($token): void
{
    $this->notify(new \App\Notifications\SqlPlayerResetPassword($token, $this->email));
}
```

- [ ] **Step 5: Verify syntax**

```bash
cd backend && php artisan tinker --execute="echo Password::broker('sql_players') ? 'ok' : 'fail';"
```

Expected: `ok`

- [ ] **Step 6: Commit**

```bash
git add backend/app/Notifications/SqlPlayerResetPassword.php \
        backend/app/Http/Controllers/Api/SqlPlayerAuthController.php \
        backend/app/Models/SqlPlayer.php \
        backend/config/auth.php
git commit -m "feat: add password reset flow for SqlPlayer"
```

---

## Task 5: SqlProgressController

**Files:**
- Create: `backend/app/Http/Controllers/Api/SqlProgressController.php`

- [ ] **Step 1: Create controller**

```php
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
```

- [ ] **Step 2: Verify syntax**

```bash
cd backend && php artisan tinker --execute="new App\Http\Controllers\Api\SqlProgressController(); echo 'ok';"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add backend/app/Http/Controllers/Api/SqlProgressController.php
git commit -m "feat: add SqlProgressController for progress sync"
```

---

## Task 6: SqlLeaderboardController

**Files:**
- Create: `backend/app/Http/Controllers/Api/SqlLeaderboardController.php`

- [ ] **Step 1: Create controller**

```php
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

        // Load player usernames
        $playerIds = array_column($rows, 'player_id');
        $players   = SqlPlayer::whereIn('_id', $playerIds)
            ->get()
            ->keyBy(fn($p) => (string) $p->_id);

        $top20  = array_slice($rows, 0, 20);
        $result = [];

        foreach ($top20 as $rank => $row) {
            $player = $players[$row['player_id']] ?? null;
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
                $player = $players[$callerId] ?? null;
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
```

- [ ] **Step 2: Verify**

```bash
cd backend && php artisan tinker --execute="new App\Http\Controllers\Api\SqlLeaderboardController(); echo 'ok';"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add backend/app/Http/Controllers/Api/SqlLeaderboardController.php
git commit -m "feat: add SqlLeaderboardController with XP and speed modes"
```

---

## Task 7: Register backend routes

**Files:**
- Modify: `backend/routes/api.php`

- [ ] **Step 1: Add imports at the top of api.php**

After the existing `use` statements, add:
```php
use App\Http\Controllers\Api\SqlPlayerAuthController;
use App\Http\Controllers\Api\SqlProgressController;
use App\Http\Controllers\Api\SqlLeaderboardController;
```

- [ ] **Step 2: Add public SQL game routes (after existing `/sql-game/config` route)**

```php
// ── SQL GAME — Player Auth ──────────────────────────────────
Route::prefix('sql-game/auth')->group(function () {
    Route::post('register',        [SqlPlayerAuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('login',           [SqlPlayerAuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('forgot-password', [SqlPlayerAuthController::class, 'forgotPassword'])->middleware('throttle:3,1');
    Route::post('reset-password',  [SqlPlayerAuthController::class, 'resetPassword']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [SqlPlayerAuthController::class, 'logout']);
        Route::get('me',      [SqlPlayerAuthController::class, 'me']);
    });
});

// ── SQL GAME — Progress (player auth required) ──────────────
Route::middleware('auth:sanctum')->prefix('sql-game/progress')->group(function () {
    Route::get('/',     [SqlProgressController::class, 'show']);
    Route::post('sync', [SqlProgressController::class, 'sync']);
});

// ── SQL GAME — Leaderboard (public) ────────────────────────
Route::get('/sql-game/leaderboard', [SqlLeaderboardController::class, 'index']);
```

- [ ] **Step 3: Verify routes registered**

```bash
cd backend && php artisan route:list --path=sql-game
```

Expected output includes:
```
GET|HEAD  api/sql-game/auth/me
POST      api/sql-game/auth/forgot-password
POST      api/sql-game/auth/login
POST      api/sql-game/auth/logout
POST      api/sql-game/auth/register
POST      api/sql-game/auth/reset-password
GET|HEAD  api/sql-game/leaderboard
GET|HEAD  api/sql-game/progress
POST      api/sql-game/progress/sync
```

- [ ] **Step 4: Smoke test register endpoint locally (if backend running)**

```bash
curl -s -X POST http://localhost:8000/api/sql-game/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testplayer","email":"test@example.com","password":"password123","password_confirmation":"password123"}' | python -m json.tool
```

Expected: JSON with `token` and `player.username = "testplayer"`.

- [ ] **Step 5: Commit**

```bash
git add backend/routes/api.php
git commit -m "feat: register SQL game auth/progress/leaderboard routes"
```

---

## Task 8: SqlMission difficulty field + admin form

**Files:**
- Modify: `backend/app/Models/SqlMission.php`
- Modify: `backend/app/Http/Controllers/Api/Admin/AdminSqlMissionController.php`
- Modify: `frontend/src/pages/admin/sql-game/MissionForm.jsx`

- [ ] **Step 1: Add difficulty to SqlMission model**

In `backend/app/Models/SqlMission.php`, add `'difficulty'` to `$fillable`:
```php
protected $fillable = [
    'dataset_id', 'stage_order', 'title', 'briefing',
    'tables', 'objectives', 'ordering_hint', 'ordered',
    'starter_sql', 'solution_query', 'rank_unlock', 'is_active', 'difficulty',
];
```

Add `'difficulty' => 'integer'` to `$casts`:
```php
protected $casts = [
    'tables'      => 'array',
    'objectives'  => 'array',
    'ordered'     => 'boolean',
    'is_active'   => 'boolean',
    'stage_order' => 'integer',
    'difficulty'  => 'integer',
];
```

- [ ] **Step 2: Add difficulty validation to AdminSqlMissionController**

In `store()` method, inside `$request->validate([...])`, add:
```php
'difficulty' => 'nullable|integer|min:1|max:5',
```

In `update()` method, inside `$request->validate([...])`, add:
```php
'difficulty' => 'nullable|integer|min:1|max:5',
```

- [ ] **Step 3: Add difficulty field to MissionForm.jsx**

In `frontend/src/pages/admin/sql-game/MissionForm.jsx`, in the grid with `stage_order` and `rank_unlock`, add a third item. Change the grid to `grid-cols-3` and insert:

Replace:
```jsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <label className="block text-xs text-accent-muted mb-1">Stage Order *</label>
    <input type="number" min="1" value={form.stage_order} onChange={set('stage_order')}
      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent" />
  </div>
  <div>
    <label className="block text-xs text-accent-muted mb-1">Rank Unlock</label>
    <input value={form.rank_unlock} onChange={set('rank_unlock')} placeholder="Query Runner"
      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent" />
  </div>
</div>
```

With:
```jsx
<div className="grid grid-cols-3 gap-4">
  <div>
    <label className="block text-xs text-accent-muted mb-1">Stage Order *</label>
    <input type="number" min="1" value={form.stage_order} onChange={set('stage_order')}
      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent" />
  </div>
  <div>
    <label className="block text-xs text-accent-muted mb-1">Difficulty (1–5)</label>
    <input type="number" min="1" max="5" value={form.difficulty ?? ''} onChange={set('difficulty')}
      placeholder="kosong = auto"
      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent" />
  </div>
  <div>
    <label className="block text-xs text-accent-muted mb-1">Rank Unlock</label>
    <input value={form.rank_unlock} onChange={set('rank_unlock')} placeholder="Query Runner"
      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent" />
  </div>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/Models/SqlMission.php \
        backend/app/Http/Controllers/Api/Admin/AdminSqlMissionController.php \
        frontend/src/pages/admin/sql-game/MissionForm.jsx
git commit -m "feat: add difficulty field to SqlMission + admin form"
```

---

## Task 9: Frontend API service additions

**Files:**
- Modify: `frontend/src/services/api.js`

- [ ] **Step 1: Add SQL player API functions to api.js**

Append to the end of `frontend/src/services/api.js` (before `export default api`):

```js
// ─── SQL GAME — Player Auth ───────────────────────────────────
const sqlPlayerHeaders = () => {
  const token = localStorage.getItem('sql_player_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const sqlPlayerRegister = (data) =>
  api.post('/sql-game/auth/register', data).then(r => r.data)

export const sqlPlayerLogin = (data) =>
  api.post('/sql-game/auth/login', data).then(r => r.data)

export const sqlPlayerLogout = () =>
  api.post('/sql-game/auth/logout', {}, { headers: sqlPlayerHeaders() }).then(r => r.data)

export const sqlPlayerMe = () =>
  api.get('/sql-game/auth/me', { headers: sqlPlayerHeaders() }).then(r => r.data)

export const sqlPlayerForgotPassword = (email) =>
  api.post('/sql-game/auth/forgot-password', { email }).then(r => r.data)

export const sqlPlayerResetPassword = (data) =>
  api.post('/sql-game/auth/reset-password', data).then(r => r.data)

// ─── SQL GAME — Progress ──────────────────────────────────────
export const sqlGetProgress = (datasetId) =>
  api.get('/sql-game/progress', {
    params: { dataset_id: datasetId },
    headers: sqlPlayerHeaders(),
  }).then(r => r.data)

export const sqlSyncProgress = (data) =>
  api.post('/sql-game/progress/sync', data, { headers: sqlPlayerHeaders() }).then(r => r.data)

// ─── SQL GAME — Leaderboard ───────────────────────────────────
export const sqlGetLeaderboard = (datasetId, type) =>
  api.get('/sql-game/leaderboard', {
    params: { dataset_id: datasetId, type },
    headers: sqlPlayerHeaders(),
  }).then(r => r.data)
```

Note: `sqlPlayerHeaders()` reads `sql_player_token` at call-time, not at module load-time, so it's always fresh.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/services/api.js
git commit -m "feat: add SQL player auth/progress/leaderboard API service functions"
```

---

## Task 10: Zustand store additions

**Files:**
- Modify: `frontend/src/store/useSqlGameStore.js`

- [ ] **Step 1: Add import at the top**

At the top of `useSqlGameStore.js`, add:
```js
import { sqlSyncProgress } from '../services/api'
```

- [ ] **Step 2: Add new state fields to the initial state object**

Inside `create((set, get) => ({`, add these fields after the existing session state:
```js
// Player auth
player: null,
playerToken: typeof window !== 'undefined' ? (localStorage.getItem('sql_player_token') ?? null) : null,

// Mission timing
missionStartTimes: {},
missionTimes: {},
```

- [ ] **Step 3: Add new actions**

After the existing `goToPrevMission` action, add:

```js
setPlayer: (player, token) => {
  if (token) localStorage.setItem('sql_player_token', token)
  else localStorage.removeItem('sql_player_token')
  set({ player, playerToken: token })
},

clearPlayer: () => {
  localStorage.removeItem('sql_player_token')
  set({ player: null, playerToken: null })
},

recordMissionStart: (missionId) => {
  set(state => ({
    missionStartTimes: { ...state.missionStartTimes, [missionId]: Date.now() },
  }))
},

recordMissionSolve: (missionId) => {
  const { missionStartTimes, player, selectedDataset } = get()
  const startTime = missionStartTimes[missionId]
  const seconds   = startTime ? Math.round((Date.now() - startTime) / 1000) : 0

  set(state => ({
    missionTimes: { ...state.missionTimes, [missionId]: seconds },
  }))

  if (player && selectedDataset) {
    sqlSyncProgress({
      dataset_id: selectedDataset.id,
      mission_id: missionId,
      seconds,
    }).catch(() => {})  // silent fail — progress already in local state
  }
},

hydrateProgress: (solvedMissions, missionTimes) => {
  const { missions, selectedDataset } = get()
  const currentSolved = get().solvedMissions
  const currentTimes  = get().missionTimes

  const merged = [...new Set([...currentSolved, ...solvedMissions])]
  const times  = { ...missionTimes, ...currentTimes } // session times take precedence

  // Recompute rank from merged solved list
  let rank = RANK_PROGRESSION[0]
  if (selectedDataset) {
    const datasetMissions = missions
      .filter(m => m.dataset_id === selectedDataset.id)
      .sort((a, b) => a.stage_order - b.stage_order)
    for (const mId of merged) {
      const m = datasetMissions.find(m => m.id === mId)
      if (m?.rank_unlock) rank = m.rank_unlock
    }
  }

  set({ solvedMissions: merged, missionTimes: times, rank })
},
```

- [ ] **Step 4: Update selectDataset to start timer for first mission**

Change the existing `selectDataset` action — add `recordMissionStart` call at the end. Find the `set({...})` call in `selectDataset` and after it add:
```js
if (first) {
  set(state => ({
    missionStartTimes: { ...state.missionStartTimes, [first.id]: Date.now() },
  }))
}
```

Full updated `selectDataset`:
```js
selectDataset: (dataset) => {
  const { missions } = get()
  const datasetMissions = missions
    .filter(m => m.dataset_id === dataset.id)
    .sort((a, b) => a.stage_order - b.stage_order)
  const first = datasetMissions[0] ?? null
  set({
    selectedDataset: dataset,
    currentMissionId: first?.id ?? null,
    solvedMissions: [],
    rank: RANK_PROGRESSION[0],
    lastResult: null,
    queryText: first?.starter_sql ?? '-- Tulis query SQL-mu di sini...\n\nSELECT ',
    missionStartTimes: first ? { [first.id]: Date.now() } : {},
    missionTimes: {},
  })
},
```

- [ ] **Step 5: Update goToNextMission and goToPrevMission to start timer**

Replace existing `goToNextMission`:
```js
goToNextMission: () => {
  const { getDatasetMissions, currentMissionId } = get()
  const ordered = getDatasetMissions()
  const idx = ordered.findIndex(m => m.id === currentMissionId)
  if (idx < ordered.length - 1) {
    const next = ordered[idx + 1]
    set({
      currentMissionId: next.id,
      lastResult: null,
      queryText: next.starter_sql ?? '-- Tulis query SQL-mu di sini...\n\nSELECT ',
    })
    set(state => ({
      missionStartTimes: { ...state.missionStartTimes, [next.id]: Date.now() },
    }))
  }
},
```

Replace existing `goToPrevMission`:
```js
goToPrevMission: () => {
  const { getDatasetMissions, currentMissionId } = get()
  const ordered = getDatasetMissions()
  const idx = ordered.findIndex(m => m.id === currentMissionId)
  if (idx > 0) {
    const prev = ordered[idx - 1]
    set({
      currentMissionId: prev.id,
      lastResult: null,
      queryText: prev.starter_sql ?? '-- Tulis query SQL-mu di sini...\n\nSELECT ',
    })
    set(state => ({
      missionStartTimes: { ...state.missionStartTimes, [prev.id]: Date.now() },
    }))
  }
},
```

- [ ] **Step 6: Update solveMission to call recordMissionSolve**

Replace existing `solveMission`:
```js
solveMission: (missionId) => {
  const { solvedMissions, missions } = get()
  if (solvedMissions.includes(missionId)) return

  get().recordMissionSolve(missionId)

  const solved  = [...solvedMissions, missionId]
  const mission = missions.find(m => m.id === missionId)
  let rank = get().rank
  if (mission?.rank_unlock) rank = mission.rank_unlock
  set({ solvedMissions: solved, rank })
},
```

- [ ] **Step 7: Verify the store exports are correct**

```bash
cd frontend && grep -n "recordMissionStart\|setPlayer\|clearPlayer\|hydrateProgress" src/store/useSqlGameStore.js
```

Expected: lines found for each of those 4 new actions.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/store/useSqlGameStore.js
git commit -m "feat: add player auth, timer, and progress hydration to Zustand store"
```

---

## Task 11: AuthModal + sub-forms

**Files:**
- Create: `frontend/src/components/sql-game/auth/LoginForm.jsx`
- Create: `frontend/src/components/sql-game/auth/RegisterForm.jsx`
- Create: `frontend/src/components/sql-game/auth/ForgotForm.jsx`
- Create: `frontend/src/components/sql-game/auth/AuthModal.jsx`

- [ ] **Step 1: Create LoginForm.jsx**

```jsx
// frontend/src/components/sql-game/auth/LoginForm.jsx
import { useState } from 'react'
import { sqlPlayerLogin } from '../../../services/api'

export function LoginForm({ onSuccess, onForgot, onRegister }) {
  const [login, setLogin]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { token, player } = await sqlPlayerLogin({ login, password })
      onSuccess(player, token)
    } catch (err) {
      const msg = err.response?.data?.errors?.login?.[0]
        ?? err.response?.data?.message
        ?? 'Login gagal.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-background border border-border rounded px-3 py-2 text-accent text-sm font-mono outline-none focus:border-sql-primary'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-sql-dim mb-1 font-mono uppercase tracking-widest">Username / Email</label>
        <input value={login} onChange={e => setLogin(e.target.value)} required className={inputCls} />
      </div>
      <div>
        <label className="block text-xs text-sql-dim mb-1 font-mono uppercase tracking-widest">Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className={inputCls} />
      </div>
      {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 rounded border border-sql-primary text-sql-primary text-sm font-mono
          hover:bg-sql-primary/10 transition-colors disabled:opacity-50"
      >
        {loading ? 'LOADING...' : 'LOGIN'}
      </button>
      <div className="flex justify-between text-xs font-mono text-sql-dim">
        <button type="button" onClick={onForgot} className="hover:text-accent transition-colors">
          Lupa password?
        </button>
        <button type="button" onClick={onRegister} className="hover:text-accent transition-colors">
          Daftar akun
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Create RegisterForm.jsx**

```jsx
// frontend/src/components/sql-game/auth/RegisterForm.jsx
import { useState } from 'react'
import { sqlPlayerRegister } from '../../../services/api'

export function RegisterForm({ onSuccess, onLogin }) {
  const [form, setForm]     = useState({ username: '', email: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      const { token, player } = await sqlPlayerRegister(form)
      onSuccess(player, token)
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) setErrors(data.errors)
      else setErrors({ _general: data?.message ?? 'Registrasi gagal.' })
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-background border border-border rounded px-3 py-2 text-accent text-sm font-mono outline-none focus:border-sql-primary'
  const errCls   = 'text-red-400 text-xs font-mono mt-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs text-sql-dim mb-1 font-mono uppercase tracking-widest">Username</label>
        <input value={form.username} onChange={set('username')} required maxLength={30} className={inputCls} />
        {errors.username && <p className={errCls}>{errors.username[0]}</p>}
      </div>
      <div>
        <label className="block text-xs text-sql-dim mb-1 font-mono uppercase tracking-widest">Email</label>
        <input type="email" value={form.email} onChange={set('email')} required className={inputCls} />
        {errors.email && <p className={errCls}>{errors.email[0]}</p>}
      </div>
      <div>
        <label className="block text-xs text-sql-dim mb-1 font-mono uppercase tracking-widest">Password</label>
        <input type="password" value={form.password} onChange={set('password')} required minLength={8} className={inputCls} />
        {errors.password && <p className={errCls}>{errors.password[0]}</p>}
      </div>
      <div>
        <label className="block text-xs text-sql-dim mb-1 font-mono uppercase tracking-widest">Konfirmasi Password</label>
        <input type="password" value={form.password_confirmation} onChange={set('password_confirmation')} required className={inputCls} />
      </div>
      {errors._general && <p className={errCls}>{errors._general}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 rounded border border-sql-primary text-sql-primary text-sm font-mono
          hover:bg-sql-primary/10 transition-colors disabled:opacity-50"
      >
        {loading ? 'LOADING...' : 'DAFTAR'}
      </button>
      <p className="text-center text-xs font-mono text-sql-dim">
        Sudah punya akun?{' '}
        <button type="button" onClick={onLogin} className="text-sql-primary hover:underline">Login</button>
      </p>
    </form>
  )
}
```

- [ ] **Step 3: Create ForgotForm.jsx**

```jsx
// frontend/src/components/sql-game/auth/ForgotForm.jsx
import { useState } from 'react'
import { sqlPlayerForgotPassword } from '../../../services/api'

export function ForgotForm({ onBack }) {
  const [email, setEmail]     = useState('')
  const [message, setMessage] = useState(null)
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      const res = await sqlPlayerForgotPassword(email)
      setMessage(res.message ?? 'Email reset password telah dikirim.')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Gagal mengirim email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-sql-dim font-mono">Masukkan email akunmu dan kami akan mengirim link reset password.</p>
      <div>
        <label className="block text-xs text-sql-dim mb-1 font-mono uppercase tracking-widest">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full bg-background border border-border rounded px-3 py-2 text-accent text-sm font-mono outline-none focus:border-sql-primary"
        />
      </div>
      {error   && <p className="text-red-400 text-xs font-mono">{error}</p>}
      {message && <p className="text-sql-primary text-xs font-mono">{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 rounded border border-sql-primary text-sql-primary text-sm font-mono
          hover:bg-sql-primary/10 transition-colors disabled:opacity-50"
      >
        {loading ? 'LOADING...' : 'KIRIM LINK RESET'}
      </button>
      <button type="button" onClick={onBack} className="w-full text-xs text-sql-dim font-mono hover:text-accent transition-colors">
        ← Kembali ke Login
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Create AuthModal.jsx**

```jsx
// frontend/src/components/sql-game/auth/AuthModal.jsx
import { useState } from 'react'
import { X } from 'lucide-react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { ForgotForm } from './ForgotForm'

export function AuthModal({ onClose, onSuccess }) {
  const [view, setView] = useState('login') // 'login' | 'register' | 'forgot'

  const handleSuccess = (player, token) => {
    onSuccess(player, token)
    onClose()
  }

  const titles = { login: 'LOGIN', register: 'DAFTAR', forgot: 'LUPA PASSWORD' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-sm mx-4 bg-surface border border-border rounded-lg p-6 font-mono">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs text-sql-primary tracking-widest uppercase">{titles[view]}</span>
          <button onClick={onClose} className="text-sql-dim hover:text-accent transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Tab switcher (login / register only — not shown on forgot) */}
        {view !== 'forgot' && (
          <div className="flex gap-2 mb-5">
            {['login', 'register'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex-1 py-1 text-xs rounded border transition-colors ${
                  view === v
                    ? 'border-sql-primary text-sql-primary bg-sql-primary/10'
                    : 'border-border text-sql-dim hover:border-accent'
                }`}
              >
                {v === 'login' ? 'LOGIN' : 'DAFTAR'}
              </button>
            ))}
          </div>
        )}

        {view === 'login'    && <LoginForm    onSuccess={handleSuccess} onForgot={() => setView('forgot')} onRegister={() => setView('register')} />}
        {view === 'register' && <RegisterForm onSuccess={handleSuccess} onLogin={() => setView('login')} />}
        {view === 'forgot'   && <ForgotForm   onBack={() => setView('login')} />}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/sql-game/auth/
git commit -m "feat: add AuthModal with login, register, and forgot-password forms"
```

---

## Task 12: ResetPassword page + App.jsx route

**Files:**
- Create: `frontend/src/pages/ResetPassword.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create ResetPassword page**

```jsx
// frontend/src/pages/ResetPassword.jsx
import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Terminal } from 'lucide-react'
import { sqlPlayerResetPassword } from '../services/api'

export default function ResetPassword() {
  const [params]   = useSearchParams()
  const navigate   = useNavigate()
  const [password, setPassword]                   = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [status, setStatus]   = useState(null)
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await sqlPlayerResetPassword({
        token:                 params.get('token'),
        email:                 params.get('email'),
        password,
        password_confirmation: passwordConfirmation,
      })
      setStatus(res.message ?? 'Password berhasil direset.')
      setTimeout(() => navigate('/sql-mission-control'), 3000)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Terjadi kesalahan. Link mungkin sudah kadaluarsa.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-[#c9d1d9] text-sm font-mono outline-none focus:border-[#00FF41]'

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#161b22] border border-[#30363d] rounded-lg p-6 font-mono">
        <div className="flex items-center gap-2 mb-6">
          <Terminal size={14} className="text-[#00FF41]" />
          <span className="text-xs text-[#00FF41] tracking-widest uppercase">Reset Password</span>
        </div>

        {status ? (
          <div className="space-y-3">
            <p className="text-[#00FF41] text-sm">{status}</p>
            <p className="text-[#8b949e] text-xs">Mengalihkan ke game dalam 3 detik...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-[#8b949e] mb-1 uppercase tracking-widest">Password Baru</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                required minLength={8} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-[#8b949e] mb-1 uppercase tracking-widest">Konfirmasi Password</label>
              <input type="password" value={passwordConfirmation} onChange={e => setPasswordConfirmation(e.target.value)}
                required className={inputCls} />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded border border-[#00FF41] text-[#00FF41] text-sm
                hover:bg-[#00FF41]/10 transition-colors disabled:opacity-50"
            >
              {loading ? 'LOADING...' : 'RESET PASSWORD'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add route to App.jsx**

Add import at the top of `frontend/src/App.jsx`:
```js
import ResetPassword from './pages/ResetPassword'
```

Add route inside `<Routes>` (before the `/:section` catch-all):
```jsx
<Route path="/reset-password" element={<ResetPassword />} />
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/ResetPassword.jsx frontend/src/App.jsx
git commit -m "feat: add ResetPassword page and route"
```

---

## Task 13: LeaderboardModal + LeaderboardTable

**Files:**
- Create: `frontend/src/components/sql-game/leaderboard/LeaderboardTable.jsx`
- Create: `frontend/src/components/sql-game/leaderboard/LeaderboardModal.jsx`

- [ ] **Step 1: Create LeaderboardTable.jsx**

```jsx
// frontend/src/components/sql-game/leaderboard/LeaderboardTable.jsx
import { Crown, Zap } from 'lucide-react'

function formatSeconds(s) {
  if (s == null) return '—'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

export function LeaderboardTable({ rows, callerRow, type, loggedIn }) {
  if (!rows) {
    return (
      <div className="flex items-center justify-center h-32 text-sql-dim text-xs font-mono">
        LOADING...
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sql-dim text-xs font-mono">
        Belum ada data leaderboard untuk dataset ini.
      </div>
    )
  }

  const rankIcon = (rank) => {
    if (rank === 1) return <Crown size={12} className="text-yellow-400" />
    if (rank === 2) return <Crown size={12} className="text-[#aaa]" />
    if (rank === 3) return <Crown size={12} className="text-amber-600" />
    return <span className="text-sql-dim">{rank}</span>
  }

  const Row = ({ item, separator }) => (
    <>
      {separator && (
        <tr>
          <td colSpan={4} className="py-1 px-3">
            <div className="border-t border-dashed border-border" />
          </td>
        </tr>
      )}
      <tr className={item.is_me ? 'bg-sql-primary/10' : 'hover:bg-surface'}>
        <td className="py-2 px-3 text-center w-10">{rankIcon(item.rank)}</td>
        <td className={`py-2 px-3 font-mono text-sm ${item.is_me ? 'text-sql-primary font-semibold' : 'text-accent'}`}>
          {item.username}
          {item.is_me && <span className="ml-2 text-xs text-sql-dim">(kamu)</span>}
        </td>
        <td className="py-2 px-3 text-right font-mono text-sm text-sql-primary">
          {type === 'xp'
            ? <span>{item.xp?.toLocaleString()} <span className="text-sql-dim text-xs">XP</span></span>
            : <span className="flex items-center justify-end gap-1">
                <Zap size={11} className="text-yellow-400" />{formatSeconds(item.total_seconds)}
              </span>
          }
        </td>
        <td className="py-2 px-3 text-right text-xs text-sql-dim font-mono">
          {item.solved_count} misi
        </td>
      </tr>
    </>
  )

  return (
    <div className="overflow-y-auto flex-1">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="py-2 px-3 text-xs text-sql-dim font-mono text-center w-10">#</th>
            <th className="py-2 px-3 text-xs text-sql-dim font-mono text-left">PLAYER</th>
            <th className="py-2 px-3 text-xs text-sql-dim font-mono text-right">
              {type === 'xp' ? 'XP' : 'WAKTU'}
            </th>
            <th className="py-2 px-3 text-xs text-sql-dim font-mono text-right">MISI</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => <Row key={r.rank} item={r} />)}
          {callerRow && <Row item={callerRow} separator />}
        </tbody>
      </table>
      {!loggedIn && (
        <p className="text-center text-xs text-sql-dim font-mono py-4 border-t border-border">
          Login untuk melihat posisi kamu di leaderboard
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create LeaderboardModal.jsx**

```jsx
// frontend/src/components/sql-game/leaderboard/LeaderboardModal.jsx
import { useState, useEffect } from 'react'
import { X, RefreshCw } from 'lucide-react'
import { sqlGetLeaderboard } from '../../../services/api'
import { LeaderboardTable } from './LeaderboardTable'

export function LeaderboardModal({ onClose, datasets, currentDataset, player }) {
  const [selectedDatasetId, setSelectedDatasetId] = useState(currentDataset?.id ?? datasets[0]?.id ?? '')
  const [tab, setTab]         = useState('xp')      // 'xp' | 'speed'
  const [data, setData]       = useState(null)
  const [callerRow, setCallerRow] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const fetchLeaderboard = async () => {
    if (!selectedDatasetId) return
    setLoading(true)
    setError(null)
    try {
      const res = await sqlGetLeaderboard(selectedDatasetId, tab)
      setData(res.data ?? [])
      setCallerRow(res.caller_row ?? null)
    } catch {
      setError('Gagal memuat leaderboard.')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [selectedDatasetId, tab])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl mx-4 bg-surface border border-border rounded-lg flex flex-col font-mono"
           style={{ maxHeight: '80vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <span className="text-xs text-sql-primary tracking-widest uppercase">LEADERBOARD</span>
          <button onClick={onClose} className="text-sql-dim hover:text-accent transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0 flex-wrap gap-y-2">
          {/* Dataset selector */}
          <select
            value={selectedDatasetId}
            onChange={e => setSelectedDatasetId(e.target.value)}
            className="bg-background border border-border rounded px-2 py-1 text-xs text-accent outline-none flex-1 min-w-0"
          >
            {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          {/* Tab switcher */}
          <div className="flex gap-1">
            {['xp', 'speed'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 text-xs rounded border transition-colors ${
                  tab === t
                    ? 'border-sql-primary text-sql-primary bg-sql-primary/10'
                    : 'border-border text-sql-dim hover:border-accent'
                }`}
              >
                {t === 'xp' ? 'XP' : 'SPEED'}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="text-sql-dim hover:text-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Table */}
        {error ? (
          <div className="flex flex-col items-center justify-center gap-3 h-32">
            <p className="text-red-400 text-xs">{error}</p>
            <button onClick={fetchLeaderboard} className="text-xs text-sql-dim hover:text-accent">
              Coba lagi
            </button>
          </div>
        ) : (
          <LeaderboardTable
            rows={loading ? null : (data ?? [])}
            callerRow={callerRow}
            type={tab}
            loggedIn={!!player}
          />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/sql-game/leaderboard/
git commit -m "feat: add LeaderboardModal and LeaderboardTable components"
```

---

## Task 14: GameShell wiring

**Files:**
- Modify: `frontend/src/components/sql-game/GameShell.jsx`

This task wires everything together: on-load auth check, show/hide modals, login success handler with progress hydration, logout, and passing the right props to SqlGameNavbar.

- [ ] **Step 1: Update GameShell.jsx**

Replace the full `GameShell.jsx` with:

```jsx
// frontend/src/components/sql-game/GameShell.jsx
import { useMemo, useState, useEffect } from 'react'
import { useSqlGameStore } from '../../store/useSqlGameStore'
import { useSqlGame } from '../../hooks/useSqlGame'
import { sqlPlayerMe, sqlPlayerLogout, sqlGetProgress } from '../../services/api'
import { ProgressBar } from './ProgressBar'
import { UserCard } from './sidebar/UserCard'
import { MissionBriefing } from './sidebar/MissionBriefing'
import { ObjectivesList } from './sidebar/ObjectivesList'
import { SchemaPanel } from './sidebar/SchemaPanel'
import { SqlEditor } from './editor/SqlEditor'
import { EditorToolbar } from './editor/EditorToolbar'
import { TerminalOutput } from './output/TerminalOutput'
import { DeployHint } from './output/DeployHint'
import { StageFooter } from './StageFooter'
import { SqlGameNavbar } from './SqlGameNavbar'
import { AuthModal } from './auth/AuthModal'
import { LeaderboardModal } from './leaderboard/LeaderboardModal'

export function GameShell() {
  const store = useSqlGameStore()
  const {
    rank, queryText, setQueryText, lastResult,
    solvedMissions, getDatasetMissions, getCurrentMission,
    currentMissionId, goToNextMission, goToPrevMission, isInitializingDb,
    getSelectedChapter, getSelectedSubchapter, getDbSchema,
    player, playerToken, datasets,
    setPlayer, clearPlayer, hydrateProgress, selectedDataset,
  } = store

  const [showAuth, setShowAuth]             = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  const chapter    = getSelectedChapter()
  const subchapter = getSelectedSubchapter()
  const schema     = useMemo(() => getDbSchema(), [getDbSchema])
  const { handleRun, handleDeploy } = useSqlGame()
  const mission    = getCurrentMission()
  const allMissions = getDatasetMissions()
  const missionIdx  = allMissions.findIndex(m => m.id === currentMissionId)
  const canPrev = missionIdx > 0
  const canNext = missionIdx < allMissions.length - 1 && solvedMissions.includes(currentMissionId)
  const checkedCols = lastResult?.deployResult?.checkedCols ?? {}

  // On mount: restore session from localStorage token
  useEffect(() => {
    const token = localStorage.getItem('sql_player_token')
    if (!token || player) return
    sqlPlayerMe()
      .then(p => setPlayer(p, token))
      .catch(() => localStorage.removeItem('sql_player_token'))
  }, [])

  const handleLoginSuccess = async (p, token) => {
    setPlayer(p, token)
    setShowAuth(false)
    if (selectedDataset) {
      try {
        const progress = await sqlGetProgress(selectedDataset.id)
        if (progress) {
          hydrateProgress(progress.solved_missions ?? [], progress.mission_times ?? {})
        }
      } catch (_) {}
    }
  }

  const handleLogout = async () => {
    try { await sqlPlayerLogout() } catch (_) {}
    clearPlayer()
  }

  const PanelHeader = ({ title }) => (
    <div className="flex items-center justify-between px-3 py-2 border border-border border-b-0 rounded-t bg-surface flex-shrink-0">
      <span className="text-xs font-mono text-sql-dim uppercase tracking-widest">{title}</span>
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-[#FF79C6] opacity-60" />
        <div className="w-2.5 h-2.5 rounded-full bg-sql-primary opacity-60" />
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-background text-accent overflow-hidden">
      <SqlGameNavbar
        player={player}
        onLogin={() => setShowAuth(true)}
        onLogout={handleLogout}
        onLeaderboard={() => setShowLeaderboard(true)}
      />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-72 flex-shrink-0 border-r border-border flex flex-col overflow-y-auto p-4 gap-4 bg-surface">
          {chapter && (
            <div className="font-mono text-xs border-b border-border pb-3">
              <p className="text-sql-dim uppercase tracking-widest mb-1">Modul</p>
              <p className="font-semibold" style={{ color: chapter.color || '#00FF41' }}>
                {chapter.name}
              </p>
              {subchapter && (
                <p className="text-accent-muted mt-0.5">{subchapter.name}</p>
              )}
            </div>
          )}
          <UserCard rank={rank} />
          {mission && (
            <>
              <MissionBriefing title={mission.title} briefing={mission.briefing} />
              <ObjectivesList objectives={mission.objectives || []} checkedCols={checkedCols} />
            </>
          )}
          {schema.length > 0 && <SchemaPanel schema={schema} />}
        </aside>

        {/* Main panel */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0">
          <ProgressBar solved={solvedMissions.length} total={allMissions.length} />

          <div className="flex-1 flex flex-col min-h-0 p-4 gap-3">
            <div className="flex flex-col flex-shrink-0" style={{ height: '40%' }}>
              <PanelHeader title="SQL COMMAND LINE" />
              <SqlEditor
                value={queryText}
                onChange={setQueryText}
                schema={schema}
                onRun={handleRun}
                onDeploy={handleDeploy}
              />
              <EditorToolbar
                charCount={queryText.length}
                onRun={handleRun}
                onDeploy={handleDeploy}
                isInitializing={isInitializingDb}
              />
            </div>

            <DeployHint deployResult={lastResult?.deployResult} />

            <div className="flex-1 min-h-0">
              <TerminalOutput result={lastResult} />
            </div>
          </div>
        </main>
      </div>

      <StageFooter
        onPrev={goToPrevMission}
        onNext={goToNextMission}
        canPrev={canPrev}
        canNext={canNext}
      />

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={handleLoginSuccess}
        />
      )}

      {showLeaderboard && (
        <LeaderboardModal
          onClose={() => setShowLeaderboard(false)}
          datasets={datasets}
          currentDataset={selectedDataset}
          player={player}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update SqlGameNavbar to handle logged-in state**

Replace `frontend/src/components/sql-game/SqlGameNavbar.jsx` with:

```jsx
// frontend/src/components/sql-game/SqlGameNavbar.jsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Terminal, Trophy, User, ChevronDown, LogOut } from 'lucide-react'

export function SqlGameNavbar({ player, onLogin, onLogout, onLeaderboard }) {
  const navigate    = useNavigate()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="flex items-center justify-between px-4 h-11 border-b border-border bg-surface flex-shrink-0 z-10">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-[11px] font-mono text-sql-dim hover:text-accent transition-colors"
        >
          <ArrowLeft size={12} /> BACK
        </button>
        <span className="text-border">│</span>
        <div className="flex items-center gap-1.5">
          <Terminal size={12} className="text-sql-primary" />
          <span className="text-[11px] font-mono text-sql-primary tracking-widest hidden sm:block">
            SQL MISSION CONTROL
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button
          onClick={onLeaderboard}
          className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 border border-border rounded
            text-sql-dim hover:text-accent hover:border-accent transition-colors"
        >
          <Trophy size={11} /> LEADERBOARD
        </button>

        {player ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(o => !o)}
              className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 border border-sql-primary/40 rounded
                text-sql-primary hover:bg-sql-primary/10 transition-colors"
            >
              <User size={11} />
              <span>{player.username}</span>
              <ChevronDown size={10} />
            </button>
            {open && (
              <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded shadow-lg z-20 min-w-[120px]">
                <button
                  onClick={() => { setOpen(false); onLogout() }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-[11px] font-mono text-sql-dim hover:text-accent hover:bg-background transition-colors"
                >
                  <LogOut size={11} /> KELUAR
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 border border-sql-primary/40 rounded
              text-sql-primary hover:bg-sql-primary/10 transition-colors"
          >
            <User size={11} />
            <span>LOGIN</span>
          </button>
        )}
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Verify the app builds**

```bash
cd frontend && npm run build 2>&1 | tail -20
```

Expected: `✓ built in ...` with no errors.

- [ ] **Step 4: Verify the dev server works**

```bash
cd frontend && npm run dev
```

Open `http://localhost:5173/sql-mission-control`. Verify:
1. Navbar shows LOGIN button
2. Clicking LOGIN opens AuthModal
3. LEADERBOARD button opens LeaderboardModal (may show empty state if no data)
4. Registering a new account logs in and shows username in navbar
5. Clicking username shows dropdown with KELUAR
6. Clicking KELUAR clears the session and shows LOGIN again
7. Reloading the page while logged in restores the session

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/sql-game/GameShell.jsx \
        frontend/src/components/sql-game/SqlGameNavbar.jsx
git commit -m "feat: wire auth and leaderboard modals into GameShell"
```

---

## Task 15: Push to Render + smoke test

- [ ] **Step 1: Push all commits**

```bash
git push origin main
```

- [ ] **Step 2: Wait for Render deploy, then smoke test register**

```bash
curl -s -X POST https://<your-render-backend>/api/sql-game/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"smoketest","email":"smoke@example.com","password":"password123","password_confirmation":"password123"}' | python -m json.tool
```

Expected: `{ "token": "...", "player": { "id": "...", "username": "smoketest", ... } }`

- [ ] **Step 3: Test login with new account**

```bash
TOKEN=$(curl -s -X POST https://<your-render-backend>/api/sql-game/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"smoketest","password":"password123"}' | python -c "import sys,json; print(json.load(sys.stdin)['token'])")

curl -s https://<your-render-backend>/api/sql-game/auth/me \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool
```

Expected: `{ "id": "...", "username": "smoketest", "email": "smoke@example.com" }`

- [ ] **Step 4: Test leaderboard endpoint**

```bash
DATASET_ID=$(curl -s https://<your-render-backend>/api/sql-game/config | python -c "import sys,json; print(json.load(sys.stdin)['datasets'][0]['id'])")

curl -s "https://<your-render-backend>/api/sql-game/leaderboard?dataset_id=${DATASET_ID}&type=xp" | python -m json.tool
```

Expected: `{ "data": [], "caller_row": null }` (empty for new install)

- [ ] **Step 5: Delete smoke test account (optional)**

```bash
curl -s -X POST https://<your-render-backend>/api/sql-game/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ SqlPlayer model (Section 1) — Task 1
- ✅ SqlGameProgress model (Section 1) — Task 2
- ✅ SqlMission difficulty field (Section 1) — Task 8
- ✅ XP formula (Section 1) — implemented in SqlLeaderboardController.computeXp() (Task 6)
- ✅ register/login/logout/me routes (Section 2) — Tasks 3, 7
- ✅ forgot-password/reset-password (Section 2) — Task 4
- ✅ Frontend AuthModal with Login/Daftar/Lupa tabs (Section 2) — Task 11
- ✅ Token in localStorage as `sql_player_token` (Section 2) — Tasks 9, 10
- ✅ On-load token restore → GET /me (Section 2) — Task 14
- ✅ GET progress + POST sync (Section 3) — Task 5
- ✅ Store player/token/missionStartTimes/missionTimes (Section 3) — Task 10
- ✅ recordMissionStart on selectDataset/goToNext/goToPrev (Section 3) — Task 10
- ✅ recordMissionSolve from solveMission (Section 3) — Task 10
- ✅ On login: hydrate progress (Section 3) — Task 14
- ✅ GET leaderboard, XP + speed modes (Section 4) — Task 6
- ✅ is_me flag, caller_row outside top 20 (Section 4) — Task 6
- ✅ AuthModal, LoginForm, RegisterForm, ForgotForm (Section 5) — Task 11
- ✅ ResetPassword page + route (Section 5) — Task 12
- ✅ LeaderboardModal + LeaderboardTable (Section 5) — Tasks 13, 14
- ✅ API service additions (Section 5) — Task 9
- ✅ Error: forgot-password mail not configured → 503 (Section 7) — Task 4
- ✅ Error: invalid reset token → 422 (Section 7) — Task 4 (Password facade returns 422)
- ✅ Error: duplicate username/email on register → 422 with field errors (Section 7) — Task 3
- ✅ Sync failure → silent fail (Section 7) — Task 10 (`.catch(() => {})`)
- ✅ Leaderboard failure → empty state + retry (Section 7) — Task 13

**Type consistency check:**
- `playerShape()` in controller returns `{ id, username, email }` — matches what the store expects in `setPlayer(player, token)`
- `sqlGetLeaderboard` returns `{ data, caller_row }` — matches what LeaderboardModal reads
- `sqlGetProgress` returns `{ solved_missions, mission_times, ... }` — matches `hydrateProgress` params
- `hydrateProgress(solvedMissions, missionTimes)` — matches the call in handleLoginSuccess
- `clearPlayer()` (store) called as `clearPlayer()` in GameShell handleLogout — ✅
