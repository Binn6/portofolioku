<?php
namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Profile extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'profiles';

    protected $fillable = [
        'name', 'title', 'bio', 'location', 'email', 'phone',
        'github', 'linkedin', 'instagram', 'cv_path',
    ];
}
