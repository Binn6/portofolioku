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
