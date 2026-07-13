<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class FinanceBudget extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'finance_budgets';

    protected $fillable = ['kategori', 'limit_bulanan', 'terpakai_bulan_ini'];
}
