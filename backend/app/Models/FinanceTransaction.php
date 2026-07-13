<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class FinanceTransaction extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'finance_transactions';

    protected $fillable = [
        'deskripsi', 'tanggal', 'jumlah', 'tipe', 'kategori',
        'rekening', 'sumber', 'visitor_tag', 'saldo_setelah',
    ];
}
