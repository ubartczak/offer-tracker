# Offer Tracker

Aplikacja do śledzenia ofert pracy. Składa się z backendu REST API, wtyczki Chrome do zapisywania ofert i dashboardu webowego.

## Stack

| Warstwa | Tech |
|---|---|
| Backend | Node.js, TypeScript, Express, Prisma, PostgreSQL |
| Frontend | React 18, TypeScript, Vite, TanStack Query, Tailwind CSS |
| Wtyczka | Chrome Extension MV3, TypeScript, Vite + crxjs |
| Baza danych | PostgreSQL 16 |
| Monorepo | pnpm workspaces |

## Struktura

```
offer-tracker/
├── packages/
│   ├── api/               # REST API
│   │   ├── prisma/        # Schema bazy
│   │   └── src/
│   │       ├── lib/       # Prisma client, JWT utils
│   │       ├── middleware/ # Auth middleware
│   │       └── routes/    # auth, applications
│   ├── web/               # Dashboard webowy (React)
│   └── extension/         # Wtyczka Chrome
│       └── src/
│           ├── background/ # Service worker (auth, API calls)
│           ├── content/    # Scraping ofert per portal
│           └── popup/      # UI wtyczki
├── design/                # Mockupy HTML
└── docker-compose.yml
```

## Pierwsze uruchomienie

### 1. Wymagania

- Node.js 20+
- pnpm 9+
- Docker

### 2. Instalacja

```bash
git clone <repo-url>
cd offer-tracker
pnpm install
```

### 3. Zmienne środowiskowe

Skopiuj szablony i uzupełnij wartości:

```bash
cp packages/api/.env.example packages/api/.env
cp packages/extension/.env.example packages/extension/.env
```

### 4. Baza danych

```bash
docker compose up -d
pnpm --filter api db:migrate
```

### 5. Uruchomienie

```bash
pnpm dev:api        # API na http://localhost:3001
pnpm dev:web        # Dashboard na http://localhost:5173
pnpm dev:ext        # Wtyczka — watch mode, output w packages/extension/dist
```

Każdy serwis uruchamiaj w osobnym terminalu.

## Wtyczka Chrome

### Instalacja w przeglądarce (tryb developerski)

1. Uruchom `pnpm dev:ext`
2. Chrome → `chrome://extensions`
3. Włącz **Tryb dewelopera**
4. **Załaduj rozpakowane** → wskaż `packages/extension/dist`

### Jak działa

1. Otwórz ofertę pracy na obsługiwanym portalu
2. Kliknij ikonę Offer Tracker na pasku Chrome
3. Wtyczka automatycznie wyciąga dane z ogłoszenia
4. Uzupełnij/popraw formularz i kliknij **Zapisz aplikację**

### Obsługiwane portale

- LinkedIn
- JustJoin.it
- Pracuj.pl

## API

Baza URL (lokalnie): `http://localhost:3001`

### Auth

| Metoda | Endpoint | Opis |
|---|---|---|
| POST | `/auth/register` | Rejestracja |
| POST | `/auth/login` | Logowanie |
| POST | `/auth/refresh` | Odświeżenie access tokenu |
| POST | `/auth/logout` | Wylogowanie |

### Aplikacje (wymagają nagłówka `Authorization: Bearer <token>`)

| Metoda | Endpoint | Opis |
|---|---|---|
| GET | `/applications` | Lista z filtrowaniem i paginacją |
| GET | `/applications/stats` | Statystyki |
| POST | `/applications` | Dodaj aplikację |
| PATCH | `/applications/:id` | Aktualizuj status/notatki |
| DELETE | `/applications/:id` | Usuń |

#### Parametry GET /applications

| Param | Typ | Opis |
|---|---|---|
| `status` | enum | `APPLIED` \| `INTERVIEW` \| `OFFER` \| `REJECTED` \| `IGNORED` |
| `portal` | enum | `LINKEDIN` \| `JUSTJOIN` \| `PRACUJ` \| `OTHER` |
| `search` | string | Wyszukiwanie po tytule i firmie |
| `page` | number | Strona (domyślnie: 1) |
| `limit` | number | Wyników na stronę (max: 100, domyślnie: 20) |

## Skrypty

```bash
pnpm dev:api                   # API w trybie watch
pnpm dev:web                   # Frontend w trybie watch
pnpm dev:ext                   # Wtyczka w trybie watch

pnpm --filter api db:migrate   # Utwórz migrację
pnpm --filter api db:studio    # Prisma Studio — GUI bazy na http://localhost:5555

pnpm --filter extension build  # Zbuduj wtyczkę produkcyjnie
```
