FROM php:8.4-cli

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       git unzip zip libzip-dev libicu-dev libpng-dev libonig-dev libxml2-dev zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install pdo pdo_mysql mbstring bcmath

# Install composer from official image
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/backend

EXPOSE 8000

CMD ["tail", "-f", "/dev/null"]
