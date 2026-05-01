<?php
namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Skill extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'skills';

    protected $fillable = ['name', 'category', 'level'];
}
