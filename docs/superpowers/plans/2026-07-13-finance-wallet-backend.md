# Finance Wallet Demo — Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Laravel backend that powers the public Finance Wallet demo — Mongo-backed data model, Gemini-based text/receipt classification, budget intelligence (threshold warnings, reallocation, income expansion), a one-way Telegram relay, rate/quota limiting, and a daily reset — reimplementing the logic from `n8n/Finance Wallet V.1.json` without touching the real personal Notion/Telegram automation.

**Architecture:** New `FinanceWallet*` Mongo models (own collections, isolated from existing `ChatMessage`/`Project` data) + a `FinanceWalletService` holding all business logic + a thin `FinanceWalletController` exposing 4 public throttled REST endpoints. All secrets read from `config('finance_wallet.*')`, sourced from new env vars — never hardcoded.

**Tech Stack:** Laravel 11 (existing), `mongodb/laravel-mongodb` (existing connection `mongodb`), Laravel `Http` facade for Gemini + Telegram calls, Laravel `Cache` facade (store: `database`) for the daily Gemini quota counter, Laravel scheduler (`withSchedule` in `bootstrap/app.php`) for the daily reset.

## Global Constraints

- All Finance Wallet secrets (`FINANCE_DEMO_TELEGRAM_BOT_TOKEN`, `FINANCE_DEMO_TELEGRAM_GROUP_CHAT_ID`, `FINANCE_DEMO_GEMINI_API_KEY`) are read only via `config('finance_wallet.*')`, never hardcoded in PHP or committed to git — matches the spec's mandatory key-rotation prerequisite (`docs/superpowers/specs/2026-07-13-finance-wallet-demo-design.md` §2).
- Every public Finance Wallet route is throttled (`throttle:15,1` for write endpoints, `throttle:60,1` for `GET /state`), following the existing pattern in `backend/routes/api.php` (`/chat`, `/contact`).
- Every test that would call Gemini or Telegram MUST use `Http::fake(...)` — never hit the real APIs from the test suite.
- There is no isolated test database (`phpunit.xml` does not override `DB_CONNECTION`/`DB_DATABASE`); every Feature test that writes `Finance*` Mongo documents MUST delete them in `tearDown()`.
- Wallet data model: one **global shared** wallet (not per-visitor), matching spec §1.

---

### Task 1: Mongo models, config, and daily reset command

**Files:**
- Create: `backend/app/Models/FinanceAccount.php`
- Create: `backend/app/Models/FinanceBudget.php`
- Create: `backend/app/Models/FinanceTransaction.php`
- Create: `backend/app/Models/FinancePendingAction.php`
- Create: `backend/config/finance_wallet.php`
- Modify: `backend/.env.example`
- Create: `backend/app/Console/Commands/ResetFinanceWalletDemo.php`
- Test: `backend/tests/Feature/FinanceWalletResetTest.php`

**Interfaces:**
- Produces: `FinanceAccount` (`nama`, `saldo_awal`, `saldo_sekarang`), `FinanceBudget` (`kategori`, `limit_bulanan`, `terpakai_bulan_ini`), `FinanceTransaction` (`deskripsi`, `tanggal`, `jumlah`, `tipe`, `kategori`, `rekening`, `sumber`, `visitor_tag`, `saldo_setelah`), `FinancePendingAction` (`tipe`, `payload` (array cast), `status`, `visitor_tag`) — all Mongo Eloquent models on connection `mongodb`. `config('finance_wallet.accounts')` and `config('finance_wallet.budgets')` return the seed arrays used by every later task's tests.
- Consumes: nothing (first task).

- [ ] **Step 1: Write the failing test**

Create `backend/tests/Feature/FinanceWalletResetTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\FinanceAccount;
use App\Models\FinanceBudget;
use App\Models\FinancePendingAction;
use App\Models\FinanceTransaction;
use Tests\TestCase;

class FinanceWalletResetTest extends TestCase
{
    protected function tearDown(): void
    {
        FinanceAccount::query()->delete();
        FinanceBudget::query()->delete();
        FinanceTransaction::query()->delete();
        FinancePendingAction::query()->delete();
        parent::tearDown();
    }

    public function test_reset_command_seeds_accounts_and_budgets(): void
    {
        FinanceTransaction::create([
            'deskripsi' => 'sisa transaksi lama', 'tanggal' => '2026-01-01',
            'jumlah' => 1000, 'tipe' => 'Expense', 'kategori' => 'Lainnya',
            'rekening' => 'Mandiri', 'sumber' => 'Chat', 'visitor_tag' => 'ZZZZ',
            'saldo_setelah' => 1000,
        ]);

        $this->artisan('finance-wallet:reset')->assertExitCode(0);

        $this->assertSame(6, FinanceAccount::count());
        $this->assertSame(6, FinanceBudget::count());
        $this->assertSame(0, FinanceTransaction::count());

        $mandiri = FinanceAccount::where('nama', 'Mandiri')->first();
        $this->assertSame(5000000, $mandiri->saldo_sekarang);
        $this->assertSame(5000000, $mandiri->saldo_awal);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && php artisan test --filter=FinanceWalletResetTest`
Expected: FAIL — `Class "App\Models\FinanceAccount" not found` (or command `finance-wallet:reset` not defined).

- [ ] **Step 3: Create the four Mongo models**

`backend/app/Models/FinanceAccount.php`:
```php
<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class FinanceAccount extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'finance_accounts';

    protected $fillable = ['nama', 'saldo_awal', 'saldo_sekarang'];
}
```

`backend/app/Models/FinanceBudget.php`:
```php
<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class FinanceBudget extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'finance_budgets';

    protected $fillable = ['kategori', 'limit_bulanan', 'terpakai_bulan_ini'];
}
```

`backend/app/Models/FinanceTransaction.php`:
```php
<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class FinanceTransaction extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'finance_transactions';

    protected $fillable = [
        'deskripsi', 'tanggal', 'jumlah', 'tipe', 'kategori',
        'rekening', 'sumber', 'visitor_tag', 'saldo_setelah',
    ];
}
```

`backend/app/Models/FinancePendingAction.php`:
```php
<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class FinancePendingAction extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'finance_pending_actions';

    protected $fillable = ['tipe', 'payload', 'status', 'visitor_tag'];

    protected $casts = ['payload' => 'array'];
}
```

- [ ] **Step 4: Create the config file**

`backend/config/finance_wallet.php`:
```php
<?php

return [
    'telegram_bot_token' => env('FINANCE_DEMO_TELEGRAM_BOT_TOKEN'),
    'telegram_group_chat_id' => env('FINANCE_DEMO_TELEGRAM_GROUP_CHAT_ID'),
    'gemini_api_key' => env('FINANCE_DEMO_GEMINI_API_KEY'),
    'gemini_daily_quota' => (int) env('FINANCE_DEMO_GEMINI_DAILY_QUOTA', 300),

    'accounts' => [
        ['nama' => 'Mandiri', 'saldo_awal' => 5000000],
        ['nama' => 'BSI', 'saldo_awal' => 2000000],
        ['nama' => 'Jago', 'saldo_awal' => 1500000],
        ['nama' => 'Dana', 'saldo_awal' => 500000],
        ['nama' => 'Gopay', 'saldo_awal' => 300000],
        ['nama' => 'OVO', 'saldo_awal' => 200000],
    ],

    'budgets' => [
        ['kategori' => 'Makanan', 'limit_bulanan' => 1500000],
        ['kategori' => 'Transport', 'limit_bulanan' => 500000],
        ['kategori' => 'Belanja', 'limit_bulanan' => 800000],
        ['kategori' => 'Tagihan', 'limit_bulanan' => 1000000],
        ['kategori' => 'Hiburan', 'limit_bulanan' => 400000],
        ['kategori' => 'Lainnya', 'limit_bulanan' => 300000],
    ],
];
```

