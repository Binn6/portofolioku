<?php
namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Certificate extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'certificates';

    protected $fillable = ['title', 'issuer', 'date', 'category', 'file_path', 'file_public_id'];
}
