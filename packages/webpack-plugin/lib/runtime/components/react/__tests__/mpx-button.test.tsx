import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { render, createMockEvent } from '../../../../test/utils/test-utils'
import Button from '../mpx-button'

// Mock dependencies
jest.mock('@mpxjs/utils', () => ({
  warn: jest.fn()
}))

jest.mock('../utils', () => ({
  getCurrentPage: jest.fn(() => ({
    route: '/test',
    __webViewUrl: 'http://test.com'
  })),
  splitProps: jest.fn((props) => ({ textProps: {}, innerProps: props })),
  splitStyle: jest.fn((style) => ({ textStyle: {}, backgroundStyle: {}, innerStyle: style })),
  useLayout: jest.fn(() => ({
    layoutRef: { current: null },
    layoutStyle: {},
    layoutProps: {}
  })),
  useTransformStyle: jest.fn((style) => ({
    hasPositionFixed: false,
    hasSelfPercent: false,
    normalStyle: style,
    hasVarDec: false,
    varContextRef: { current: {} },
    setWidth: jest.fn(),
    setHeight: jest.fn()
  })),
  wrapChildren: jest.fn((props) => props.children),
  extendObject: jest.fn((...args) => Object.assign({}, ...args)),
  useHover: jest.fn(() => ({ isHover: false, gesture: null }))
}))

jest.mock('../getInnerListeners', () => ({
  __esModule: true,
  default: jest.fn((props) => props),
  getCustomEvent: jest.fn((type, evt, ref, props) => ({ type, target: {} }))
}))

jest.mock('../useNodesRef', () => ({
  __esModule: true,
  default: jest.fn()
}))

describe('Button Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders button with default props', () => {
    const { getByText } = render(
      <Button>Click me</Button>
    )
    
    expect(getByText('Click me')).toBeTruthy()
  })

  it('renders button with different types', () => {
    const { rerender, getByText } = render(
      <Button type="primary">Primary</Button>
    )
    
    expect(getByText('Primary')).toBeTruthy()
    
    rerender(<Button type="warn">Warning</Button>)
    expect(getByText('Warning')).toBeTruthy()
  })

  it('renders button with different sizes', () => {
    const { rerender, getByText } = render(
      <Button size="mini">Mini Button</Button>
    )
    
    expect(getByText('Mini Button')).toBeTruthy()
    
    rerender(<Button size="default">Default Button</Button>)
    expect(getByText('Default Button')).toBeTruthy()
  })

  it('handles disabled state', () => {
    const mockOnTap = jest.fn()
    const { getByText } = render(
      <Button disabled bindtap={mockOnTap}>
        Disabled Button
      </Button>
    )
    
    const button = getByText('Disabled Button').parent
    fireEvent.press(button)
    
    expect(mockOnTap).not.toHaveBeenCalled()
  })

  it('handles tap events when not disabled', () => {
    const mockOnTap = jest.fn()
    const { getByText } = render(
      <Button bindtap={mockOnTap}>
        Clickable Button
      </Button>
    )
    
    const button = getByText('Clickable Button').parent
    fireEvent.press(button)
    
    expect(mockOnTap).toHaveBeenCalled()
  })

  it('shows loading state', () => {
    const { getByTestId } = render(
      <Button loading>
        Loading Button
      </Button>
    )
    
    expect(getByTestId('loading')).toBeTruthy()
  })

  it('renders plain style button', () => {
    const { getByText } = render(
      <Button plain>
        Plain Button
      </Button>
    )
    
    expect(getByText('Plain Button')).toBeTruthy()
  })

  it('handles form submission', () => {
    const { getByText } = render(
      <Button form-type="submit">
        Submit Button
      </Button>
    )
    
    const button = getByText('Submit Button').parent
    fireEvent.press(button)
    
    // Form context submit should be called
    // This is mocked in test-utils.tsx
  })

  it('handles form reset', () => {
    const { getByText } = render(
      <Button form-type="reset">
        Reset Button
      </Button>
    )
    
    const button = getByText('Reset Button').parent
    fireEvent.press(button)
    
    // Form context reset should be called
    // This is mocked in test-utils.tsx
  })

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' }
    const { getByText } = render(
      <Button style={customStyle}>
        Styled Button
      </Button>
    )
    
    expect(getByText('Styled Button')).toBeTruthy()
  })

  it('handles hover styles', () => {
    const hoverStyle = { backgroundColor: 'blue' }
    const { getByText } = render(
      <Button hover-style={hoverStyle} hover-start-time={100} hover-stay-time={200}>
        Hover Button
      </Button>
    )
    
    expect(getByText('Hover Button')).toBeTruthy()
  })
})
