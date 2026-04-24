# ADR-001 — Dodanie statusu SAVED do enuma ApplicationStatus

**Status:** Przyjęta  
**Data:** 2026-04-24  

## Kontekst
Wtyczka Chrome obsługuje dwa scenariusze zapisu oferty: użytkownik właśnie
aplikował oraz użytkownik chce zapamiętać ofertę na później. Dotychczasowy
enum zaczynał się od APPLIED, co nie pozwalało rozróżnić tych przypadków.

## Rozważane opcje
- **A. Nowy status SAVED w istniejącej tabeli** ✓ wybrano
- **B. Osobna tabela SavedOffer** — odrzucono: duplikacja schematu,
  dwie osobne listy do zarządzania
- **C. Pole boolean isSaved** — odrzucono: tworzy niespójne stany
  (isSaved=true + status=REJECTED)

## Decyzja
Dodajemy SAVED jako pierwszy status w enumie ApplicationStatus.
Wtyczka zapisuje ofertę z SAVED lub APPLIED.
Dashboard domyślnie ukrywa SAVED i udostępnia switch "Pokaż zapisane na później".

## Konsekwencje
- Migracja Prisma — dodanie wartości do enuma
- Popup wtyczki: dwa przyciski zamiast jednego
- Dashboard: switch + domyślny filtr `status != SAVED`
- GET /applications/stats pomija rekordy z status=SAVED
- GET /applications domyślnie nie zwraca SAVED (chyba że ?status=SAVED)

## Zmiana w schemacie
```prisma
enum ApplicationStatus {
  SAVED      // ← dodany
  APPLIED
  INTERVIEW
  OFFER
  REJECTED
  IGNORED
}
```
