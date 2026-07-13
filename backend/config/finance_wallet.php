<?php

return [
    'telegram_bot_token' => env('FINANCE_DEMO_TELEGRAM_BOT_TOKEN'),
    'telegram_group_chat_id' => env('FINANCE_DEMO_TELEGRAM_GROUP_CHAT_ID'),
    'gemini_api_key' => env('FINANCE_DEMO_GEMINI_API_KEY'),
    'gemini_daily_quota' => (int) env('FINANCE_DEMO_GEMINI_DAILY_QUOTA', 300),

    'accounts' => [
        ['nama' => 'Mandiri', 'saldo_awal' => 5000000],
        ['nama' => 'BSI', 'saldo_awal' => 2000000],
        ['nama' => 'Jago', 'saldo_awal' => 1500000],
        ['nama' => 'Dana', 'saldo_awal' => 500000],
        ['nama' => 'Gopay', 'saldo_awal' => 300000],
        ['nama' => 'OVO', 'saldo_awal' => 200000],
    ],

    'budgets' => [
        ['kategori' => 'Makanan', 'limit_bulanan' => 1500000],
        ['kategori' => 'Transport', 'limit_bulanan' => 500000],
        ['kategori' => 'Belanja', 'limit_bulanan' => 800000],
        ['kategori' => 'Tagihan', 'limit_bulanan' => 1000000],
        ['kategori' => 'Hiburan', 'limit_bulanan' => 400000],
        ['kategori' => 'Lainnya', 'limit_bulanan' => 300000],
    ],
];