- [ ] **Step 5: Add env vars to `.env.example`**

Modify `backend/.env.example`, append after the existing `CLOUDINARY_API_SECRET=` line (line 72):

```
CLOUDINARY_API_SECRET=

FINANCE_DEMO_TELEGRAM_BOT_TOKEN=
FINANCE_DEMO_TELEGRAM_GROUP_CHAT_ID=
FINANCE_DEMO_GEMINI_API_KEY=
FINANCE_DEMO_GEMINI_DAILY_QUOTA=300
```

- [ ] **Step 6: Create the reset command**

`backend/app/Console/Commands/ResetFinanceWalletDemo.php`:
```php
<?php

namespace App\Console\Commands;

use App\Models\FinanceAccount;
use App\Models\FinanceBudget;
use App\Models\FinancePendingAction;
use App\Models\FinanceTransaction;
use Illuminate\Console\Command;

class ResetFinanceWalletDemo extends Command
{
    protected $signature = 'finance-wallet:reset';
    protected $description = 'Reset koleksi demo Finance Wallet ke data seed awal';

    public function handle(): int
    {
        FinanceTransaction::query()->delete();
        FinancePendingAction::query()->delete();
        FinanceAccount::query()->delete();
        FinanceBudget::query()->delete();

        foreach (config('finance_wallet.accounts') as $account) {
            FinanceAccount::create([
                'nama' => $account['nama'],
                'saldo_awal' => $account['saldo_awal'],
                'saldo_sekarang' => $account['saldo_awal'],
            ]);
        }

        foreach (config('finance_wallet.budgets') as $budget) {
            FinanceBudget::create([
                'kategori' => $budget['kategori'],
                'limit_bulanan' => $budget['limit_bulanan'],
                'terpakai_bulan_ini' => 0,
            ]);
        }

        $this->info('Finance Wallet demo direset ke data seed awal.');

        return self::SUCCESS;
    }
}
```

Laravel 11 auto-discovers commands under `app/Console/Commands` — no manual registration needed.

- [ ] **Step 7: Run test to verify it passes**

Run: `cd backend && php artisan test --filter=FinanceWalletResetTest`
Expected: PASS (1 test, 4 assertions)

- [ ] **Step 8: Commit**

```bash
git add backend/app/Models/FinanceAccount.php backend/app/Models/FinanceBudget.php backend/app/Models/FinanceTransaction.php backend/app/Models/FinancePendingAction.php backend/config/finance_wallet.php backend/.env.example backend/app/Console/Commands/ResetFinanceWalletDemo.php backend/tests/Feature/FinanceWalletResetTest.php
git commit -m "feat: add Finance Wallet demo Mongo models, config, and reset command"
```

---

### Task 2: Gemini text classification

**Files:**
- Create: `backend/app/Services/FinanceWalletService.php`
- Test: `backend/tests/Unit/FinanceWalletServiceClassifyTextTest.php`

**Interfaces:**
- Consumes: `config('finance_wallet.gemini_api_key')` from Task 1.
- Produces: `FinanceWalletService::classifyText(string $message): array` — returns the decoded Gemini JSON (`jenis`, plus fields depending on `jenis`: `transaksi` → `tanggal,jumlah,tipe,kategori,deskripsi,rekening`; `kategori_baru` → `nama_kategori,limit_bulanan`; `cek_saldo` / `lainnya` → no extra fields). Also produces `private FinanceWalletService::parseGeminiJson(?array $response): array`, reused by Task 3.

- [ ] **Step 1: Write the failing test**

`backend/tests/Unit/FinanceWalletServiceClassifyTextTest.php`:
```php
<?php

namespace Tests\Unit;

use App\Services\FinanceWalletService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FinanceWalletServiceClassifyTextTest extends TestCase
{
    public function test_classify_text_parses_transaction_response(): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [[
                    'content' => ['parts' => [[
                        'text' => "```json\n{\"jenis\":\"transaksi\",\"tanggal\":\"2026-07-13\",\"jumlah\":25000,\"tipe\":\"Expense\",\"kategori\":\"Makanan\",\"deskripsi\":\"makan siang\",\"rekening\":null}\n```",
                    ]]],
                ]],
            ], 200),
        ]);

        $result = (new FinanceWalletService())->classifyText('makan siang 25rb');

        $this->assertSame('transaksi', $result['jenis']);
        $this->assertSame(25000, $result['jumlah']);
        $this->assertNull($result['rekening']);
    }

    public function test_classify_text_throws_on_malformed_gemini_response(): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response(['candidates' => []], 200),
        ]);

        $this->expectException(\RuntimeException::class);
        (new FinanceWalletService())->classifyText('halo');
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && php artisan test --filter=FinanceWalletServiceClassifyTextTest`
Expected: FAIL — `Class "App\Services\FinanceWalletService" not found`

- [ ] **Step 3: Implement `classifyText`**

`backend/app/Services/FinanceWalletService.php`:
```php
<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Http;

class FinanceWalletService
{
    private const MODEL_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

    public function classifyText(string $message): array
    {
        $today = Carbon::now('Asia/Makassar')->format('Y-m-d');
        $prompt = "Pesan user: '{$message}'. Tanggal hari ini: {$today}. Klasifikasikan pesan ini lalu balas HANYA JSON valid tanpa teks lain.\n\n"
            . "Jika pesan tentang transaksi keuangan (pemasukan/pengeluaran), format: {\"jenis\":\"transaksi\",\"tanggal\":\"YYYY-MM-DD\",\"jumlah\":angka,\"tipe\":\"Expense atau Income\",\"kategori\":\"salah satu dari: Makanan, Transport, Belanja, Tagihan, Hiburan, Gaji, Lainnya\",\"deskripsi\":\"ringkasan singkat\",\"rekening\":\"salah satu dari: Mandiri, BSI, Jago, Dana, Gopay, OVO -- ATAU null kalau tidak disebutkan sama sekali di pesan\"}\n\n"
            . "Jika pesan minta bikin/tambah kategori budget baru, format: {\"jenis\":\"kategori_baru\",\"nama_kategori\":\"nama kategori yang diminta\",\"limit_bulanan\":angka atau 0 kalau tidak disebutkan}\n\n"
            . "Jika user nanya sisa saldo/berapa duit yang dia punya (semua rekening atau salah satu), format: {\"jenis\":\"cek_saldo\"}\n\n"
            . "Jika pesan tidak berkaitan dengan keuangan sama sekali, format: {\"jenis\":\"lainnya\"}";

        $response = Http::withHeaders([
            'x-goog-api-key' => (string) config('finance_wallet.gemini_api_key'),
            'content-type' => 'application/json',
        ])->post(self::MODEL_URL, [
            'contents' => [
                ['role' => 'user', 'parts' => [['text' => $prompt]]],
            ],
            'generationConfig' => [
                'maxOutputTokens' => 2048,
                'temperature' => 0,
                'thinkingConfig' => ['thinkingBudget' => 0],
            ],
        ]);

        return $this->parseGeminiJson($response->json());
    }

