FROM php:8.2-fpm

RUN apt-get update && apt-get install -y \
    nginx \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libssl-dev \
    libcurl4-openssl-dev \
    pkg-config \
    zip \
    unzip \
    && rm -rf /var/lib/apt/lists/*

RUN pecl install mongodb \
    && docker-php-ext-enable mongodb \
    && docker-php-ext-install mbstring exif bcmath gd

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY composer.json composer.lock ./
ENV COMPOSER_MEMORY_LIMIT=-1
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

COPY . .

# Build-time bootstrap: use safe dummy values so artisan can boot without real DB/Cloudinary
RUN printf 'APP_KEY=base64:%s\nAPP_ENV=production\nSESSION_DRIVER=array\nCACHE_STORE=array\nDB_CONNECTION=mongodb\nMONGODB_URI=mongodb://localhost/dummy\n' \
        "$(openssl rand -base64 32)" > .env \
    && php artisan package:discover --ansi \
    && rm .env

RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

COPY docker/nginx.conf /etc/nginx/sites-available/default
RUN ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 10000

CMD ["/entrypoint.sh"]
