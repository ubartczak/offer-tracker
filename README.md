# Offer Tracker

Aplikacja do śledzenia ofert pracy. Składa się z backendu REST API, wtyczki Chrome do zapisywania ofert i (w planach) dashboardu webowego.

## Stack

| Warstwa | Tech |
|---|---|
| Backend | Node.js, TypeScript, Express, Prisma, PostgreSQL |
| Wtyczka | Chrome Extension MV3, TypeScript, Vite + crxjs |
| Baza danych | PostgreSQL 16 (Docker) |
| Monorepo | pnpm workspaces |

## Struktura

```
offer-tracker/
├── packages/
│   ├── api/               # REST API
│   │   ├── prisma/        # Schema + migracje
│   │   └── src/
│   │       ├── lib/       # Prisma client, JWT utils
│   │       ├── middleware/ # Auth middleware
│   │       └── routes/    # auth, applications
│   └── extension/         # Wtyczka Chrome
│       └── src/
│           ├── background/ # Service worker (auth, API calls)
│           ├── content/    # Scraping ofert per portal
│           └── popup/      # UI wtyczki
├── docker-compose.yml
└── IDEAS.md
```

## Pierwsze uruchomienie

### 1. Wymagania

- Node.js 20+
- pnpm 9+
- Docker

### 2. Instalacja

```bash
git clone https://github.com/ubartczak/offer-tracker.git
cd offer-tracker
pnpm install
```

### 3. Zmienne środowiskowe

Utwórz plik `packages/api/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/offer_tracker"
JWT_SECRET="twoj-dlugi-losowy-string"
JWT_REFRESH_SECRET="inny-dlugi-losowy-string"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3001
CLIENT_URL="http://localhost:5173"
```

### 4. Baza danych

```bash
docker compose up -d
pnpm --filter api db:push
```

### 5. Dev server

```bash
pnpm dev:api        # API na http://localhost:3001
pnpm dev:ext        # Wtyczka — watch mode, output w packages/extension/dist
```

## Wtyczka Chrome

### Instalacja w przeglądarce

1. Zbuduj wtyczkę: `pnpm dev:ext`
2. Chrome → `chrome://extensions`
3. Włącz **Tryb dewelopera**
4. **Załaduj rozpakowane** → wskaż `packages/extension/dist`

### Jak działa

1. Otwórz ofertę pracy na obsługiwanym portalu
2. Kliknij ikonę Offer Tracker na pasku Chrome
3. Wtyczka automatycznie wyciąga dane z ogłoszenia
4. Uzupełnij/popraw formularz i kliknij **Zapisz aplikację**

### Obsługiwane portale

- LinkedIn (`/jobs/*`)
- JustJoin.it
- Pracuj.pl

## API

Baza URL: `http://localhost:3001`

### Auth

| Metoda | Endpoint | Opis |
|---|---|---|
| POST | `/auth/register` | Rejestracja |
| POST | `/auth/login` | Logowanie |
| POST | `/auth/refresh` | Odświeżenie access tokenu |
| POST | `/auth/logout` | Wylogowanie (unieważnienie refresh tokenu) |

### Aplikacje (wymagają Bearer tokenu)

| Metoda | Endpoint | Opis |
|---|---|---|
| GET | `/applications` | Lista z filtrowaniem i paginacją |
| POST | `/applications` | Dodaj aplikację |
| PATCH | `/applications/:id` | Aktualizuj status/notatki |
| DELETE | `/applications/:id` | Usuń |
| GET | `/applications/stats` | Statystyki (response rate, podział per status/portal) |

#### Parametry GET /applications

| Param | Typ | Opis |
|---|---|---|
| `status` | enum | `APPLIED` \| `INTERVIEW` \| `OFFER` \| `REJECTED` \| `IGNORED` |
| `portal` | enum | `LINKEDIN` \| `JUSTJOIN` \| `PRACUJ` \| `OTHER` |
| `search` | string | Wyszukiwanie po tytule i firmie |
| `page` | number | Strona (default: 1) |
| `limit` | number | Wyników na stronę (max: 100, default: 20) |

## Skrypty

```bash
pnpm dev:api          # Uruchom API w trybie watch
pnpm dev:ext          # Buduj wtyczkę w trybie watch

pnpm --filter api db:push      # Synchronizuj schemat z bazą
pnpm --filter api db:studio    # Prisma Studio (GUI bazy)
pnpm --filter api db:migrate   # Utwórz migrację
```

## Pomysły na rozwój

Zobacz [IDEAS.md](./IDEAS.md) — m.in. integracja z AI (Claude API) do analizy ofert, wykrywania duplikatów i oceny dopasowania.
