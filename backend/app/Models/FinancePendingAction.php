<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class FinancePendingAction extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'finance_pending_actions';

    protected $fillable = ['tipe', 'payload', 'status', 'visitor_tag'];

    protected $casts = ['payload' => 'array'];
}
