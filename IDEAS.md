# Pomysły na rozwój offer-tracker

## AI - skanowanie i weryfikacja ofert

### Główny flow
1. Użytkownik otwiera ofertę pracy w przeglądarce
2. Wtyczka Chrome wyciąga treść ogłoszenia (title, company, opis, wymagania, URL)
3. Treść trafia do backendu → Claude API analizuje ogłoszenie
4. AI zwraca ustrukturyzowane dane: stanowisko, firma, lokalizacja, widełki, stack, portal
5. Wtyczka pyta: "Czy aplikowałeś na tę ofertę?" + pokazuje wynik analizy
6. Jednym kliknięciem zapisujemy aplikację z wypełnionymi polami

### AI - weryfikacja duplikatów
- Przed zapisem AI porównuje nową ofertę z już zapisanymi (embedding similarity)
- "Wygląda na to że aplikowałeś na podobną ofertę w tej firmie 2 tygodnie temu"
- Chroni przed przypadkowym podwójnym aplikowaniem

### AI - ocena dopasowania
- Na podstawie profilu użytkownika (stack, doświadczenie, oczekiwania płacowe) AI ocenia ofertę 1-10
- Krótkie uzasadnienie: "Wymaga 5 lat w React, masz 2 - ryzykowne. Ale widełki idealne."
- Opcjonalnie: sugestia czy warto aplikować

### AI - analiza statusu aplikacji
- Użytkownik wkleja treść odpowiedzi od rekrutera
- AI klasyfikuje: czy to zaproszenie na rozmowę, odrzucenie, prośba o CV, cisza po rozmowie
- Automatycznie aktualizuje status aplikacji w bazie

---

## Wtyczka Chrome - inne pomysły

- **Auto-detect portalu** - rozpoznaje czy jesteśmy na LinkedIn / JustJoin / Pracuj i dostosowuje scraping
- **Badge z licznikiem** - ikona wtyczki pokazuje liczbę aplikacji z tego tygodnia
- **Przypomnienia** - "Nie słyszałeś od tej firmy od 7 dni - może warto napisać follow-up?"
- **Szybki podgląd** - hover nad ofertą na liście wyników = popup z naszymi notatkami jeśli już aplikowaliśmy

## Frontend (dashboard)

- Kanban: kolumny = statusy (Aplikowano / Rozmowa / Oferta / Odrzucono)
- Wykres aktywności (GitHub-style heatmap) - kiedy i ile aplikacji
- Statystyki: response rate, średni czas do odpowiedzi, które portale działają najlepiej
- Eksport do CSV / PDF
- logout jako white/black list a nie zwykłe usuwaniu tokenu

## Backend

- Webhook od AI pipeline → async processing (żeby nie blokować wtyczki)
- Rate limiting per user na AI calls
- Cache wyników analizy per URL (ta sama oferta = nie analizuj dwa razy)