    private function parseGeminiJson(?array $response): array
    {
        $candidate = $response['candidates'][0] ?? null;
        $text = $candidate['content']['parts'][0]['text'] ?? null;

        if (!$text) {
            throw new \RuntimeException('Gemini tidak mengembalikan output valid.');
        }

        $cleaned = trim(preg_replace('/```json|```/', '', $text));
        $data = json_decode($cleaned, true);

        if (!is_array($data)) {
            throw new \RuntimeException('Gemini mengembalikan JSON yang tidak valid.');
        }

        return $data;
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && php artisan test --filter=FinanceWalletServiceClassifyTextTest`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/app/Services/FinanceWalletService.php backend/tests/Unit/FinanceWalletServiceClassifyTextTest.php
git commit -m "feat: add Gemini text classification to FinanceWalletService"
```

---

### Task 3: Gemini receipt OCR

**Files:**
- Modify: `backend/app/Services/FinanceWalletService.php`
- Test: `backend/tests/Unit/FinanceWalletServiceClassifyReceiptTest.php`

**Interfaces:**
- Consumes: `self::MODEL_URL`, `parseGeminiJson()` from Task 2.
- Produces: `FinanceWalletService::classifyReceipt(string $base64Data, string $mimeType): array` — returns `tanggal,jumlah,tipe,kategori,deskripsi,sumber` (`sumber` always `'Foto Struk'`).

- [ ] **Step 1: Write the failing test**

`backend/tests/Unit/FinanceWalletServiceClassifyReceiptTest.php`:
```php
<?php

namespace Tests\Unit;

use App\Services\FinanceWalletService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FinanceWalletServiceClassifyReceiptTest extends TestCase
{
    public function test_classify_receipt_parses_response_and_tags_source(): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [[
                    'content' => ['parts' => [[
                        'text' => '{"tanggal":"2026-07-13","jumlah":45000,"tipe":"Expense","kategori":"Belanja","deskripsi":"struk indomaret"}',
                    ]]],
                ]],
            ], 200),
        ]);

        $result = (new FinanceWalletService())->classifyReceipt(base64_encode('fake-image-bytes'), 'image/jpeg');

        $this->assertSame(45000, $result['jumlah']);
        $this->assertSame('Foto Struk', $result['sumber']);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && php artisan test --filter=FinanceWalletServiceClassifyReceiptTest`
Expected: FAIL — `Call to undefined method App\Services\FinanceWalletService::classifyReceipt()`

- [ ] **Step 3: Implement `classifyReceipt`**

Add to `backend/app/Services/FinanceWalletService.php`, inside the class, after `classifyText`:
```php
    public function classifyReceipt(string $base64Data, string $mimeType): array
    {
        $prompt = 'Ekstrak data transaksi dari struk ini. Balas HANYA dengan JSON valid, tanpa teks lain, format persis: '
            . '{"tanggal":"YYYY-MM-DD","jumlah":angka,"tipe":"Expense","kategori":"salah satu dari: Makanan, Transport, Belanja, Tagihan, Hiburan, Lainnya","deskripsi":"ringkasan singkat"}';

        $response = Http::withHeaders([
            'x-goog-api-key' => (string) config('finance_wallet.gemini_api_key'),
            'content-type' => 'application/json',
        ])->post(self::MODEL_URL, [
            'contents' => [[
                'role' => 'user',
                'parts' => [
                    ['inline_data' => ['mime_type' => $mimeType, 'data' => $base64Data]],
                    ['text' => $prompt],
                ],
            ]],
            'generationConfig' => [
                'maxOutputTokens' => 2048,
                'temperature' => 0,
                'thinkingConfig' => ['thinkingBudget' => 0],
            ],
        ]);

        $data = $this->parseGeminiJson($response->json());
        $data['sumber'] = 'Foto Struk';

        return $data;
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && php artisan test --filter=FinanceWalletServiceClassifyReceiptTest`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add backend/app/Services/FinanceWalletService.php backend/tests/Unit/FinanceWalletServiceClassifyReceiptTest.php
git commit -m "feat: add Gemini receipt OCR to FinanceWalletService"
```

---

### Task 4: Transaction recording, budget threshold, reallocation suggestion, income expansion

**Files:**
- Modify: `backend/app/Services/FinanceWalletService.php`
- Test: `backend/tests/Feature/FinanceWalletServiceRecordTransactionTest.php`

**Interfaces:**
- Consumes: `FinanceAccount`, `FinanceBudget`, `FinanceTransaction`, `FinancePendingAction` models (Task 1); `finance-wallet:reset` artisan command (Task 1) for test setup.
- Produces: `FinanceWalletService::recordTransaction(array $data, string $visitorTag): array` where `$data` has keys `deskripsi,tanggal,jumlah,tipe,kategori,rekening,sumber`. Returns:
  ```php
  [
    'transaction' => array, // the created FinanceTransaction as array
    'reply' => string,
    'budget_warning' => null | ['level' => '80'|'90', 'kategori' => string, 'persen' => int],
    'realokasi_suggestion' => null | ['pending_id' => string, 'dari_kategori' => string, 'ke_kategori' => string, 'jumlah' => int],
    'expansion' => null | array<['kategori','limit_lama','limit_baru','tambahan']>,
  ]
  ```
  Used directly by Task 5 (pending resolution) and Task 7 (controller).

- [ ] **Step 1: Write the failing tests**

`backend/tests/Feature/FinanceWalletServiceRecordTransactionTest.php`:
```php
<?php

namespace Tests\Feature;

use App\Models\FinanceAccount;
use App\Models\FinanceBudget;
use App\Models\FinancePendingAction;
use App\Models\FinanceTransaction;
use App\Services\FinanceWalletService;
use Tests\TestCase;

class FinanceWalletServiceRecordTransactionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('finance-wallet:reset');
    }

    protected function tearDown(): void
    {
        FinanceAccount::query()->delete();
        FinanceBudget::query()->delete();
        FinanceTransaction::query()->delete();
        FinancePendingAction::query()->delete();
        parent::tearDown();
    }

    public function test_record_expense_updates_account_and_budget(): void
    {
        $result = (new FinanceWalletService())->recordTransaction([
            'deskripsi' => 'makan siang', 'tanggal' => '2026-07-13',
            'jumlah' => 25000, 'tipe' => 'Expense', 'kategori' => 'Makanan',
            'rekening' => 'Mandiri', 'sumber' => 'Chat',
        ], 'A3F2');

        $this->assertSame(4975000, FinanceAccount::where('nama', 'Mandiri')->first()->saldo_sekarang);
        $this->assertSame(25000, FinanceBudget::where('kategori', 'Makanan')->first()->terpakai_bulan_ini);
        $this->assertNull($result['budget_warning']);
        $this->assertNull($result['realokasi_suggestion']);
    }

    public function test_record_expense_over_90_percent_creates_realokasi_suggestion(): void
    {
        FinanceBudget::where('kategori', 'Makanan')->update(['limit_bulanan' => 100000]);

        $result = (new FinanceWalletService())->recordTransaction([
            'deskripsi' => 'belanja bulanan', 'tanggal' => '2026-07-13',
            'jumlah' => 95000, 'tipe' => 'Expense', 'kategori' => 'Makanan',
            'rekening' => 'Mandiri', 'sumber' => 'Chat',
        ], 'A3F2');

        $this->assertSame('90', $result['budget_warning']['level']);
        $this->assertNotNull($result['realokasi_suggestion']);
        $this->assertSame(1, FinancePendingAction::where('tipe', 'realokasi')->count());
    }

