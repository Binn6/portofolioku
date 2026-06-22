# SQL Game Login & Leaderboard Design

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this spec task-by-task.

**Goal:** Add optional player accounts with progress persistence and a public leaderboard to the SQL Mission Control game.

**Architecture:** Separate `SqlPlayer` model (isolated from admin `User`), Laravel Sanctum tokens, auto-sync progress after each solved mission, leaderboard computed on-the-fly from progress documents.

**Tech Stack:** Laravel 11 + MongoDB (mongodb/laravel-mongodb), Laravel Sanctum, React + Zustand, Tailwind CSS.

---

## 1. Data Models

### `SqlPlayer` (collection: `sql_players`)

| Field | Type | Notes |
|---|---|---|
| `username` | string, unique | Display name on leaderboard |
| `email` | string, unique | Used for login + password reset |
| `password` | string | Bcrypt hashed |
| `created_at` | timestamp | Auto |

Uses `HasApiTokens` (Sanctum) and `HasFactory`. Completely separate from the admin `User` model.

### `SqlGameProgress` (collection: `sql_game_progress`)

One document per player+dataset combination. Upserted on each mission solve.

| Field | Type | Notes |
|---|---|---|
| `player_id` | string | `SqlPlayer._id` as string |
| `dataset_id` | string | `SqlDataset._id` as string |
| `solved_missions` | string[] | Mission IDs in solve order |
| `mission_times` | object | `{ [missionId]: seconds }` |
| `started_at` | timestamp | Set on first solve |
| `completed_at` | timestamp\|null | Set when last mission in dataset is solved |
| `total_seconds` | int\|null | Sum of all `mission_times` values |

### `SqlMission` additions

| Field | Type | Notes |
|---|---|---|
| `difficulty` | int\|null | 1–5, admin-set. Falls back to `ceil(stage_order / 2)` if null |

Add `difficulty` field to the Mission admin form (optional number input, 1–5).

### XP Formula (computed on read, not stored)

```
weight         = mission.difficulty ?? ceil(mission.stage_order / 2)
speed_mult     = solved_in ≤ 60s  → 1.5
               | solved_in ≤ 120s → 1.25
               | else             → 1.0
mission_xp     = 100 × weight × speed_mult
total_xp       = sum of mission_xp for all solved missions across all datasets
```

---

## 2. Auth Flow

### Backend routes (prefix: `/api/sql-game/auth/`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `register` | — | username + email + password → token + player |
| POST | `login` | — | email or username + password → token + player |
| POST | `logout` | ✓ | Revoke current token |
| POST | `forgot-password` | — | Email → send reset link (requires `MAIL_*` env vars on Render) |
| POST | `reset-password` | — | `token` + `email` + `password` → update password |
| GET | `me` | ✓ | Return current player info |

All routes live in a new `SqlPlayerAuthController`. The Sanctum guard is extended to also authenticate `SqlPlayer` via the `sanctum.guard` config.

### Frontend auth flow

1. Navbar **LOGIN** button → opens `AuthModal`
2. `AuthModal` has three states: **Login** tab / **Daftar** tab / **Lupa Password** view
3. On success → token stored in `localStorage` as `sql_player_token`, player hydrated into Zustand store
4. Navbar LOGIN changes to `username` with dropdown: **Keluar**
5. Guest play is fully unrestricted — auth is opt-in
6. On app load: if `localStorage` has `sql_player_token` → call `GET /sql-game/auth/me` → if valid, hydrate store; if 401, clear token

---

## 3. Progress Tracking & Timer

### Backend routes (prefix: `/api/sql-game/progress/`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `?dataset_id=xxx` | ✓ | Load player's progress for a dataset |
| POST | `sync` | ✓ | Upsert one solved mission + time |

`POST /sync` payload:
```json
{ "dataset_id": "...", "mission_id": "...", "seconds": 42 }
```

Backend upserts `SqlGameProgress`: pushes `mission_id` to `solved_missions`, sets `mission_times[mission_id]`, recomputes `total_seconds`, sets `completed_at` if the solved mission is the last active mission in the dataset.

### Store additions (`useSqlGameStore`)

```js
player: null,              // { id, username, email } | null
playerToken: null,         // string | null — also persisted in localStorage
missionStartTimes: {},     // { [missionId]: timestamp ms }
missionTimes: {},          // { [missionId]: seconds }
```

**New actions:**
- `setPlayer(player, token)` — set player + token, write token to localStorage
- `logout()` — clear player + token from store + localStorage
- `recordMissionStart(missionId)` — store `Date.now()` for mission
- `recordMissionSolve(missionId)` — compute elapsed seconds, store in `missionTimes`, call sync API if logged in

