import { render, screen } from '@testing-library/react'
import { Button } from '../button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
  })

  it('renders with custom class', () => {
    render(<Button className="custom-class">Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toHaveClass('custom-class')
  })
})
