# BLACK CITY platform VPS deployment

This deployment is separate from the legacy VK bot. Use a dedicated directory such as `/opt/black-city-platform`; do not reuse the bot's `/opt/black-city` directory or its data.

## Requirements

- Ubuntu 24.04 or compatible Linux
- Docker Engine and Docker Compose plugin
- A DNS name and TLS reverse proxy for public production use
- A strong unique `POSTGRES_PASSWORD` and `JWT_SECRET` (at least 32 characters)

## First deployment

1. Clone this repository into `/opt/black-city-platform`.
2. Create a root-only `.env` file using the keys below. Do not commit this file.
3. Run `docker compose up -d --build`.
4. Confirm `curl http://127.0.0.1:4000/health` returns status `ok`.
5. Configure a TLS reverse proxy for the chosen API hostname and forward to `127.0.0.1:4000`.
6. Set `CORS_ORIGINS` to the exact public website origin(s). Set the web build's `VITE_API_URL` to the HTTPS API URL before publishing.

Example environment keys (replace all example values):
```dotenv
POSTGRES_DB=black_city_platform
POSTGRES_USER=black_city
POSTGRES_PASSWORD=REPLACE_WITH_A_LONG_RANDOM_PASSWORD
JWT_SECRET=REPLACE_WITH_AT_LEAST_32_RANDOM_CHARACTERS
API_PORT=4000
CORS_ORIGINS=https://feelfonk26.github.io
```

The database is persisted in a dedicated Docker volume named `black_city_platform_pgdata`. Do not run `docker compose down -v` on a live installation because it removes that database volume.

The API currently creates guest web accounts, issues signed 30-day tokens, validates stakes on the server, locks wallet rows in PostgreSQL transactions, and records balance changes in a ledger. The browser must use HTTPS and send an idempotency key for each round. VK launch verification and account linking are separate follow-up work; do not treat an unverified VK launch payload as identity.

## GitHub Actions deployment

After the first manual setup or once the VPS is ready, configure these **repository secrets** under GitHub → Settings → Secrets and variables → Actions → New repository secret:

- `VPS_HOST`: VPS public IP or hostname
- `VPS_USER`: SSH account that can run Docker
- `VPS_SSH_KEY`: private SSH key for that account (never paste it into chat or commit it)
- `VPS_APP_ENV`: the complete multiline environment file shown above, with real unique secrets
- `VPS_SSH_PORT`: optional; defaults to `22`

The deploy workflow targets only `/opt/black-city-platform`. It does not touch `/opt/black-city` or the old bot's data. It requires Docker Engine and the Docker Compose plugin already installed.

After the API has a public HTTPS hostname, add a **repository variable** under Settings → Secrets and variables → Actions → Variables named `VITE_API_URL`, set to that HTTPS URL (for example, `https://api.example.com`). The Pages build reads this variable. The VPS API still needs a TLS reverse proxy for that hostname; do not point the website at an unencrypted HTTP API because browsers block mixed content.
