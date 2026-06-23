<?php

namespace App\Mail;

use Illuminate\Support\Facades\Http;
use Symfony\Component\Mailer\Envelope;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\MessageConverter;

class BrevoApiTransport extends AbstractTransport
{
    public function __construct(private string $apiKey)
    {
        parent::__construct();
    }

    protected function doSend(SentMessage $message): void
    {
        $email = MessageConverter::toEmail($message->getOriginalMessage());

        $fromAddr = $email->getFrom()[0];
        $toList   = array_map(
            fn($a) => array_filter(['email' => $a->getAddress(), 'name' => $a->getName()]),
            $email->getTo()
        );

        $payload = [
            'sender'  => array_filter(['email' => $fromAddr->getAddress(), 'name' => $fromAddr->getName()]),
            'to'      => $toList,
            'subject' => $email->getSubject(),
        ];

        if ($html = $email->getHtmlBody()) {
            $payload['htmlContent'] = $html;
        } else {
            $payload['textContent'] = $email->getTextBody() ?? '';
        }

        $response = Http::withHeaders(['api-key' => $this->apiKey])
            ->post('https://api.brevo.com/v3/smtp/email', $payload);

        if (! $response->successful()) {
            throw new \RuntimeException('Brevo API error ' . $response->status() . ': ' . $response->body());
        }
    }

    public function __toString(): string
    {
        return 'brevo+api';
    }
}
