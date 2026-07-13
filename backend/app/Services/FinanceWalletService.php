<?php

namespace App\Services;

use App\Models\FinanceAccount;
use App\Models\FinanceBudget;
use App\Models\FinancePendingAction;
use App\Models\FinanceTransaction;
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

    public function recordTransaction(array $data, string $visitorTag): array
    {
        $account = FinanceAccount::where('nama', $data['rekening'])->firstOrFail();
        $saldoLama = $account->saldo_sekarang;
        $saldoBaru = $data['tipe'] === 'Expense' ? $saldoLama - $data['jumlah'] : $saldoLama + $data['jumlah'];
        $account->update(['saldo_awal' => $saldoLama, 'saldo_sekarang' => $saldoBaru]);

        $transaction = FinanceTransaction::create([
            'deskripsi' => $data['deskripsi'],
            'tanggal' => $data['tanggal'],
            'jumlah' => $data['jumlah'],
            'tipe' => $data['tipe'],
            'kategori' => $data['kategori'],
            'rekening' => $data['rekening'],
            'sumber' => $data['sumber'],
            'visitor_tag' => $visitorTag,
            'saldo_setelah' => $saldoBaru,
        ]);

        $result = [
            'transaction' => $transaction->toArray(),
            'reply' => '✅ Tercatat: ' . $data['deskripsi'] . ' - Rp' . number_format($data['jumlah'], 0, ',', '.') . ' (' . $data['kategori'] . ').',
            'budget_warning' => null,
            'realokasi_suggestion' => null,
            'expansion' => null,
        ];

        if ($data['tipe'] === 'Expense') {
            $budget = FinanceBudget::where('kategori', $data['kategori'])->first();
            if ($budget) {
                $terpakai = $budget->terpakai_bulan_ini + $data['jumlah'];
                $budget->update(['terpakai_bulan_ini' => $terpakai]);
                $limit = $budget->limit_bulanan ?: 0;
                $persen = $limit > 0 ? (int) round(($terpakai / $limit) * 100) : 100;

                if ($persen >= 80) {
                    $level = $persen >= 90 ? '90' : '80';
                    $result['budget_warning'] = ['level' => $level, 'kategori' => $data['kategori'], 'persen' => $persen];
                    $result['realokasi_suggestion'] = $this->suggestRealokasi($data['kategori'], $limit, $visitorTag);
                }
            }
        } else {
            $result['expansion'] = $this->expandBudgets($data['jumlah']);
        }

        return $result;
    }

    private function suggestRealokasi(string $kategoriTarget, float $limitTarget, string $visitorTag): ?array
    {
        $kandidat = FinanceBudget::where('kategori', '!=', $kategoriTarget)->get()
            ->map(fn ($b) => ['kategori' => $b->kategori, 'sisa' => $b->limit_bulanan - $b->terpakai_bulan_ini])
            ->filter(fn ($b) => $b['sisa'] > 0)
            ->sortByDesc('sisa')
            ->values();

        if ($kandidat->isEmpty()) {
            return null;
        }

        $sumber = $kandidat->first();
        $topUp = (int) min(round($limitTarget * 0.2), $sumber['sisa']);

        if ($topUp <= 0) {
            return null;
        }

        $pending = FinancePendingAction::create([
            'tipe' => 'realokasi',
            'payload' => [
                'dari_kategori' => $sumber['kategori'],
                'ke_kategori' => $kategoriTarget,
                'jumlah' => $topUp,
            ],
            'status' => 'pending',
            'visitor_tag' => $visitorTag,
        ]);

        return [
            'pending_id' => (string) $pending->_id,
            'dari_kategori' => $sumber['kategori'],
            'ke_kategori' => $kategoriTarget,
            'jumlah' => $topUp,
        ];
    }

    private function expandBudgets(float $income): array
    {
        $budgets = FinanceBudget::all();
        $totalLimit = $budgets->sum('limit_bulanan');

        if ($totalLimit <= 0) {
            return [];
        }

        $summary = [];
        foreach ($budgets as $budget) {
            $limitLama = $budget->limit_bulanan;
            $proporsi = $limitLama / $totalLimit;
            $tambahan = (int) round($income * $proporsi);
            $limitBaru = $limitLama + $tambahan;

            $budget->update(['limit_bulanan' => $limitBaru]);

            $summary[] = [
                'kategori' => $budget->kategori,
                'limit_lama' => $limitLama,
                'limit_baru' => $limitBaru,
                'tambahan' => $tambahan,
            ];
        }

        return $summary;
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
