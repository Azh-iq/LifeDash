# Plan: Implementer Ekte Aksjekurser med Finnhub API

## Brukerens Ønske
Brukeren ønsker **EKTE** aksjekurser fra Yahoo Finance eller annen reell API, **IKKE** mock data.

## Problem med Current Implementation
- Yahoo Finance API returnerer 401 Unauthorized
- Mock API ble implementert som fallback, men brukeren ønsker ekte data
- Trenger en fungerende API for real-time priser

## Anbefalt Løsning: Finnhub API

### Hvorfor Finnhub?
- ✅ Gratis tier (60 kall/minutt)  
- ✅ Støtter norske aksjer (EQNR.OL, DNB.OL)
- ✅ Støtter amerikanske aksjer (AAPL, TSLA)
- ✅ Real-time priser
- ✅ Enkel integrasjon
- ✅ Pålitelig og stabilt

### API Setup
1. **Registrer på Finnhub.io**
   - Få gratis API nøkkel
   - 60 kall per minutt gratis

2. **API Endepunkt**
   ```
   https://finnhub.io/api/v1/quote?symbol=AAPL&token=YOUR_API_KEY
   ```

3. **Norske Aksjer Format**
   ```
   EQNR.OL -> EQNR.OL (samme format)
   DNB.OL -> DNB.OL (samme format)
   ```

### Implementation Plan

#### Steg 1: Lag Finnhub API Integration
- Opprett `/lib/utils/finnhub-api.ts`
- Implementer samme interface som Yahoo Finance
- Håndter rate limiting (60 kall/minutt)

#### Steg 2: Oppdater Environment Variables
```env
FINNHUB_API_KEY=your_api_key_here
```

#### Steg 3: Erstatt Mock API
- Fjern mock API fallback
- Bruk Finnhub som primær API
- Behold Yahoo Finance som backup (hvis det begynner å fungere)

#### Steg 4: Testing
- Test norske aksjer: EQNR.OL, DNB.OL
- Test amerikanske aksjer: AAPL, TSLA
- Verifiser real-time oppdateringer

## Alternative APIs (hvis Finnhub ikke fungerer)

### Alpha Vantage
- Gratis: 5 kall/minutt
- API: `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=API_KEY`

### Polygon.io
- Gratis: 5 kall/minutt
- API: `https://api.polygon.io/v2/aggs/ticker/AAPL/prev?apikey=API_KEY`

### Yahoo Finance Fix (Alternative)
- Prøve forskjellige headers/proxy
- Bruke RapidAPI Yahoo Finance endpoint
- Implementere server-side proxy

## Neste Session Action Plan

1. **Velg API Provider** (anbefaler Finnhub)
2. **Få API nøkkel** 
3. **Implementer ny API integration**
4. **Fjern mock API completely**
5. **Test med ekte norske og amerikanske aksjer**
6. **Verifiser real-time price updates**

## Forventet Resultat
- Ekte aksjekurser fra Finnhub API
- Real-time oppdateringer
- Norske aksjer (EQNR.OL, DNB.OL) med ekte NOK priser
- Amerikanske aksjer (AAPL, TSLA) med ekte USD priser
- Ingen mock data

## Files to Modify
- `/lib/utils/yahoo-finance.ts` -> fjern mock fallback
- `/lib/utils/finnhub-api.ts` -> ny fil for ekte API
- `/app/investments/stocks/page.tsx` -> koble til ekte API
- `.env.local` -> legg til FINNHUB_API_KEY