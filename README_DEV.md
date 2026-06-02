# Development with Docker (Laravel backend)

This project includes a Docker Compose setup to run the Laravel backend with PHP 8.4 and MySQL, avoiding changes to your local XAMPP installation.

Quick steps:

1. Start containers:

```powershell
docker compose up -d
```

2. Install PHP dependencies and prepare application (run inside `app` container):

```powershell
docker compose exec app composer install --no-interaction --prefer-dist
docker compose exec app cp .env.example .env
docker compose exec app php artisan key:generate
```

3. Update `.env` DB settings if needed (defaults in compose are set to `DB_HOST=db`, `DB_DATABASE=laravel`, `DB_USERNAME=root`, `DB_PASSWORD=root`).

4. Run migrations and seed (optional):

```powershell
docker compose exec app php artisan migrate --force --seed
```

5. Start Laravel dev server (inside container):

```powershell
docker compose exec -d app php artisan serve --host=0.0.0.0 --port=8000
```

6. Frontend (Vite) — run locally (already provided):

```powershell
cd c:\xampp\htdocs\SILATORJANA
npm run dev:frontend
```

Frontend will proxy `/api` to `http://localhost:8000` (see `vite.config.ts`).

Notes & troubleshooting:
- If `composer install` fails due to missing PHP extensions, make sure the container built correctly. Rebuild with `docker compose build --no-cache app`.
- If DB migrations fail because MySQL isn't ready yet, wait a few seconds and retry the migrate command.
- To stop containers: `docker compose down`.