**Timer triggers:**
- `selectDataset` → call `recordMissionStart(first.id)`
- `goToNextMission` / `goToPrevMission` → call `recordMissionStart(newMission.id)`
- `solveMission` → call `recordMissionSolve(missionId)` (already called from `useSqlGame.handleDeploy`)

**On login:** call `GET /sql-game/progress?dataset_id=xxx` if a dataset is selected → hydrate `solvedMissions` and `missionTimes` into store (do not overwrite missions already solved in current session). Recompute `rank` by replaying `solveMission` logic against the loaded solved list (use the highest `rank_unlock` among solved missions, or default `RANK_PROGRESSION[0]`).

---

## 4. Leaderboard

### Backend route

```
GET /api/sql-game/leaderboard?dataset_id=xxx&type=xp|speed
```

Public — no auth required. Accepts optional `Authorization` header to identify caller for `is_me` flag.

**`type=xp`:** Aggregate all `SqlGameProgress` docs for `dataset_id`. For each player, join solved missions to get `difficulty`/`stage_order`, compute XP per mission using the formula above, sum. Sort descending. Return top 20.

**`type=speed`:** Filter progress docs where `completed_at` is not null (full completion only). Sort by `total_seconds` ascending. Return top 20.

Response item:
```json
{
  "rank": 1,
  "username": "binn6",
  "xp": 1850,
  "total_seconds": 312,
  "solved_count": 5,
  "is_me": true
}
```

(`xp` present on XP tab, `total_seconds` present on Speed tab.)

### Frontend components

- **`LeaderboardModal`** — full-screen modal, dataset selector at top (defaults to current dataset), two tabs: **XP** / **Speed**
- **`LeaderboardTable`** — rank · username · score · missions solved; own row highlighted in green if logged in; if outside top 20 and logged in, appended at bottom with separator
- If not logged in: footer note "Login untuk lihat posisi kamu"

---

## 5. Frontend Components

### New files

```
frontend/src/components/sql-game/auth/AuthModal.jsx
frontend/src/components/sql-game/auth/LoginForm.jsx
frontend/src/components/sql-game/auth/RegisterForm.jsx
frontend/src/components/sql-game/auth/ForgotForm.jsx
frontend/src/pages/ResetPassword.jsx               — route: /reset-password?token=xxx
frontend/src/components/sql-game/leaderboard/LeaderboardModal.jsx
frontend/src/components/sql-game/leaderboard/LeaderboardTable.jsx
```

### Wiring changes

- `GameShell` manages `showAuth` and `showLeaderboard` boolean state; renders the two modals
- `SqlGameNavbar` receives `player`, `onLogin`, `onLogout`, `onLeaderboard` props
- `solveMission` in store → triggers `recordMissionSolve` → if `player` is set, fires sync API call
- `App.jsx` gets a new `/reset-password` route (public, no auth wrapper)

### API service additions (`frontend/src/services/api.js`)

```
sqlPlayerRegister(data)
sqlPlayerLogin(data)
sqlPlayerLogout()
sqlPlayerMe()
sqlPlayerForgotPassword(email)
sqlPlayerResetPassword(data)
sqlGetProgress(datasetId)
sqlSyncProgress(data)
sqlGetLeaderboard(datasetId, type)
```

---

## 6. Backend File Changes

```
backend/app/Models/SqlPlayer.php                        — new
backend/app/Models/SqlGameProgress.php                  — new
backend/app/Http/Controllers/Api/SqlPlayerAuthController.php  — new
backend/app/Http/Controllers/Api/SqlProgressController.php    — new
backend/app/Http/Controllers/Api/SqlLeaderboardController.php — new
backend/config/auth.php                                 — add sql_player guard
backend/routes/api.php                                  — add new routes
backend/app/Models/SqlMission.php                       — add difficulty to fillable/casts
backend/app/Http/Controllers/Api/Admin/AdminSqlMissionController.php — add difficulty to validation
frontend/src/pages/admin/sql-game/MissionForm.jsx       — add difficulty field
```

---

## 7. Error Handling

- `forgot-password` with unconfigured mail → return `503` with message "Layanan email belum dikonfigurasi"
- Invalid/expired reset token → return `422`
- Duplicate username/email on register → return `422` with field-level errors shown in form
- Sync failure (network error) → silent fail, progress still saved in local store; retry on next solve
- Leaderboard fetch failure → show empty state with retry button
