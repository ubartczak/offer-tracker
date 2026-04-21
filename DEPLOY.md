# Deployment — Railway

## Zmienne środowiskowe do ustawienia w Railway

Po dodaniu serwisu PostgreSQL w Railway, `DATABASE_URL` ustawi się automatycznie.
Pozostałe zmienne wpisz ręcznie w zakładce **Variables**:

| Zmienna | Wartość |
|---|---|
| `DATABASE_URL` | *(auto z Railway Postgres)* |
| `JWT_SECRET` | wygeneruj losowy string, np. `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | wygeneruj drugi losowy string |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | `*` *(brak frontu na razie)* |
| `NODE_ENV` | `production` |

## Kroki deploymentu

1. Zaloguj się na railway.app → **New Project → Deploy from GitHub repo**
2. Wybierz `offer-tracker`
3. Railway wykryje `railway.json` automatycznie
4. Dodaj serwis PostgreSQL: **+ New → Database → PostgreSQL**
5. Skopiuj `DATABASE_URL` z Postgres serwisu do serwisu API (lub użyj zmiennej `${{Postgres.DATABASE_URL}}`)
6. Ustaw pozostałe zmienne ze tabeli powyżej
7. Po deployu skopiuj publiczny URL (np. `https://offer-tracker-api.railway.app`)

## Po deploymencie — aktualizacja wtyczki

1. Otwórz `packages/extension/.env.production`
2. Zastąp placeholder prawdziwym URL z Railway:
   ```
   VITE_API_URL=https://offer-tracker-api.railway.app
   ```
3. Zbuduj wtyczkę produkcyjnie:
   ```bash
   pnpm --filter extension build
   ```
4. Spakowany folder `packages/extension/dist` załaduj w Chrome:
   `chrome://extensions → Load unpacked`
