#!/bin/bash
set -e

cd /var/www

php artisan config:cache
php artisan route:cache || php artisan route:clear

php-fpm -D

exec nginx -g "daemon off;"
