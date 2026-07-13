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