    public function test_record_income_expands_all_budget_limits_proportionally(): void
    {
        $totalBefore = FinanceBudget::sum('limit_bulanan');

        (new FinanceWalletService())->recordTransaction([
            'deskripsi' => 'gaji bulanan', 'tanggal' => '2026-07-13',
            'jumlah' => 1000000, 'tipe' => 'Income', 'kategori' => 'Gaji',
            'rekening' => 'Mandiri', 'sumber' => 'Chat',
        ], 'A3F2');

        $totalAfter = FinanceBudget::sum('limit_bulanan');
        $this->assertSame($totalBefore + 1000000, $totalAfter);
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && php artisan test --filter=FinanceWalletServiceRecordTransactionTest`
Expected: FAIL — `Call to undefined method App\Services\FinanceWalletService::recordTransaction()`

- [ ] **Step 3: Implement `recordTransaction` and its private helpers**

Add to `backend/app/Services/FinanceWalletService.php` — first add imports at the top of the file (after `namespace App\Services;`):
```php
use App\Models\FinanceAccount;
use App\Models\FinanceBudget;
use App\Models\FinancePendingAction;
use App\Models\FinanceTransaction;
```

Then add these methods inside the class, after `classifyReceipt`:
```php
    public function recordTransaction(array $data, string $visitorTag): array
    {
        $account = FinanceAccount::where('nama', $data['rekening'])->firstOrFail();
        $saldoLama = $account->saldo_sekarang;
        $saldoBaru = $data['tipe'] === 'Expense' ? $saldoLama - $data['jumlah'] : $saldoLama + $data['jumlah'];
        $account->update(['saldo_awal' => $saldoLama, 'saldo_sekarang' => $saldoBaru]);

        $transaction = FinanceTransaction::create([
            'deskripsi' => $data['deskripsi'],
            'tanggal' => $data['tanggal'],
            'jumlah' => $data['jumlah'],
            'tipe' => $data['tipe'],
            'kategori' => $data['kategori'],
            'rekening' => $data['rekening'],
            'sumber' => $data['sumber'],
            'visitor_tag' => $visitorTag,
            'saldo_setelah' => $saldoBaru,
        ]);

        $result = [
            'transaction' => $transaction->toArray(),
            'reply' => '✅ Tercatat: ' . $data['deskripsi'] . ' - Rp' . number_format($data['jumlah'], 0, ',', '.') . ' (' . $data['kategori'] . ').',
            'budget_warning' => null,
            'realokasi_suggestion' => null,
            'expansion' => null,
        ];

        if ($data['tipe'] === 'Expense') {
            $budget = FinanceBudget::where('kategori', $data['kategori'])->first();
            if ($budget) {
                $terpakai = $budget->terpakai_bulan_ini + $data['jumlah'];
                $budget->update(['terpakai_bulan_ini' => $terpakai]);
                $limit = $budget->limit_bulanan ?: 0;
                $persen = $limit > 0 ? (int) round(($terpakai / $limit) * 100) : 100;

                if ($persen >= 80) {
                    $level = $persen >= 90 ? '90' : '80';
                    $result['budget_warning'] = ['level' => $level, 'kategori' => $data['kategori'], 'persen' => $persen];
                    $result['realokasi_suggestion'] = $this->suggestRealokasi($data['kategori'], $limit, $visitorTag);
                }
            }
        } else {
            $result['expansion'] = $this->expandBudgets($data['jumlah']);
        }

        return $result;
    }

    private function suggestRealokasi(string $kategoriTarget, float $limitTarget, string $visitorTag): ?array
    {
        $kandidat = FinanceBudget::where('kategori', '!=', $kategoriTarget)->get()
            ->map(fn ($b) => ['kategori' => $b->kategori, 'sisa' => $b->limit_bulanan - $b->terpakai_bulan_ini])
            ->filter(fn ($b) => $b['sisa'] > 0)
            ->sortByDesc('sisa')
            ->values();

        if ($kandidat->isEmpty()) {
            return null;
        }

        $sumber = $kandidat->first();
        $topUp = (int) min(round($limitTarget * 0.2), $sumber['sisa']);

        if ($topUp <= 0) {
            return null;
        }

        $pending = FinancePendingAction::create([
            'tipe' => 'realokasi',
            'payload' => [
                'dari_kategori' => $sumber['kategori'],
                'ke_kategori' => $kategoriTarget,
                'jumlah' => $topUp,
            ],
            'status' => 'pending',
            'visitor_tag' => $visitorTag,
        ]);

        return [
            'pending_id' => (string) $pending->_id,
            'dari_kategori' => $sumber['kategori'],
            'ke_kategori' => $kategoriTarget,
            'jumlah' => $topUp,
        ];
    }

    private function expandBudgets(float $income): array
    {
        $budgets = FinanceBudget::all();
        $totalLimit = $budgets->sum('limit_bulanan');

        if ($totalLimit <= 0) {
            return [];
        }

        $summary = [];
        foreach ($budgets as $budget) {
            $limitLama = $budget->limit_bulanan;
            $proporsi = $limitLama / $totalLimit;
            $tambahan = (int) round($income * $proporsi);
            $limitBaru = $limitLama + $tambahan;

            $budget->update(['limit_bulanan' => $limitBaru]);

            $summary[] = [
                'kategori' => $budget->kategori,
                'limit_lama' => $limitLama,
                'limit_baru' => $limitBaru,
                'tambahan' => $tambahan,
            ];
        }

        return $summary;
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && php artisan test --filter=FinanceWalletServiceRecordTransactionTest`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/app/Services/FinanceWalletService.php backend/tests/Feature/FinanceWalletServiceRecordTransactionTest.php
git commit -m "feat: add transaction recording with budget threshold, reallocation suggestion, and income expansion"
```

---

### Task 5: Pending action resolution (account choice / category / reallocation)

**Files:**
- Modify: `backend/app/Services/FinanceWalletService.php`
- Test: `backend/tests/Feature/FinanceWalletServicePendingActionsTest.php`

**Interfaces:**
- Consumes: `recordTransaction()` (Task 4), `FinancePendingAction`, `FinanceBudget` models (Task 1).
- Produces:
  - `FinanceWalletService::createPendingAccountChoice(array $draftTransaksi, string $visitorTag): FinancePendingAction`
  - `FinanceWalletService::createPendingCategory(string $namaKategori, float $limitBulanan, string $visitorTag): FinancePendingAction`
  - `FinanceWalletService::resolvePending(string $pendingId, string $action, ?string $choice = null): array` — `$action` is `'accept'|'reject'`. Returns `['reply' => string, 'transaction' => array|null, ...any keys recordTransaction returns when tipe is 'rekening']`. Used by Task 7's `POST /confirm`.

- [ ] **Step 1: Write the failing tests**

`backend/tests/Feature/FinanceWalletServicePendingActionsTest.php`:
```php
<?php

namespace Tests\Feature;

use App\Models\FinanceAccount;
use App\Models\FinanceBudget;
use App\Models\FinancePendingAction;
use App\Models\FinanceTransaction;
use App\Services\FinanceWalletService;
use Tests\TestCase;

class FinanceWalletServicePendingActionsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('finance-wallet:reset');
    }

    protected function tearDown(): void
    {
        FinanceAccount::query()->delete();
        FinanceBudget::query()->delete();
        FinanceTransaction::query()->delete();
        FinancePendingAction::query()->delete();
        parent::tearDown();
    }

    public function test_accepting_account_choice_records_the_transaction(): void
    {
        $service = new FinanceWalletService();
        $pending = $service->createPendingAccountChoice([
            'deskripsi' => 'makan siang', 'tanggal' => '2026-07-13',
            'jumlah' => 25000, 'tipe' => 'Expense', 'kategori' => 'Makanan', 'sumber' => 'Chat',
        ], 'A3F2');

        $result = $service->resolvePending((string) $pending->_id, 'accept', 'Mandiri');

        $this->assertSame(1, FinanceTransaction::count());
        $this->assertSame('approved', FinancePendingAction::find($pending->_id)->status);
        $this->assertNotNull($result['transaction']);
    }

    public function test_rejecting_account_choice_creates_no_transaction(): void
    {
        $service = new FinanceWalletService();
        $pending = $service->createPendingAccountChoice([
            'deskripsi' => 'makan siang', 'tanggal' => '2026-07-13',
            'jumlah' => 25000, 'tipe' => 'Expense', 'kategori' => 'Makanan', 'sumber' => 'Chat',
        ], 'A3F2');

        $result = $service->resolvePending((string) $pending->_id, 'reject');

        $this->assertSame(0, FinanceTransaction::count());
        $this->assertSame('rejected', FinancePendingAction::find($pending->_id)->status);
        $this->assertNull($result['transaction']);
    }

    public function test_accepting_category_creates_new_budget(): void
    {
        $service = new FinanceWalletService();
        $pending = $service->createPendingCategory('Donasi', 200000, 'A3F2');

        $service->resolvePending((string) $pending->_id, 'accept');

        $this->assertSame(1, FinanceBudget::where('kategori', 'Donasi')->count());
    }

    public function test_accepting_realokasi_moves_budget_limit(): void
    {
        $pending = FinancePendingAction::create([
            'tipe' => 'realokasi',
            'payload' => ['dari_kategori' => 'Hiburan', 'ke_kategori' => 'Makanan', 'jumlah' => 50000],
            'status' => 'pending',
            'visitor_tag' => 'A3F2',
        ]);
        $hiburanBefore = FinanceBudget::where('kategori', 'Hiburan')->first()->limit_bulanan;
        $makananBefore = FinanceBudget::where('kategori', 'Makanan')->first()->limit_bulanan;

        (new FinanceWalletService())->resolvePending((string) $pending->_id, 'accept');

        $this->assertSame($hiburanBefore - 50000, FinanceBudget::where('kategori', 'Hiburan')->first()->limit_bulanan);
        $this->assertSame($makananBefore + 50000, FinanceBudget::where('kategori', 'Makanan')->first()->limit_bulanan);
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && php artisan test --filter=FinanceWalletServicePendingActionsTest`
Expected: FAIL — `Call to undefined method App\Services\FinanceWalletService::createPendingAccountChoice()`

- [ ] **Step 3: Implement the pending-action methods**

Add to `backend/app/Services/FinanceWalletService.php`, inside the class, after `expandBudgets`:
```php
    public function createPendingAccountChoice(array $draftTransaksi, string $visitorTag): FinancePendingAction
    {
        return FinancePendingAction::create([
            'tipe' => 'rekening',
            'payload' => $draftTransaksi,
            'status' => 'pending',
            'visitor_tag' => $visitorTag,
        ]);
    }

    public function createPendingCategory(string $namaKategori, float $limitBulanan, string $visitorTag): FinancePendingAction
    {
        return FinancePendingAction::create([
            'tipe' => 'kategori',
            'payload' => ['nama_kategori' => $namaKategori, 'limit_bulanan' => $limitBulanan],
            'status' => 'pending',
            'visitor_tag' => $visitorTag,
        ]);
    }

    public function resolvePending(string $pendingId, string $action, ?string $choice = null): array
    {
        $pending = FinancePendingAction::findOrFail($pendingId);

        if ($pending->status !== 'pending') {
            throw new \RuntimeException('Aksi ini sudah diproses sebelumnya.');
        }

        return match ($pending->tipe) {
            'rekening' => $this->resolveRekening($pending, $action, $choice),
            'kategori' => $this->resolveKategori($pending, $action),
            'realokasi' => $this->resolveRealokasi($pending, $action),
            default => throw new \RuntimeException('Tipe pending tidak dikenal.'),
        };
    }

    private function resolveRekening(FinancePendingAction $pending, string $action, ?string $choice): array
    {
        if ($action !== 'accept' || !$choice) {
            $pending->update(['status' => 'rejected']);
            return ['reply' => 'Oke, transaksi dibatalkan.', 'transaction' => null];
        }

        $draft = $pending->payload;
        $draft['rekening'] = $choice;
        $pending->update(['status' => 'approved']);

        return $this->recordTransaction($draft, $pending->visitor_tag);
    }

    private function resolveKategori(FinancePendingAction $pending, string $action): array
    {
        if ($action !== 'accept') {
            $pending->update(['status' => 'rejected']);
            return ['reply' => 'Oke, gak jadi bikin kategori baru.', 'transaction' => null];
        }

        $payload = $pending->payload;
        FinanceBudget::create([
            'kategori' => $payload['nama_kategori'],
            'limit_bulanan' => $payload['limit_bulanan'],
            'terpakai_bulan_ini' => 0,
        ]);
        $pending->update(['status' => 'approved']);

        return [
            'reply' => "✅ Kategori '{$payload['nama_kategori']}' udah dibuat dengan limit Rp" . number_format($payload['limit_bulanan'], 0, ',', '.') . '.',
            'transaction' => null,
        ];
    }

    private function resolveRealokasi(FinancePendingAction $pending, string $action): array
    {
        if ($action !== 'accept') {
            $pending->update(['status' => 'rejected']);
            return ['reply' => 'Oke, gak jadi realokasi. Budget tetap seperti semula.', 'transaction' => null];
        }

        $payload = $pending->payload;
        $dari = FinanceBudget::where('kategori', $payload['dari_kategori'])->firstOrFail();
        $ke = FinanceBudget::where('kategori', $payload['ke_kategori'])->firstOrFail();

        $dari->update(['limit_bulanan' => $dari->limit_bulanan - $payload['jumlah']]);
        $ke->update(['limit_bulanan' => $ke->limit_bulanan + $payload['jumlah']]);
        $pending->update(['status' => 'approved']);

        return [
            'reply' => '✅ Realokasi jalan. Rp' . number_format($payload['jumlah'], 0, ',', '.') . " pindah dari budget {$payload['dari_kategori']} ke {$payload['ke_kategori']}.",
            'transaction' => null,
        ];
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && php artisan test --filter=FinanceWalletServicePendingActionsTest`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/app/Services/FinanceWalletService.php backend/tests/Feature/FinanceWalletServicePendingActionsTest.php
git commit -m "feat: add pending action resolution (account choice, category, reallocation)"
```

---

### Task 6: Telegram relay and Gemini daily quota

**Files:**
- Modify: `backend/app/Services/FinanceWalletService.php`
- Test: `backend/tests/Unit/FinanceWalletServiceTelegramQuotaTest.php`

**Interfaces:**
- Consumes: `config('finance_wallet.telegram_bot_token')`, `config('finance_wallet.telegram_group_chat_id')`, `config('finance_wallet.gemini_daily_quota')`.
- Produces: `FinanceWalletService::relayToTelegram(string $text): void`, `FinanceWalletService::canCallGemini(): bool`, `FinanceWalletService::incrementGeminiUsage(): void`. Used by Task 7 controller.

- [ ] **Step 1: Write the failing tests**

`backend/tests/Unit/FinanceWalletServiceTelegramQuotaTest.php`:
```php
<?php

namespace Tests\Unit;

use App\Services\FinanceWalletService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FinanceWalletServiceTelegramQuotaTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // The testing cache store is the in-memory 'array' driver, which persists
        // for the whole PHPUnit process — flush it so quota counts from other test
        // classes never leak into these assertions.
        Cache::flush();
    }

    public function test_relay_to_telegram_sends_message_when_configured(): void
    {
        Config::set('finance_wallet.telegram_bot_token', 'testtoken');
        Config::set('finance_wallet.telegram_group_chat_id', '-100123');
        Http::fake();

        (new FinanceWalletService())->relayToTelegram('halo dari test');

        Http::assertSent(fn ($request) => str_contains($request->url(), 'testtoken/sendMessage')
            && $request['text'] === 'halo dari test');
    }

    public function test_relay_to_telegram_skips_when_not_configured(): void
    {
        Config::set('finance_wallet.telegram_bot_token', null);
        Http::fake();

        (new FinanceWalletService())->relayToTelegram('halo');

        Http::assertNothingSent();
    }

    public function test_gemini_quota_blocks_after_daily_limit_reached(): void
    {
        Config::set('finance_wallet.gemini_daily_quota', 2);
        $service = new FinanceWalletService();

        $this->assertTrue($service->canCallGemini());
        $service->incrementGeminiUsage();
        $this->assertTrue($service->canCallGemini());
        $service->incrementGeminiUsage();
        $this->assertFalse($service->canCallGemini());
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && php artisan test --filter=FinanceWalletServiceTelegramQuotaTest`
Expected: FAIL — `Call to undefined method App\Services\FinanceWalletService::relayToTelegram()`

- [ ] **Step 3: Implement Telegram relay and quota tracking**

Add `use Illuminate\Support\Facades\Cache;` to the imports at the top of `backend/app/Services/FinanceWalletService.php`, then add these methods inside the class, after `resolveRealokasi`:
```php
    public function relayToTelegram(string $text): void
    {
        $token = config('finance_wallet.telegram_bot_token');
        $chatId = config('finance_wallet.telegram_group_chat_id');

        if (!$token || !$chatId) {
            return;
        }

        Http::post("https://api.telegram.org/bot{$token}/sendMessage", [
            'chat_id' => $chatId,
            'text' => $text,
        ]);
    }

    public function canCallGemini(): bool
    {
        $used = Cache::get($this->quotaCacheKey(), 0);
        return $used < config('finance_wallet.gemini_daily_quota');
    }

    public function incrementGeminiUsage(): void
    {
        $key = $this->quotaCacheKey();
        $used = Cache::get($key, 0);
        Cache::put($key, $used + 1, now()->endOfDay());
    }

    private function quotaCacheKey(): string
    {
        return 'finance_wallet_gemini_quota_' . now('Asia/Makassar')->format('Y-m-d');
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && php artisan test --filter=FinanceWalletServiceTelegramQuotaTest`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/app/Services/FinanceWalletService.php backend/tests/Unit/FinanceWalletServiceTelegramQuotaTest.php
git commit -m "feat: add one-way Telegram relay and Gemini daily quota tracking"
```

---

### Task 7: Public controller and routes

**Files:**
- Create: `backend/app/Http/Controllers/Api/FinanceWalletController.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/FinanceWalletControllerTest.php`

**Interfaces:**
- Consumes: every `FinanceWalletService` method from Tasks 2–6; `FinanceAccount`, `FinanceBudget`, `FinanceTransaction` models from Task 1.
- Produces: 4 public routes — `POST /api/finance-wallet/message`, `POST /api/finance-wallet/photo`, `POST /api/finance-wallet/confirm`, `GET /api/finance-wallet/state` — consumed directly by the frontend plan (`docs/superpowers/plans/2026-07-13-finance-wallet-frontend.md`). Response shapes documented in Step 3 below.

- [ ] **Step 1: Write the failing tests**

`backend/tests/Feature/FinanceWalletControllerTest.php`:
```php
<?php

namespace Tests\Feature;

use App\Models\FinanceAccount;
use App\Models\FinanceBudget;
use App\Models\FinancePendingAction;
use App\Models\FinanceTransaction;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FinanceWalletControllerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('finance-wallet:reset');
        // Same reasoning as FinanceWalletServiceTelegramQuotaTest: the array cache
        // store persists across the whole test run, so flush the Gemini quota
        // counter before every test here too.
        Cache::flush();
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [[
                    'content' => ['parts' => [[
                        'text' => '{"jenis":"transaksi","tanggal":"2026-07-13","jumlah":25000,"tipe":"Expense","kategori":"Makanan","deskripsi":"makan siang","rekening":null}',
                    ]]],
                ]],
            ], 200),
            'api.telegram.org/*' => Http::response(['ok' => true], 200),
        ]);
    }

    protected function tearDown(): void
    {
        FinanceAccount::query()->delete();
        FinanceBudget::query()->delete();
        FinanceTransaction::query()->delete();
        FinancePendingAction::query()->delete();
        parent::tearDown();
    }

    public function test_message_without_account_returns_pending_account(): void
    {
        $response = $this->postJson('/api/finance-wallet/message', [
            'visitor_tag' => 'A3F2',
            'message' => 'makan siang 25rb',
        ]);

        $response->assertStatus(200)->assertJson(['type' => 'pending_account']);
        $this->assertSame(1, FinancePendingAction::where('tipe', 'rekening')->count());
    }

    public function test_confirm_account_choice_records_transaction(): void
    {
        $create = $this->postJson('/api/finance-wallet/message', [
            'visitor_tag' => 'A3F2',
            'message' => 'makan siang 25rb',
        ]);
        $pendingId = $create->json('pending_id');

        $response = $this->postJson('/api/finance-wallet/confirm', [
            'pending_id' => $pendingId,
            'action' => 'accept',
            'choice' => 'Mandiri',
        ]);

        $response->assertStatus(200);
        $this->assertSame(1, FinanceTransaction::count());
        $this->assertSame(4975000, FinanceAccount::where('nama', 'Mandiri')->first()->saldo_sekarang);
    }

    public function test_message_returns_quota_exceeded_when_daily_limit_reached(): void
    {
        Config::set('finance_wallet.gemini_daily_quota', 0);

        $response = $this->postJson('/api/finance-wallet/message', [
            'visitor_tag' => 'A3F2',
            'message' => 'makan siang 25rb',
        ]);

        $response->assertStatus(429)->assertJson(['error' => 'quota_exceeded']);
    }

    public function test_state_returns_accounts_budgets_and_transactions(): void
    {
        $response = $this->getJson('/api/finance-wallet/state');

        $response->assertStatus(200)
            ->assertJsonCount(6, 'accounts')
            ->assertJsonCount(6, 'budgets');
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && php artisan test --filter=FinanceWalletControllerTest`
Expected: FAIL — 404 (route not defined)

- [ ] **Step 3: Implement the controller**

`backend/app/Http/Controllers/Api/FinanceWalletController.php`:
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FinanceAccount;
use App\Models\FinanceBudget;
use App\Models\FinanceTransaction;
use App\Services\FinanceWalletService;
use Illuminate\Http\Request;

class FinanceWalletController extends Controller
{
    public function __construct(private FinanceWalletService $service)
    {
    }

    public function message(Request $request)
    {
        $data = $request->validate([
            'visitor_tag' => ['required', 'string', 'max:20', 'regex:/^[a-zA-Z0-9]+$/'],
            'message' => ['required', 'string', 'max:500'],
        ]);

        if (!$this->service->canCallGemini()) {
            return response()->json(['error' => 'quota_exceeded', 'reply' => 'Demo lagi ramai, coba lagi besok.'], 429);
        }

        $this->service->incrementGeminiUsage();
        $classified = $this->service->classifyText($data['message']);

        $payload = $this->handleClassifiedInput($classified, $data['visitor_tag']);
        $this->service->relayToTelegram("[Visitor #{$data['visitor_tag']}] {$data['message']}\n→ {$payload['reply']}");

        return response()->json($payload);
    }

    public function photo(Request $request)
    {
        $data = $request->validate([
            'visitor_tag' => ['required', 'string', 'max:20', 'regex:/^[a-zA-Z0-9]+$/'],
            'photo' => ['required', 'file', 'image', 'max:5120'],
        ]);

        if (!$this->service->canCallGemini()) {
            return response()->json(['error' => 'quota_exceeded', 'reply' => 'Demo lagi ramai, coba lagi besok.'], 429);
        }

        $this->service->incrementGeminiUsage();
        $base64 = base64_encode(file_get_contents($request->file('photo')->getRealPath()));
        $classified = $this->service->classifyReceipt($base64, $request->file('photo')->getMimeType());
        $classified['jenis'] = 'transaksi';

        $payload = $this->handleClassifiedInput($classified, $data['visitor_tag']);
        $this->service->relayToTelegram("[Visitor #{$data['visitor_tag']}] (foto struk)\n→ {$payload['reply']}");

        return response()->json($payload);
    }

    public function confirm(Request $request)
    {
        $data = $request->validate([
            'pending_id' => ['required', 'string'],
            'action' => ['required', 'in:accept,reject'],
            'choice' => ['nullable', 'string', 'max:50'],
        ]);

        $result = $this->service->resolvePending($data['pending_id'], $data['action'], $data['choice'] ?? null);
        $this->service->relayToTelegram("→ {$result['reply']}");

        return response()->json(array_merge(['type' => 'confirm_result'], $result));
    }

    public function state()
    {
        return response()->json([
            'accounts' => FinanceAccount::all(['nama', 'saldo_sekarang']),
            'budgets' => FinanceBudget::all(['kategori', 'limit_bulanan', 'terpakai_bulan_ini']),
            'transactions' => FinanceTransaction::orderBy('created_at', 'desc')->limit(20)->get(),
        ]);
    }

    private function handleClassifiedInput(array $classified, string $visitorTag): array
    {
        return match ($classified['jenis'] ?? 'lainnya') {
            'transaksi' => $this->handleTransaksi($classified, $visitorTag),
            'kategori_baru' => $this->handleKategoriBaru($classified, $visitorTag),
            'cek_saldo' => $this->handleCekSaldo(),
            default => ['type' => 'unknown', 'reply' => "Hmm, gak ngerti maksud lo apa. Coba tulis transaksi (misal 'makan 20rb') atau minta bikin kategori baru."],
        };
    }

    private function handleTransaksi(array $classified, string $visitorTag): array
    {
        $draft = [
            'deskripsi' => $classified['deskripsi'],
            'tanggal' => $classified['tanggal'],
            'jumlah' => $classified['jumlah'],
            'tipe' => $classified['tipe'],
            'kategori' => $classified['kategori'],
            'sumber' => $classified['sumber'] ?? 'Chat',
        ];

        if (empty($classified['rekening'])) {
            $pending = $this->service->createPendingAccountChoice($draft, $visitorTag);

            return [
                'type' => 'pending_account',
                'pending_id' => (string) $pending->_id,
                'reply' => "Transaksi: {$draft['deskripsi']} (Rp" . number_format($draft['jumlah'], 0, ',', '.') . '). Ini dari rekening mana?',
                'options' => ['Mandiri', 'BSI', 'Jago', 'Dana', 'Gopay', 'OVO'],
            ];
        }

        $draft['rekening'] = $classified['rekening'];
        $result = $this->service->recordTransaction($draft, $visitorTag);

        return array_merge(['type' => 'transaction'], $result);
    }

    private function handleKategoriBaru(array $classified, string $visitorTag): array
    {
        $pending = $this->service->createPendingCategory($classified['nama_kategori'], $classified['limit_bulanan'] ?? 0, $visitorTag);

        return [
            'type' => 'pending_category',
            'pending_id' => (string) $pending->_id,
            'reply' => "Mau bikin kategori budget baru: {$classified['nama_kategori']}, limit Rp" . number_format($classified['limit_bulanan'] ?? 0, 0, ',', '.') . ' per bulan?',
        ];
    }

    private function handleCekSaldo(): array
    {
        $accounts = FinanceAccount::all(['nama', 'saldo_sekarang']);
        $lines = $accounts->map(fn ($a) => "- {$a->nama}: Rp" . number_format($a->saldo_sekarang, 0, ',', '.'))->implode("\n");

        return ['type' => 'balance', 'accounts' => $accounts, 'reply' => "💰 Saldo kamu:\n{$lines}"];
    }
}
```

- [ ] **Step 4: Register the routes**

Modify `backend/routes/api.php` — add the import near the top (after the other `use App\Http\Controllers\Api\...` lines, e.g. after line 8's `ExperienceController` import):
```php
use App\Http\Controllers\Api\FinanceWalletController;
```

Then add this block right after the existing `Route::post('/chat', ...)` / `Route::get('/chat/{sessionId}', ...)` lines (currently lines 33-34):
```php
Route::prefix('finance-wallet')->group(function () {
    Route::post('/message', [FinanceWalletController::class, 'message'])->middleware('throttle:15,1');
    Route::post('/photo', [FinanceWalletController::class, 'photo'])->middleware('throttle:15,1');
    Route::post('/confirm', [FinanceWalletController::class, 'confirm'])->middleware('throttle:15,1');
    Route::get('/state', [FinanceWalletController::class, 'state'])->middleware('throttle:60,1');
});
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && php artisan test --filter=FinanceWalletControllerTest`
Expected: PASS (4 tests)

- [ ] **Step 6: Run the full backend test suite to check for regressions**

Run: `cd backend && php artisan test`
Expected: PASS (all tests, including the ones from Tasks 1–6)

- [ ] **Step 7: Commit**

```bash
git add backend/app/Http/Controllers/Api/FinanceWalletController.php backend/routes/api.php backend/tests/Feature/FinanceWalletControllerTest.php
git commit -m "feat: add Finance Wallet public API endpoints"
```

---

### Task 8: Daily reset scheduling

**Files:**
- Modify: `backend/bootstrap/app.php`
- Modify: `render.yaml`
- Test: `backend/tests/Feature/FinanceWalletScheduleTest.php`

**Interfaces:**
- Consumes: `finance-wallet:reset` command (Task 1).
- Produces: nothing consumed by later tasks — this is the last backend task.

**Context:** `backend/routes/console.php` currently exists but is never loaded (`bootstrap/app.php`'s `withRouting()` does not pass a `commands:` path — verified by running `php artisan schedule:list`, which reports no scheduled tasks even though `routes/console.php` defines an `inspire` command). Rather than touch that unrelated pre-existing gap, this task uses Laravel 11's `withSchedule()` closure directly in `bootstrap/app.php`, which does not depend on `routes/console.php` being loaded.

- [ ] **Step 1: Write the failing test**

`backend/tests/Feature/FinanceWalletScheduleTest.php`:
```php
<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class FinanceWalletScheduleTest extends TestCase
{
    public function test_daily_reset_is_registered_in_the_schedule(): void
    {
        Artisan::call('schedule:list');

        $this->assertStringContainsString('finance-wallet:reset', Artisan::output());
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && php artisan test --filter=FinanceWalletScheduleTest`
Expected: FAIL — output does not contain `finance-wallet:reset`

- [ ] **Step 3: Register the schedule**

Modify `backend/bootstrap/app.php` — add the import after the existing `use` lines (after line 6):
```php
use Illuminate\Console\Scheduling\Schedule;
```

Then change:
```php
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
```
to:
```php
    ->withSchedule(function (Schedule $schedule) {
        $schedule->command('finance-wallet:reset')->dailyAt('00:00')->timezone('Asia/Jakarta');
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && php artisan test --filter=FinanceWalletScheduleTest`
Expected: PASS (1 test)

- [ ] **Step 5: Add a Render Cron Job so the schedule actually fires in production**

Render's free web service plan does not run a persistent OS cron, so Laravel's scheduler (which needs `schedule:run` invoked every minute) won't fire on its own. Add a dedicated Render Cron Job that calls the reset command directly, once a day, independent of Laravel's scheduler.

Modify `render.yaml` — append a second service after the existing `portfolio-backend` web service:
```yaml
services:
  - type: web
    name: portfolio-backend
    env: docker
    branch: main
    dockerfilePath: ./backend/Dockerfile
    dockerContext: ./backend
    plan: free
    healthCheckPath: /up

  - type: cron
    name: finance-wallet-demo-reset
    env: docker
    branch: main
    dockerfilePath: ./backend/Dockerfile
    dockerContext: ./backend
    schedule: "0 17 * * *"
    dockerCommand: php artisan finance-wallet:reset
    plan: free
```

`0 17 * * *` is UTC and corresponds to 00:00 WIB (Asia/Jakarta is UTC+7). **Note for whoever deploys this:** Render's Cron Job service type may not be available on the free plan — check the current Render pricing/dashboard when deploying and adjust `plan:` if needed; if Cron Jobs aren't available on free, the fallback is an external scheduler (e.g. a GitHub Actions workflow on a `schedule:` cron trigger) hitting a new authenticated admin endpoint that calls `Artisan::call('finance-wallet:reset')` — not built here since it's an infra choice to confirm at deploy time, not a design decision.

- [ ] **Step 6: Commit**

```bash
git add backend/bootstrap/app.php backend/tests/Feature/FinanceWalletScheduleTest.php render.yaml
git commit -m "feat: schedule daily Finance Wallet demo reset"
```

---

### Task 9: Safeguard the real n8n workflow and prepare the showcase copy

**Files:**
- Modify: `n8n/Finance Wallet V.1.json`

**Interfaces:**
- Consumes: nothing from other tasks — this only touches the n8n workflow file, not the Laravel app.
- Produces: the sanitized, safeguarded workflow file referenced by the frontend plan's case-study download link.

**Context:** This file currently has the real Telegram bot token and Gemini API key hardcoded in plaintext (in the `Telegram Trigger` node's `notes`, in two `x-goog-api-key` header values, and in two `api.telegram.org/bot<token>/...` URLs), and pinned test data (`pinData`) containing the owner's real Telegram user id/username. Per the design spec §2, none of this may ever be committed. This task strips all of it and adds the `chat.id` safeguard filter discussed during design. **The edits below only update this local reference copy — applying the same filter node to the live, running n8n workflow is a manual step the user does directly in their n8n instance, since Claude has no access to it.**

- [ ] **Step 1: Strip the plaintext bot token from the `Telegram Trigger` node's notes**

In `n8n/Finance Wallet V.1.json`, find:
```json
      "notes": "Bot token: 8948623819:AAG2j4QQ4Omc3ToA2hyc4vrR86OZDH7FdGM -- masukin ke credential Telegram API di n8n, jangan taruh di JSON."
```
Replace with:
```json
      "notes": "Bot token disimpan di credential Telegram API n8n (bukan di JSON ini)."
```

- [ ] **Step 2: Replace the hardcoded Gemini API key with an env var reference**

Find both occurrences (in `Gemini - Baca Struk` and `Gemini - Baca Teks` nodes) of:
```json
              "value": "REDACTED_ROTATED_KEY"
```
Replace both with:
```json
              "value": "={{ $env.GEMINI_API_KEY }}"
```
(This requires `GEMINI_API_KEY` to be set as an environment variable on the n8n instance — a one-time manual setup step in n8n's settings, not part of this file.)

- [ ] **Step 3: Replace the hardcoded Telegram bot token in the two raw HTTP Request URLs**

Find both occurrences (in `Tanya Konfirmasi Kategori Baru` and `Tanya Pilih Rekening` nodes) of:
```json
        "url": "https://api.telegram.org/bot8948623819:AAG2j4QQ4Omc3ToA2hyc4vrR86OZDH7FdGM/sendMessage",
```
Replace both with:
```json
        "url": "={{ 'https://api.telegram.org/bot' + $env.TELEGRAM_BOT_TOKEN + '/sendMessage' }}",
```
(Same as above — requires `TELEGRAM_BOT_TOKEN` set as an n8n environment variable.)

- [ ] **Step 4: Remove the pinned personal test data**

Find:
```json
  "pinData": {
    "Telegram Trigger": [
```
This block runs from `"pinData": {` down to its matching closing `},` right before `"connections": {`. Replace the entire block with:
```json
  "pinData": {},
```

- [ ] **Step 5: Insert the "only my own chat" safeguard filter node**

Add a new node object to the `nodes` array. Insert it right before the array's closing `]` (i.e., immediately after the closing `}` of the last node, `"Balas Notif Reset Bulanan"`, adding a comma after that node's `}`):
```json
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "loose",
            "version": 1
          },
          "conditions": [
            {
              "leftValue": "={{ $json.message?.chat?.id ?? $json.callback_query?.message?.chat?.id }}",
              "rightValue": 1003375942,
              "operator": {
                "type": "number",
                "operation": "equals"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "f47b1e6a-9c3d-4e1a-8b2f-6a1d9c4e7b3a",
      "name": "Filter: Hanya Chat Pribadi",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [1952, 2080],
      "notes": "Safeguard: skip semua update Telegram yang bukan dari chat pribadi owner (chat.id 1003375942), supaya grup demo publik di website portofolio tidak pernah memicu workflow keuangan asli ini. Output 'false' sengaja tidak disambungkan ke node manapun -- itu menghentikan eksekusi untuk update yang bukan dari owner."
    }
```

- [ ] **Step 6: Rewire the connections so the new node sits between `Telegram Trigger` and `Ada Callback Konfirmasi?`**

In the `connections` object, find:
```json
    "Telegram Trigger": {
      "main": [
        [
          {
            "node": "Ada Callback Konfirmasi?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
```
Replace with:
```json
    "Telegram Trigger": {
      "main": [
        [
          {
            "node": "Filter: Hanya Chat Pribadi",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Filter: Hanya Chat Pribadi": {
      "main": [
        [
          {
            "node": "Ada Callback Konfirmasi?",
            "type": "main",
            "index": 0
          }
        ],
        []
      ]
    },
```
(The second, empty array is the IF node's "false" output — intentionally left unconnected so non-owner chats stop there.)

- [ ] **Step 7: Verify the file is still valid JSON**

Run: `cd D:/portofolio && node -e "JSON.parse(require('fs').readFileSync('n8n/Finance Wallet V.1.json', 'utf8')); console.log('valid JSON')"`
Expected: `valid JSON`

- [ ] **Step 8: Commit**

```bash
git add "n8n/Finance Wallet V.1.json"
git commit -m "fix: strip credentials from n8n workflow and add owner-chat safeguard filter"
```

- [ ] **Step 9: Manual action (not scriptable) — apply the same safeguard in the live n8n instance**

In the running n8n instance (not this repo), reproduce Step 5–6 above: add an IF node right after `Telegram Trigger` comparing `chat.id` to the owner's personal chat id, with the `false` branch left unconnected. Import or manually recreate the node — Claude cannot reach the live n8n instance to do this.

---

## Handoff to the frontend plan

Once Task 7 is done, `docs/superpowers/plans/2026-07-13-finance-wallet-frontend.md` can start — it only depends on the 4 routes from Task 7 being live. Tasks 8–9 (scheduling, n8n safeguard) can happen in parallel with frontend work.
