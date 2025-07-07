# LifeDash Design Consistency Session - Fortsettelse

## Status: KLAR FOR FORTSETTELSE

### Nåværende Situasjon

Vi har nettopp fullført en drastisk forenkling av stocks-siden og fjernet alt unødvendig innhold. Siden har nå kun:

1. TopNavigationMenu (med Verktøy dropdown)
2. PortfolioChartSection (hovedfokus)
3. HoldingsSection (aksjebeholdninger-tabell)

### Neste Oppgave: DESIGN KONSISTENS

Stocks-siden fungerer, men følger ikke LifeDash design-systemet. Vi må oppdatere farger, typografi, og komponenter for å matche investeringstemaet.

## TODO LISTE (12 oppgaver)

**FASE 1 - Fargeskjema (PRIORITET: HIGH)**

1. ✅ Oppdater TopNavigationMenu med investment-tema farger (navy blue, gradient, hover-effekter)
2. ✅ Endre stocks page bakgrunn fra gray-50 til investment gradient tema
3. ✅ Oppdater Holdings-tabell headers og hover-states med investment-farger

**FASE 2 - Typografi & Layout (PRIORITET: MEDIUM)** 4. ✅ Implementer JetBrains Mono font for alle finansielle tall i holdings-tabell og chart 5. ✅ Oppdater overskrift-hierarki (h1/h2/h3) på stocks-siden for bedre typografi 6. ✅ Standardiser spacing med 4px base system på hele stocks-siden

**FASE 3 - Komponenter (PRIORITET: MEDIUM)** 7. ✅ Legg til investment gradient header på PortfolioChartSection 8. ✅ Oppgrader Holdings-tabell styling til tema-konsistente kort-design 9. ✅ Standardiser alle knapper til å bruke konsistente button variants

**FASE 4 - Animasjoner & Interaksjoner (PRIORITET: LOW)** 10. ✅ Implementer entrance-animasjoner på hovedkomponenter (chart og holdings) 11. ✅ Legg til sophisticated hover-effekter med investment-farger på alle interaktive elementer 12. ✅ Forbedre mobile touch-interaksjoner og responsive design på hele stocks-siden

## Design System Referanser

- **Hovedfarge**: Deep navy blue (#1e40af)
- **Gradient**: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)
- **Finansiell font**: JetBrains Mono for tall
- **Standard font**: Inter for tekst
- **Spacing**: 4px base system
- **Animasjoner**: Framer Motion entrance effects

## Viktige Filer å Modifisere

```
/app/investments/stocks/page.tsx - Hovedlayout og bakgrunn
/components/layout/top-navigation-menu.tsx - Navigation styling
/components/portfolio/holdings-section.tsx - Tabell design
/components/portfolio/portfolio-chart-section.tsx - Chart header
```

## START PROMPT for Neste Session:

```
Vi jobber med design-konsistens på LifeDash investments-siden.

Status: Stocks-siden er forenklet og fungerer, men mangler design-konsistens med resten av applikasjonen.

Oppgave: Vi må oppdatere farger, typografi og komponenter til å følge investment-temaet med navy blue (#1e40af) og investment gradient.

Start med TodoRead for å se full liste over 12 oppgaver organisert i 4 faser.

Hovedfokus:
1. FASE 1 (HIGH priority): TopNavigationMenu farger, stocks page bakgrunn, Holdings-tabell farger
2. FASE 2 (MEDIUM): JetBrains Mono for finansielle tall, heading hierarchy, spacing
3. FASE 3 (MEDIUM): Chart header gradient, Holdings tabell kort-design, button variants
4. FASE 4 (LOW): Animasjoner, hover-effekter, mobile touch

Bruk TodoWrite for å oppdatere status og multiple agents for rask implementering.
```
