# Mobile Portfolio Dashboard

En komplett mobil-første porteføljedashboard komponent for LifeDash investeringsappen.

## Oversikt

`MobilePortfolioDashboard` er en omfattende React-komponent som gir en fullstendig mobil porteføljeopplevelse med:

- **Mobil-først design**: Optimalisert for touchskjermer og mobile enheter
- **Norsk lokalisering**: Alle tekster på norsk
- **Real-time oppdateringer**: Live prisdata og porteføljeendringer
- **Sammenleggbare seksjoner**: Organisert innhold med jevne animasjoner
- **Dra-til-oppdater**: Intuitiv pull-to-refresh funksjonalitet
- **Touch-vennlige gester**: 44px minimum touch-mål og haptic feedback
- **Tilgjengelighet**: WCAG-kompatibel med riktig semantikk

## Hovedfunksjoner

### 🎨 Design System
- Bruker LifeDash design system (Untitled UI + Financial Dashboard UI Kit)
- Blå investeringstema (`#3B82F6`)
- Konsistente spacing og typografi
- iOS-sikre områder støtte

### 📱 Mobile UX Patterns
- **Collapsible Sections**: Porteføljeoversikt, ytelse, beholdninger, aktivitet
- **Pull-to-Refresh**: Dra ned for å oppdatere data
- **Swipe Gestures**: Sveip for å redigere/slette beholdninger
- **Haptic Feedback**: Vibrasjon for touch-tilbakemelding
- **Bottom Navigation**: Standard mobil navigasjonsmønster

### 📊 Portfolio Features
- **Live Metrics**: Totalverdi, avkastning, posisjoner, kostbasis
- **Performance Chart**: Interaktivt 30-dagers ytelseskart
- **Holdings List**: Detaljert beholdningsliste med sanntidspriser
- **Activity Feed**: Nylig transaksjoner og oppdateringer

### 🔄 State Management
- Integrert med `usePortfolioState` hook
- Smart caching og optimistiske oppdateringer
- Graceful error handling og retry logic
- Loading states for alle operasjoner

## Installation og Bruk

### Basic Usage

```tsx
import { MobilePortfolioDashboard } from '@/components/mobile'

function PortfolioPage() {
  const portfolioId = "your-portfolio-id"
  
  return (
    <MobilePortfolioDashboard 
      portfolioId={portfolioId}
      initialView="overview"
      showNavigation={true}
      showTopBar={true}
    />
  )
}
```

### Advanced Configuration

```tsx
import { MobilePortfolioDashboard } from '@/components/mobile'
import { Suspense } from 'react'

function CustomPortfolioPage() {
  return (
    <Suspense fallback={<LoadingPortfolioState type="initial" />}>
      <MobilePortfolioDashboard 
        portfolioId="portfolio-123"
        initialView="holdings"
        showNavigation={true}
        showTopBar={true}
        className="custom-mobile-dashboard"
      />
    </Suspense>
  )
}
```

### Embedded Dashboard

```tsx
// For bruk inni en større layout
<div className="container">
  <MobilePortfolioDashboard 
    portfolioId={portfolioId}
    showNavigation={false}
    showTopBar={false}
    className="bg-white rounded-lg shadow-lg"
  />
</div>
```

## Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `portfolioId` | `string` | - | **Required.** Unik ID for porteføljen |
| `initialView` | `'overview' \| 'holdings' \| 'charts'` | `'overview'` | Første visning som vises |
| `showNavigation` | `boolean` | `true` | Vis bunnavigasjon |
| `showTopBar` | `boolean` | `true` | Vis toppbar med tilbakeknapp |
| `className` | `string` | - | Tilpassede CSS-klasser |

## Komponentarkitektur

### Core Components
- **CollapsibleSection**: Sammenleggbare innholdsseksjoner
- **PullToRefresh**: Dra-til-oppdater wrapper
- **MobileMetricCards**: Porteføljemålinger kort
- **MobileChart**: Interaktivt ytelseskart
- **MobileHoldingsList**: Beholdningsliste med swipe-handlinger

