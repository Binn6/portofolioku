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
