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
