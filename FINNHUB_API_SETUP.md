# 🚀 Finnhub API Setup - Få Ekte Aksjekurser

## VIKTIG: Du må få en ekte Finnhub API nøkkel for at systemet skal fungere!

### Status: Mock data er fjernet, trenger ekte API nøkkel

All mock data er fjernet fra systemet som ønsket. For å få ekte aksjekurser må du nå:

## Steg 1: Registrer deg på Finnhub.io

1. **Gå til**: https://finnhub.io/
2. **Klikk**: "Sign Up" (øverst til høyre)
3. **Opprett konto** med epost og passord
4. **Verifiser epost** hvis nødvendig

## Steg 2: Få din gratis API nøkkel

1. **Logg inn** på Finnhub.io
2. **Gå til Dashboard**: https://finnhub.io/dashboard
3. **Kopier din API nøkkel** (vises som "API Key")

### Gratis Plan Detaljer:
- ✅ **60 kall per minutt** (mer enn nok for applikasjonen)
- ✅ **Real-time priser** for alle markeder
- ✅ **Norske aksjer** (EQNR.OL, DNB.OL, etc.)
- ✅ **Amerikanske aksjer** (AAPL, TSLA, etc.)
- ✅ **Ingen kredittkort påkrevd**

## Steg 3: Legg til API nøkkel i LifeDash

### Rediger .env.local filen:

```bash
# Åpne filen
nano /Users/azhar/Desktop/GITrepoer/PRIVATE/LifeDash/.env.local
```

### Erstatt "demo" med din ekte API nøkkel:

```env
# Finnhub API Configuration (Real Stock Prices)
NEXT_PUBLIC_FINNHUB_API_KEY=din_ekte_api_nøkkel_her
FINNHUB_API_KEY=din_ekte_api_nøkkel_her
```

**Eksempel:**
```env
NEXT_PUBLIC_FINNHUB_API_KEY=abcd1234efgh5678ijkl9012mnop3456
FINNHUB_API_KEY=abcd1234efgh5678ijkl9012mnop3456
```

## Steg 4: Restart utviklingsserveren

```bash
# Stop serveren (Ctrl+C)
# Start på nytt
npm run dev
```

## Steg 5: Test at det fungerer

1. **Gå til**: http://localhost:3002/investments/stocks
2. **Se Finnhub API Test panelet** (nederst til høyre i development mode)
3. **Klikk "Test API Connection"** - skal vise ✅ med ekte AAPL pris
4. **Test norske aksjer** - skal vise ekte EQNR.OL og DNB.OL priser i NOK
5. **Test amerikanske aksjer** - skal vise ekte AAPL og TSLA priser i USD

## Hva Skjer Nå Med Ekte Data:

### ✅ **Ekte Aksjekurser**:
- **EQNR.OL**: Ekte Equinor pris i NOK (oppdateres live)
- **DNB.OL**: Ekte DNB Bank pris i NOK (oppdateres live)
- **AAPL**: Ekte Apple pris i USD (oppdateres live)
- **TSLA**: Ekte Tesla pris i USD (oppdateres live)

### ✅ **Realistiske Bevegelser**:
- Priser følger ekte markedsbevegelser
- Norske aksjer følger Oslo Børs
- Amerikanske aksjer følger NYSE/NASDAQ
- Oppdateringer hver 30-60 sekunder

### ✅ **Riktig Valuta**:
- Norske aksjer vises i NOK
- Amerikanske aksjer vises i USD
- Riktig markedstider (Oslo vs NYSE)

## Feilsøking

### Hvis API testen feiler:
1. **Sjekk API nøkkel**: Må være ekte nøkkel fra Finnhub.io
2. **Restart server**: `npm run dev`
3. **Sjekk console**: Se etter feilmeldinger i browser console
4. **Sjekk rate limits**: Maksimalt 60 kall per minutt

### Hvis norske aksjer ikke fungerer:
- Finnhub støtter norske aksjer, men noen ganger er data forsinket
- Prøv amerikanske aksjer først (AAPL, TSLA) for å teste API

## Alternativ: Hvis Finnhub ikke fungerer

Hvis du får problemer med Finnhub, kan vi prøve:
- **Alpha Vantage API** (5 kall/minutt gratis)
- **Polygon.io API** (5 kall/minutt gratis)
- **IEX Cloud API** (100,000 kall/måned gratis)

---

## 🎯 Resultat

Når API nøkkelen er lagt til vil du se:
- **Ekte aksjekurser** i stedet for mock data
- **Realistiske prisendringer** basert på faktiske markedsbevegelser
- **Live oppdateringer** hver 30-60 sekunder
- **Korrekt valuta** (NOK for norske, USD for amerikanske aksjer)

**Dette var det du ønsket - ekte priser fra ekte API, ingen mock data! 🚀**