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
