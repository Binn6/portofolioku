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
