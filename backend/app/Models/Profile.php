<?php
namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Profile extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'profiles';

    protected $fillable = [
        'name', 'title', 'bio', 'location', 'email', 'phone',
        'github', 'linkedin', 'instagram',
        'cv_path', 'photo_path',
        'photo_public_id', 'cv_public_id',
    ];
}
