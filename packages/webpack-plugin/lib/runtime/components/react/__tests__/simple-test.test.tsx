import React from 'react'
import { render } from '@testing-library/react-native'

// Simple test to verify the testing environment works
describe('Simple Test', () => {
  it('should render a basic component', () => {
    const TestComponent = () => <div>Hello World</div>
    
    const { getByText } = render(<TestComponent />)
    expect(getByText('Hello World')).toBeTruthy()
  })

  it('should pass basic assertions', () => {
    expect(1 + 1).toBe(2)
    expect('hello').toContain('ell')
    expect([1, 2, 3]).toHaveLength(3)
  })
})
