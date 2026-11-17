FROM php:8.4-cli

RUN apt-get update && apt-get install -y --no-install-recommends \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libonig-dev \
    libpng-dev \
    libpq-dev \
    libzip-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" bcmath exif gd mbstring pdo pdo_mysql pdo_pgsql pcntl zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

ENV APP_ENV=production

COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress

RUN chmod -R 775 storage bootstrap/cache

EXPOSE 7860

CMD ["sh", "-c", "php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=7860"]
