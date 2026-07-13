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
