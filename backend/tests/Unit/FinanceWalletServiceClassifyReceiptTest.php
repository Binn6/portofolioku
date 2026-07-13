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
