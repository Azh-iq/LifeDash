import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../ui/button'

describe('Button Component', () => {
  test('renders button with default props', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-primary-600') // default primary variant
  })

  test('renders different variants correctly', () => {
    const { rerender } = render(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-neutral-100')

    rerender(<Button variant="destructive">Destructive</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-red-600')

    rerender(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole('button')).toHaveClass('text-neutral-700')

    rerender(<Button variant="link">Link</Button>)
    expect(screen.getByRole('button')).toHaveClass('text-primary-600')

    rerender(<Button variant="outline">Outline</Button>)
    expect(screen.getByRole('button')).toHaveClass('border-neutral-200')
  })

  test('renders different sizes correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-8')

    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-12')

    rerender(<Button size="icon">Icon</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-10', 'w-10')
  })

  test('handles loading state correctly', () => {
    render(
      <Button loading loadingText="Loading...">
        Submit
      </Button>
    )
    const button = screen.getByRole('button')

    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.getByText('Submit')).toHaveClass('sr-only')

    // Check for loading spinner
    expect(button.querySelector('svg')).toHaveClass('animate-spin')
  })

  test('handles disabled state correctly', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole('button')

    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).toHaveClass('disabled:opacity-50')
  })

  test('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  test('prevents click when loading', () => {
    const handleClick = jest.fn()
    render(
      <Button loading onClick={handleClick}>
        Loading
      </Button>
    )

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  test('prevents click when disabled', () => {
    const handleClick = jest.fn()
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    )

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  test('renders with left and right icons', () => {
    const leftIcon = <span data-testid="left-icon">←</span>
    const rightIcon = <span data-testid="right-icon">→</span>

    render(
      <Button leftIcon={leftIcon} rightIcon={rightIcon}>
        With Icons
      </Button>
    )

    expect(screen.getByTestId('left-icon')).toBeInTheDocument()
    expect(screen.getByTestId('right-icon')).toBeInTheDocument()
    expect(screen.getByText('With Icons')).toBeInTheDocument()
  })

  test('hides icons when loading', () => {
    const leftIcon = <span data-testid="left-icon">←</span>
    const rightIcon = <span data-testid="right-icon">→</span>

    render(
      <Button loading leftIcon={leftIcon} rightIcon={rightIcon}>
        Loading
      </Button>
    )

    expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument()
    expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument()
  })

  test('renders as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )

    const link = screen.getByRole('link')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
    expect(link).toHaveClass('bg-primary-600') // Should inherit button styles
  })

  test('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    const button = screen.getByRole('button')

    expect(button).toHaveClass('custom-class')
    expect(button).toHaveClass('bg-primary-600') // Should also have default classes
  })

  test('forwards ref correctly', () => {
    const ref = jest.fn()
    render(<Button ref={ref}>Ref Test</Button>)

    expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement))
  })

  test('has correct accessibility attributes', () => {
    render(<Button>Accessible Button</Button>)
    const button = screen.getByRole('button')

    expect(button).toHaveAttribute('aria-disabled', 'false')
    expect(button).toHaveAttribute('aria-busy', 'false')
  })
})
