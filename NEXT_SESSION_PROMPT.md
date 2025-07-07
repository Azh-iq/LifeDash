# NEXT SESSION PROMPT - Implementer Ekte Aksjekurser

## Brukerens Krav
Brukeren ønsker **EKTE** aksjekurser fra Yahoo Finance eller annen reell API, **IKKE** mock data.

**Brukerens eksakte ord**: "jeg vil ikke ha noen mock api jeg vil ha ekte priser fr ayahoo finance slik at akskjeprisene er riktig til en hver tid"

## Oppgave for Neste Session

**Implementer ekte aksjekurser med Finnhub API og fjern all mock data:**

1. **Registrer på Finnhub.io og få gratis API nøkkel** (60 kall/minutt gratis)
2. **Opprett `/lib/utils/finnhub-api.ts`** - ny fil for ekte API integration
3. **Fjern mock API fallback** fra `/lib/utils/yahoo-finance.ts` (linjer 359-380, 422-459)
4. **Fjern `/lib/utils/mock-stock-api.ts`** completly
5. **Oppdater `/app/investments/stocks/page.tsx`** til å bruke ekte API
6. **Test med ekte norske aksjer** (EQNR.OL, DNB.OL) og amerikanske (AAPL, TSLA)

## Viktige Filer å Fokusere På

### Filer som MÅ Endres:
- `/lib/utils/yahoo-finance.ts` - **FJERN** linjer 359-380 og 422-459 (mock fallback)
- `/lib/utils/mock-stock-api.ts` - **SLETT** denne filen
- `/app/investments/stocks/page.tsx` - oppdater til ekte API
- `.env.local` - legg til `FINNHUB_API_KEY=your_key_here`

### Nye Filer å Lage:
- `/lib/utils/finnhub-api.ts` - ekte API implementation

### Reference Filer:
- `/NEXT_SESSION_REAL_API_PLAN.md` - detaljert implementasjonsplan
- `/NEXT_SESSION_CONTINUATION_PROMPT.md` - full context fra forrige session

## Finnhub API Setup

### API Endepunkt:
```
https://finnhub.io/api/v1/quote?symbol=AAPL&token=YOUR_API_KEY
```

### Norske Aksjer Format:
- EQNR.OL (Equinor)
- DNB.OL (DNB Bank)
- TEL.OL (Telenor)

### Amerikanske Aksjer Format:
- AAPL (Apple)
- TSLA (Tesla)
- MSFT (Microsoft)

## Forventet Resultat

**Etter implementering skal systemet:**
- Hente ekte aksjekurser fra Finnhub API
- Oppdatere priser i real-time
- Vise ekte NOK priser for norske aksjer
- Vise ekte USD priser for amerikanske aksjer
- **INGEN** mock data anywhere

## Test Plan

1. Start dev server: `npm run dev`
2. Gå til `/investments/stocks`
3. Verifiser at aksjeprisene er ekte og realistiske
4. Sjekk at prisene oppdateres over tid
5. Verifiser at norske aksjer viser NOK priser
6. Verifiser at amerikanske aksjer viser USD priser

## Kritiske Punkter

- ⚠️ **FJERN ALL MOCK DATA** - brukeren ønsker kun ekte priser
- ✅ **Implementer rate limiting** for Finnhub API (60 kall/minutt)
- ✅ **Håndter norske og amerikanske aksjer** korrekt
- ✅ **Test grundig** at prisene er ekte og oppdateres

---

**Bruk denne prompten i neste session for å starte direkte på implementeringen av ekte aksjekurser!**