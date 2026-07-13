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
