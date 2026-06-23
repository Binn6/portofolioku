<?php

namespace App\Providers;

use App\Mail\BrevoApiTransport;
use App\Models\PersonalAccessToken;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);

        Mail::extend('brevo', fn() => new BrevoApiTransport(config('services.brevo.key', '')));
    }
}
