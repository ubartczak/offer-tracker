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

## Przed pierwszym deployem — inicjalizacja migracji

Railway używa `prisma migrate deploy` (bezpieczne dla produkcji). Wymaga to historii migracji w repozytorium. Uruchom lokalnie **raz**:

```bash
pnpm --filter api db:migrate
# wpisz nazwę migracji, np. "init"
git add packages/api/prisma/migrations
git commit -m "feat: add initial prisma migration"
git push
```

## Branch protection — GitHub

Skonfiguruj ochronę brancha `master` tak, żeby deploy nigdy nie wystartował bez przejścia CI.

W repozytorium GitHub: **Settings → Branches → Add branch ruleset**

Dla brancha `master` ustaw:
- **Require a pull request before merging** (wymagaj PR — blokuje bezpośredni push)
- **Require status checks to pass** → dodaj: `Type check` i `Build`
- **Require branches to be up to date before merging**

Flow po tej zmianie:
```
push do main → CI (typecheck + build)
                      ↓
             PR: main → master → CI musi przejść
                      ↓
              merge → Railway deploy
```

## Kroki deploymentu

1. Zaloguj się na railway.app → **New Project → Deploy from GitHub repo**
2. Wybierz `offer-tracker`
3. Railway wykryje `railway.json` automatycznie
4. W ustawieniach serwisu API zmień **Deployment Branch** z `main` na `master` (Settings → Source → Branch)
5. Dodaj serwis PostgreSQL: **+ New → Database → PostgreSQL**
6. Skopiuj `DATABASE_URL` z Postgres serwisu do serwisu API (lub użyj zmiennej `${{Postgres.DATABASE_URL}}`)
7. Ustaw pozostałe zmienne ze tabeli powyżej
8. Po deployu skopiuj publiczny URL (np. `https://offer-tracker-api.railway.app`)

## GitHub Actions — secret dla buildu rozszerzenia

Workflow `.github/workflows/extension-release.yml` buduje rozszerzenie z docelowym URL API.
Dodaj secret w repozytorium GitHub: **Settings → Secrets → Actions → New repository secret**

| Secret | Wartość |
|---|---|
| `VITE_API_URL` | `https://offer-tracker-api.railway.app` *(Twój URL z Railway)* |

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