### State Management
```tsx
const {
  portfolio,           // Porteføljedata
  loading,             // Loading tilstand
  error,               // Feilmeldinger
  refresh,             // Oppdateringsfunksjon
  holdings,            // Beholdninger
  metrics,             // Beregnede målinger
  realtimePrices,      // Live prisdata
  isPricesConnected    // Tilkoblingsstatus
} = usePortfolioState(portfolioId)
```

### Real-time Updates
```tsx
const { 
  isConnected,         // WebSocket tilkoblingsstatus
  priceUpdates,        // Live prisoppdateringer
  portfolioUpdates     // Porteføljeendringer
} = useRealtimeUpdates(portfolioId)
```

## Responsive Behavior

### Mobile First (320px+)
- Single column layout
- Touch-optimized controls
- Swipe gestures enabled
- Collapsible sections

### Tablet (768px+)
- Enhanced spacing
- Larger touch targets
- Side-by-side metrics
- Expanded chart view

### Desktop (1024px+)
- Full responsive layout
- Hover states enabled
- Mouse interactions
- Enhanced animations

## Performance Optimizations

### Lazy Loading
- Components load on demand
- Progressive image loading
- Virtualized large lists

### Caching Strategy
- Intelligent data caching
- Optimistic UI updates
- Background refresh

### Network Efficiency
- Debounced API calls
- Smart retry logic
- Offline support

## Accessibility Features

### WCAG Compliance
- Proper ARIA labels
- Keyboard navigation
- Screen reader support
- Color contrast compliance

### Touch Accessibility
- 44px minimum touch targets
- Haptic feedback
- Gesture alternatives
- Voice control support

## Customization

### Theming
```css
/* Tilpass farger */
.mobile-portfolio-dashboard {
  --primary-color: #3B82F6;
  --success-color: #22C55E;
  --danger-color: #EF4444;
  --warning-color: #F59E0B;
}
```

### Custom Sections
```tsx
// Legg til egne seksjoner
<CollapsibleSection
  title="Egendefinert Seksjon"
  icon={<CustomIcon />}
  defaultExpanded={false}
>
  <CustomContent />
</CollapsibleSection>
```

## Error Handling

### Loading States
- **Initial Load**: Full-screen loading med progress
- **Data Refresh**: Inline loading indikator
- **Price Updates**: Subtle pulse animation

### Error States
- **Network Error**: Retry med exponential backoff
- **Data Error**: Graceful degradation
- **Authorization Error**: Redirect til login

### Offline Support
- Cached data fallback
- Offline indicators
- Sync when reconnected

## Testing

### Unit Tests
```bash
npm test -- components/mobile/mobile-portfolio-dashboard
```

### Integration Tests
```bash
npm run test:e2e -- mobile-portfolio
```

### Performance Tests
```bash
npm run test:lighthouse -- mobile
```

## Migration Guide

### Fra Desktop til Mobile
1. Bytt ut `PortfolioDashboard` med `MobilePortfolioDashboard`
2. Oppdater routing for mobile paths
3. Tilpass touch events og gestures
4. Test på forskjellige skjermstørrelser

### Breaking Changes
- Props API endringer i v2.0
- State management refactoring
- CSS klasse navneendringer

## Browser Support

| Browser | Version | Status |
|---------|---------|---------|
| Safari Mobile | 12+ | ✅ Full support |
| Chrome Mobile | 80+ | ✅ Full support |
| Firefox Mobile | 85+ | ✅ Full support |
| Samsung Internet | 10+ | ✅ Full support |
| Safari Desktop | 14+ | ✅ Fallback support |
| Chrome Desktop | 90+ | ✅ Fallback support |

## FAQ

### Q: Kan jeg bruke denne komponenten på desktop?
A: Ja, komponenten er responsiv og fungerer på desktop, men er optimalisert for mobile.

### Q: Hvordan aktiverer jeg offline support?
A: Offline support er aktivert som standard gjennom service worker og data caching.

### Q: Kan jeg tilpasse animasjonene?
A: Ja, gjennom CSS custom properties og Framer Motion konfigurasjoner.

### Q: Støtter komponenten dark mode?
A: Ikke ennå, men det er planlagt for fremtidige versjoner.

## Contributing

Se [CONTRIBUTING.md](../../CONTRIBUTING.md) for retningslinjer om bidrag til komponenten.

## License

MIT License - se [LICENSE](../../LICENSE) for detaljer.