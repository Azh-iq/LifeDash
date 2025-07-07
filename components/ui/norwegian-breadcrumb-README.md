# Norwegian Breadcrumb Component

En komplett norsk brødsmule-navigasjonskomponent bygget på shadcn/ui breadcrumb med full funksjonalitet og responsivt design.

## Funksjoner

- ✅ **Automatisk rute-oppdaging** - Genererer brødsmule basert på URL-sti
- ✅ **Norske etiketter** - Alle standard ruter har norske navn
- ✅ **Lilla temaintegrasjon** - Følger LifeDash sin purple (#6366f1) fargeprofil
- ✅ **Responsive design** - Tilpasser seg desktop og mobile enheter
- ✅ **Animasjoner** - Smooth hover-effekter og overganger
- ✅ **Ikoner** - Lucide React ikoner for hver rute
- ✅ **Tilpassbare ruter** - Støtte for egendefinerte ruter og etiketter
- ✅ **Kollapsbar mobil versjon** - Intelligent kollapsing for lange stier
- ✅ **Klikk-behandlere** - Tilpassede navigasjonshandlere
- ✅ **Tilgjengelighet** - Proper ARIA labels og keyboard navigation

## Installasjon

Komponenten er allerede integrert i LifeDash-prosjektet. Ingen ytterligere installasjon kreves.

## Grunnleggende bruk

```tsx
import { NorwegianBreadcrumb } from '@/components/ui/norwegian-breadcrumb'

function MyPage() {
  return (
    <div>
      <NorwegianBreadcrumb />
    </div>
  )
}
```

## Avansert bruk

### Med tilpassede ruter

```tsx
import { NorwegianBreadcrumb } from '@/components/ui/norwegian-breadcrumb'
import { User, Settings } from 'lucide-react'

const customRoutes = {
  'min-side': { label: 'Min Side', icon: User },
  'innstillinger': { label: 'Innstillinger', icon: Settings }
}

function MyPage() {
  return (
    <NorwegianBreadcrumb
      customRoutes={customRoutes}
      onBreadcrumbClick={(href, segment) => {
        console.log('Navigering til:', href)
        // Tilpasset navigasjonslogikk
        router.push(href)
      }}
    />
  )
}
```

### Alle konfigurasjonsalternativer

```tsx
<NorwegianBreadcrumb
  className="my-breadcrumb"
  maxItems={5}                    // Maks antall elementer på desktop
  showIcons={true}                // Vis ikoner
  showHomeIcon={true}             // Vis hjemmeikon
  enableHoverEffects={true}       // Aktiver hover-animasjoner
  customRoutes={customRoutes}     // Tilpassede ruter
  onBreadcrumbClick={handleClick} // Klikk-behandler
/>
```

## Standard norske ruter

Komponenten kommer med innebygde norske etiketter for standard LifeDash-ruter:

| Rute | Norsk etikett | Ikon |
|------|---------------|------|
| `/dashboard` | Dashboard | Home |
| `/investments` | Investeringer | TrendingUp |
| `/stocks` | Aksjer | TrendingUp |
| `/portfolio` | Portefølje | PieChart |
| `/economy` | Økonomi | DollarSign |
| `/tools` | Verktøy | Tool |
| `/hobby` | Hobby prosjekter | Heart |
| `/settings` | Innstillinger | Settings |
| `/setup` | Oppsett | Settings |
| `/transactions` | Transaksjoner | DollarSign |
| `/performance` | Ytelse | TrendingUp |
| `/holdings` | Beholdninger | PieChart |

## Responsivt design

### Desktop (≥768px)
- Full brødsmule-sti med ikoner
- Hover-animasjoner
- Ellipsis (...) for lange stier
- Smooth overganger

### Mobile (<768px)
- Kompakt visning
- Kollapsbar for lange stier
- Touch-vennlige knapper
- Optimalisert for små skjermer

## Styling og tema

Komponenten følger LifeDash sin purple-fargeprofil:
- **Primær farge**: #6366f1 (purple-600)
- **Hover-farge**: purple-600
- **Aktiv side**: purple-600
- **Separatorer**: purple-300
- **Bakgrunn**: white/gray-50

## API Referanse

### Props

| Prop | Type | Default | Beskrivelse |
|------|------|---------|-------------|
| `className` | string | - | Tilpasset CSS-klasse |
| `maxItems` | number | 5 | Maks antall elementer på desktop |
| `showIcons` | boolean | true | Vis ikoner |
| `showHomeIcon` | boolean | true | Vis hjemmeikon |
| `enableHoverEffects` | boolean | true | Aktiver hover-animasjoner |
| `customRoutes` | object | - | Tilpassede ruter og etiketter |
| `onBreadcrumbClick` | function | - | Klikk-behandler |

### BreadcrumbSegment Interface

```typescript
interface BreadcrumbSegment {
  label: string
  href: string
  icon?: React.ElementType
  isActive?: boolean
}
```

### Custom Routes Type

```typescript
Record<string, { 
  label: string
  icon?: React.ElementType 
}>
```

## Utility funktioner

### generateBreadcrumbSegments

Generer brødsmule-segmenter manuelt:

```tsx
import { generateBreadcrumbSegments } from '@/components/ui/norwegian-breadcrumb'

const segments = generateBreadcrumbSegments('/investments/stocks', customRoutes)
```

### useBreadcrumbSegments Hook

React hook for å bruke brødsmule-segmenter:

```tsx
import { useBreadcrumbSegments } from '@/components/ui/norwegian-breadcrumb'

function MyComponent() {
  const segments = useBreadcrumbSegments('/investments/stocks', customRoutes)
  return <div>{segments.length} nivåer</div>
}
```

## Eksempler

Se `norwegian-breadcrumb-demo.tsx` for fullstendige eksempler på alle funksjoner.

## Tilgjengelighet

Komponenten følger WCAG 2.1 retningslinjer:
- Proper ARIA labels (`aria-label="breadcrumb"`)
- Keyboard navigation support
- Screen reader-vennlige etiketter
- Focus management med ring-indikatorer
- Semantic HTML structure

## Ytelse

- **Memoization**: Alle komponenter bruker React.memo for optimal ytelse
- **Lazy rendering**: Ikke-synlige elementer rendres ikke
- **Minimal re-renders**: Intelligent dependency management
- **Smooth animasjoner**: Hardware-akselererte CSS-overganger

## Integrasjon i LifeDash

For å integrere i eksisterende LifeDash-sider:

1. Importer komponenten
2. Legg til i din layout eller side
3. Konfigurer eventuelle tilpassede ruter
4. Test på både desktop og mobile

```tsx
// I din layout.tsx eller page.tsx
import { NorwegianBreadcrumb } from '@/components/ui/norwegian-breadcrumb'

export default function Layout({ children }) {
  return (
    <div>
      <header>
        <NorwegianBreadcrumb />
      </header>
      <main>{children}</main>
    </div>
  )
}
```

## Fremtidige utvidelser

- [ ] Støtte for brødsmule-metadata
- [ ] Integrasjon med Next.js App Router metadata
- [ ] Tilpassbare separatorer
- [ ] Støtte for breadcrumb-strukturdata (SEO)
- [ ] Drag-and-drop reordering
- [ ] Breadcrumb-historie