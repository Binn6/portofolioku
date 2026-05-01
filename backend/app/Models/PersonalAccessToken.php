<?php
namespace App\Models;

use MongoDB\Laravel\Eloquent\DocumentModel;

class PersonalAccessToken extends \Laravel\Sanctum\PersonalAccessToken
{
    use DocumentModel;

    protected $connection = 'mongodb';
    protected $collection = 'personal_access_tokens';
    protected $keyType = 'string';

    protected $fillable = [
        'name', 'token', 'abilities', 'expires_at',
    ];

    protected $hidden = ['token'];

    protected $casts = [
        'abilities' => 'array',
        'last_used_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public static function findToken($token): ?static
    {
        if (!str_contains($token, '|')) {
            return static::where('token', hash('sha256', $token))->first();
        }

        [$id, $plainToken] = explode('|', $token, 2);
        $instance = static::find($id);

        if ($instance) {
            return hash_equals($instance->token, hash('sha256', $plainToken)) ? $instance : null;
        }

        return null;
    }
}
