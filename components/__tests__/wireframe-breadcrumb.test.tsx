import { render, screen } from '@testing-library/react'
import { WireframeBreadcrumb, generateBreadcrumbItems } from '../ui/wireframe-breadcrumb'

// Mock Next.js usePathname
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/dashboard/investments/stocks'),
}))

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function Link({ href, children, ...props }: any) {
    return <a href={href} {...props}>{children}</a>
  }
})

describe('WireframeBreadcrumb', () => {
  test('renders auto-generated breadcrumb from pathname', () => {
    render(<WireframeBreadcrumb />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Investeringer')).toBeInTheDocument()
    expect(screen.getByText('Aksjer')).toBeInTheDocument()
    expect(screen.getByText('›')).toBeInTheDocument()
  })

  test('renders custom breadcrumb items', () => {
    const customItems = [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Custom Page', href: '/custom', isActive: true },
    ]

    render(<WireframeBreadcrumb items={customItems} />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Custom Page')).toBeInTheDocument()
  })

  test('applies correct styling classes', () => {
    render(<WireframeBreadcrumb />)
    
    const breadcrumbContainer = screen.getByRole('navigation').parentElement
    expect(breadcrumbContainer).toHaveClass('bg-white')
    expect(breadcrumbContainer).toHaveClass('px-6')
    expect(breadcrumbContainer).toHaveClass('py-3')
    expect(breadcrumbContainer).toHaveClass('border-b')
    expect(breadcrumbContainer).toHaveClass('border-gray-200')
    expect(breadcrumbContainer).toHaveClass('text-sm')
    expect(breadcrumbContainer).toHaveClass('text-gray-500')
  })

  test('marks active item correctly', () => {
    const customItems = [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Active Page', href: '/active', isActive: true },
    ]

    render(<WireframeBreadcrumb items={customItems} />)
    
    const activeItem = screen.getByText('Active Page')
    expect(activeItem).toHaveClass('text-indigo-600')
    expect(activeItem).toHaveClass('font-semibold')
    expect(activeItem).toHaveAttribute('aria-current', 'page')
  })

  test('handles click events', () => {
    const handleClick = jest.fn()
    const customItems = [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Clickable', href: '/clickable' },
    ]

    render(<WireframeBreadcrumb items={customItems} onItemClick={handleClick} />)
    
    const clickableItem = screen.getByText('Clickable')
    clickableItem.click()
    
    expect(handleClick).toHaveBeenCalledWith({
      label: 'Clickable',
      href: '/clickable',
    })
  })
})

describe('generateBreadcrumbItems', () => {
  test('generates correct breadcrumb items for stock page', () => {
    const pathname = '/dashboard/investments/stocks'
    const items = generateBreadcrumbItems(pathname, {})
    
    expect(items).toEqual([
      { label: 'Dashboard', href: '/dashboard', isActive: false },
      { label: 'Investeringer', href: '/investments', isActive: false },
      { label: 'Aksjer', href: '/stocks', isActive: true },
    ])
  })

  test('uses custom route mappings', () => {
    const pathname = '/dashboard/investments'
    const customRouteMap = {
      investments: 'Mine Investeringer',
    }
    
    const items = generateBreadcrumbItems(pathname, customRouteMap)
    
    expect(items).toEqual([
      { label: 'Dashboard', href: '/dashboard', isActive: false },
      { label: 'Mine Investeringer', href: '/investments', isActive: true },
    ])
  })

  test('handles dashboard-only path', () => {
    const pathname = '/dashboard'
    const items = generateBreadcrumbItems(pathname, {})
    
    expect(items).toEqual([
      { label: 'Dashboard', href: '/dashboard', isActive: true },
    ])
  })
})