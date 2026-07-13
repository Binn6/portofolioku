<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class FinanceAccount extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'finance_accounts';

    protected $fillable = ['nama', 'saldo_awal', 'saldo_sekarang'];
}
