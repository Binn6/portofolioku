<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FinanceAccount;
use App\Models\FinanceBudget;
use App\Models\FinanceTransaction;
use App\Services\FinanceWalletService;
use Illuminate\Http\Request;

class FinanceWalletController extends Controller
{
    public function __construct(private FinanceWalletService $service)
    {
    }

    public function message(Request $request)
    {
        $data = $request->validate([
            'visitor_tag' => ['required', 'string', 'max:20', 'regex:/^[a-zA-Z0-9]+$/'],
            'message' => ['required', 'string', 'max:500'],
        ]);

        if (!$this->service->canCallGemini()) {
            return response()->json(['error' => 'quota_exceeded', 'reply' => 'Demo lagi ramai, coba lagi besok.'], 429);
        }

        $this->service->incrementGeminiUsage();
        $classified = $this->service->classifyText($data['message']);

        $payload = $this->handleClassifiedInput($classified, $data['visitor_tag']);
        $this->service->relayToTelegram("[Visitor #{$data['visitor_tag']}] {$data['message']}\n→ {$payload['reply']}");

        return response()->json($payload);
    }

    public function photo(Request $request)
    {
        $data = $request->validate([
            'visitor_tag' => ['required', 'string', 'max:20', 'regex:/^[a-zA-Z0-9]+$/'],
            'photo' => ['required', 'file', 'image', 'max:5120'],
        ]);

        if (!$this->service->canCallGemini()) {
            return response()->json(['error' => 'quota_exceeded', 'reply' => 'Demo lagi ramai, coba lagi besok.'], 429);
        }

        $this->service->incrementGeminiUsage();
        $base64 = base64_encode(file_get_contents($request->file('photo')->getRealPath()));
        $classified = $this->service->classifyReceipt($base64, $request->file('photo')->getMimeType());
        $classified['jenis'] = 'transaksi';

        $payload = $this->handleClassifiedInput($classified, $data['visitor_tag']);
        $this->service->relayToTelegram("[Visitor #{$data['visitor_tag']}] (foto struk)\n→ {$payload['reply']}");

        return response()->json($payload);
    }

    public function confirm(Request $request)
    {
        $data = $request->validate([
            'pending_id' => ['required', 'string'],
            'action' => ['required', 'in:accept,reject'],
            'choice' => ['nullable', 'string', 'max:50'],
        ]);

        $result = $this->service->resolvePending($data['pending_id'], $data['action'], $data['choice'] ?? null);
        $this->service->relayToTelegram("→ {$result['reply']}");

        return response()->json(array_merge(['type' => 'confirm_result'], $result));
    }

    public function state()
    {
        return response()->json([
            'accounts' => FinanceAccount::all(['nama', 'saldo_sekarang']),
            'budgets' => FinanceBudget::all(['kategori', 'limit_bulanan', 'terpakai_bulan_ini']),
            'transactions' => FinanceTransaction::orderBy('created_at', 'desc')->limit(20)->get(),
        ]);
    }

    private function handleClassifiedInput(array $classified, string $visitorTag): array
    {
        return match ($classified['jenis'] ?? 'lainnya') {
            'transaksi' => $this->handleTransaksi($classified, $visitorTag),
            'kategori_baru' => $this->handleKategoriBaru($classified, $visitorTag),
            'cek_saldo' => $this->handleCekSaldo(),
            default => ['type' => 'unknown', 'reply' => "Hmm, gak ngerti maksud lo apa. Coba tulis transaksi (misal 'makan 20rb') atau minta bikin kategori baru."],
        };
    }

    private function handleTransaksi(array $classified, string $visitorTag): array
    {
        $draft = [
            'deskripsi' => $classified['deskripsi'],
            'tanggal' => $classified['tanggal'],
            'jumlah' => $classified['jumlah'],
            'tipe' => $classified['tipe'],
            'kategori' => $classified['kategori'],
            'sumber' => $classified['sumber'] ?? 'Chat',
        ];

        if (empty($classified['rekening'])) {
            $pending = $this->service->createPendingAccountChoice($draft, $visitorTag);

            return [
                'type' => 'pending_account',
                'pending_id' => (string) $pending->_id,
                'reply' => "Transaksi: {$draft['deskripsi']} (Rp" . number_format($draft['jumlah'], 0, ',', '.') . '). Ini dari rekening mana?',
                'options' => ['Mandiri', 'BSI', 'Jago', 'Dana', 'Gopay', 'OVO'],
            ];
        }

        $draft['rekening'] = $classified['rekening'];
        $result = $this->service->recordTransaction($draft, $visitorTag);

        return array_merge(['type' => 'transaction'], $result);
    }

    private function handleKategoriBaru(array $classified, string $visitorTag): array
    {
        $pending = $this->service->createPendingCategory($classified['nama_kategori'], $classified['limit_bulanan'] ?? 0, $visitorTag);

        return [
            'type' => 'pending_category',
            'pending_id' => (string) $pending->_id,
            'reply' => "Mau bikin kategori budget baru: {$classified['nama_kategori']}, limit Rp" . number_format($classified['limit_bulanan'] ?? 0, 0, ',', '.') . ' per bulan?',
        ];
    }

    private function handleCekSaldo(): array
    {
        $accounts = FinanceAccount::all(['nama', 'saldo_sekarang']);
        $lines = $accounts->map(fn ($a) => "- {$a->nama}: Rp" . number_format($a->saldo_sekarang, 0, ',', '.'))->implode("\n");

        return ['type' => 'balance', 'accounts' => $accounts, 'reply' => "💰 Saldo kamu:\n{$lines}"];
    }
}
