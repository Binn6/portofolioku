<?php
// backend/app/Notifications/SqlPlayerResetPassword.php
namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class SqlPlayerResetPassword extends Notification
{
    public function __construct(
        private string $token,
        private string $email
    ) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $frontendUrl = env('FRONTEND_URL', config('app.url'));
        $url = $frontendUrl . '/reset-password?token=' . $this->token . '&email=' . urlencode($this->email);

        return (new MailMessage)
            ->subject('Reset Password - SQL Mission Control')
            ->line('Kamu menerima email ini karena ada permintaan reset password untuk akunmu.')
            ->action('Reset Password', $url)
            ->line('Link ini kadaluarsa dalam 60 menit.')
            ->line('Jika kamu tidak meminta reset password, abaikan email ini.');
    }
}
