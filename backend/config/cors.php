<?php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3001')],
    'allowed_origins_patterns' => [
        '#^http://localhost:\d+$#',
        '#^http://192\.168\.\d+\.\d+:\d+$#',
        '#^https://[\w-]+\.vercel\.app$#',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
