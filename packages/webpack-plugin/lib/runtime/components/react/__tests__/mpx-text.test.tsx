import React from 'react'
import { render } from '../../../../test/utils/test-utils'
import Text from '../mpx-text'

// Mock dependencies
jest.mock('../utils', () => ({
  splitProps: jest.fn((props) => ({ textProps: props, innerProps: {} })),
  splitStyle: jest.fn((style) => ({ textStyle: style, backgroundStyle: {}, innerStyle: {} })),
  useTransformStyle: jest.fn((style) => ({
    normalStyle: style,
    hasSelfPercent: false,
    hasPositionFixed: false,
    hasVarDec: false,
    varContextRef: { current: {} },
    setWidth: jest.fn(),
    setHeight: jest.fn()
  })),
  wrapChildren: jest.fn((props, config) => props.children),
  useLayout: jest.fn(() => ({
    layoutRef: { current: null },
    layoutStyle: {},
    layoutProps: {}
  })),
  extendObject: jest.fn((...args) => Object.assign({}, ...args))
}))

jest.mock('../getInnerListeners', () => ({
  __esModule: true,
  default: jest.fn((props) => props)
}))

jest.mock('../useNodesRef', () => ({
  __esModule: true,
  default: jest.fn()
}))

describe('Text Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders text content', () => {
    const { getByText } = render(
      <Text>Hello World</Text>
    )
    
    expect(getByText('Hello World')).toBeTruthy()
  })

  it('applies custom text styles', () => {
    const textStyle = { 
      color: 'red', 
      fontSize: 18,
      fontWeight: 'bold'
    }
    
    const { getByText } = render(
      <Text style={textStyle}>
        Styled Text
      </Text>
    )
    
    expect(getByText('Styled Text')).toBeTruthy()
  })

  it('handles selectable text', () => {
    const { getByText } = render(
      <Text selectable>
        Selectable Text
      </Text>
    )
    
    expect(getByText('Selectable Text')).toBeTruthy()
  })

  it('handles text with number of lines', () => {
    const { getByText } = render(
      <Text numberOfLines={2}>
        This is a very long text that should be truncated after two lines when the numberOfLines prop is set to 2
      </Text>
    )
    
    expect(getByText(/This is a very long text/)).toBeTruthy()
  })

  it('renders nested text elements', () => {
    const { getByText } = render(
      <Text>
        Parent text
        <Text style={{ fontWeight: 'bold' }}>
          Bold nested text
        </Text>
      </Text>
    )
    
    expect(getByText('Parent text')).toBeTruthy()
    expect(getByText('Bold nested text')).toBeTruthy()
  })

  it('handles enable-var prop', () => {
    const varContext = { '--text-color': 'blue' }
    const { getByText } = render(
      <Text enable-var external-var-context={varContext}>
        Variable Text
      </Text>
    )
    
    expect(getByText('Variable Text')).toBeTruthy()
  })

  it('handles parent sizing props', () => {
    const { getByText } = render(
      <Text
        parent-font-size={16}
        parent-width={320}
        parent-height={568}
      >
        Sized Text
      </Text>
    )
    
    expect(getByText('Sized Text')).toBeTruthy()
  })

  it('handles text alignment styles', () => {
    const alignmentStyle = { textAlign: 'center' }
    const { getByText } = render(
      <Text style={alignmentStyle}>
        Centered Text
      </Text>
    )
    
    expect(getByText('Centered Text')).toBeTruthy()
  })

  it('handles text decoration styles', () => {
    const decorationStyle = { 
      textDecorationLine: 'underline',
      textDecorationColor: 'red'
    }
    const { getByText } = render(
      <Text style={decorationStyle}>
        Decorated Text
      </Text>
    )
    
    expect(getByText('Decorated Text')).toBeTruthy()
  })

  it('handles line height styles', () => {
    const lineHeightStyle = { lineHeight: 24 }
    const { getByText } = render(
      <Text style={lineHeightStyle}>
        Line Height Text
      </Text>
    )
    
    expect(getByText('Line Height Text')).toBeTruthy()
  })
})
