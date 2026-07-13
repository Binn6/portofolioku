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
