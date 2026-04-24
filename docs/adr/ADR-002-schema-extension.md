# ADR-002 — Rozszerzenie schematu: widełki, waluta, terminy, notatki, typ umowy

**Status:** Przyjęta  
**Data:** 2026-04-24  

## Kontekst
Pole salary: String? było niewystarczające — uniemożliwiało filtrowanie
po widełkach, nie przechowywało waluty ani typu rozliczenia. Brakowało
też pól na terminy (rozmowa, deadline, ważność oferty), oddzielnego
feedbacku i typu umowy.

## Decyzja
Zastępujemy salary: String? strukturą liczbową. Dodajemy pola terminów,
feedback i contractType.

## Zmiany w schemacie
```prisma
enum SalaryType {
  MONTHLY
  HOURLY
}

model JobApplication {
  // ...pola bez zmian...

  // Finansowe (zastępuje salary String?)
  salaryMin      Int?
  salaryMax      Int?
  currency       String?    @default("PLN")  // PLN | USD | EUR | OTHER
  salaryType     SalaryType @default(MONTHLY)

  // Terminy
  interviewAt    DateTime?
  replyBy        DateTime?
  offerExpiresAt DateTime?

  // Notatki
  notes          String?    // ogólne (zostaje)
  feedback       String?    // po rozmowie / odrzuceniu

  // Kontrakt
  contractType   String?    // "UoP" | "B2B" | "UoZ", pole informacyjne
}
```

## Konsekwencje
- Migracja Prisma — usunięcie salary, dodanie 9 pól + 1 enum
- Wtyczka scrubuje walutę, widełki i typ umowy z treści oferty
- Brak danych produkcyjnych do migracji — salary String? można porzucić
- contractType: pole informacyjne, brak walidacji enum, nie używane
  do obliczeń w MVP
- Przyszłość: brutto/netto kalkulator zależny od contractType — ADR-osobny
