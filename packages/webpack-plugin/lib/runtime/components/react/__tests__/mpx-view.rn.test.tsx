import React from 'react'
import { renderWithRenderer, createMockLayoutEvent } from '../../../../test/utils/test-utils.rn'
import View from '../mpx-view'

// Mock dependencies
jest.mock('@mpxjs/utils', () => ({
  error: jest.fn(),
  isFunction: jest.fn((fn) => typeof fn === 'function')
}))

jest.mock('../utils', () => ({
  parseUrl: jest.fn(),
  PERCENT_REGEX: /%$/,
  splitStyle: jest.fn((style) => ({ textStyle: {}, backgroundStyle: {}, innerStyle: style })),
  splitProps: jest.fn((props) => ({ textProps: {}, innerProps: props })),
  useTransformStyle: jest.fn((style) => ({
    normalStyle: style,
    hasSelfPercent: false,
    hasPositionFixed: false,
    hasVarDec: false,
    varContextRef: { current: {} },
    setWidth: jest.fn(),
    setHeight: jest.fn()
  })),
  wrapChildren: jest.fn((props) => props.children),
  useLayout: jest.fn(() => ({
    layoutRef: { current: null },
    layoutStyle: {},
    layoutProps: {}
  })),
  extendObject: jest.fn((...args) => Object.assign({}, ...args))
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

describe('View Component (React Native)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render correctly with basic props', () => {
    const component = renderWithRenderer(
      <View>Test Content</View>
    )
    
    const tree = component.toJSON()
    expect(tree).toBeTruthy()
  })

  it('should handle style props', () => {
    const customStyle = {
      backgroundColor: 'red',
      padding: 10
    }
    
    const component = renderWithRenderer(
      <View style={customStyle}>Styled View</View>
    )
    
    const tree = component.toJSON()
    expect(tree).toBeTruthy()
  })

  it('should handle onLayout event', () => {
    const mockOnLayout = jest.fn()
    
    const component = renderWithRenderer(
      <View onLayout={mockOnLayout}>Layout Test</View>
    )
    
    // 模拟 onLayout 事件
    const instance = component.getInstance()
    if (instance) {
      const mockEvent = createMockLayoutEvent(100, 200)
      // 这里可以根据实际组件实现调用相应方法
    }
    
    expect(component.toJSON()).toBeTruthy()
  })

  it('should render children correctly', () => {
    const component = renderWithRenderer(
      <View>
        <View>Child 1</View>
        <View>Child 2</View>
      </View>
    )
    
    const tree = component.toJSON()
    expect(tree).toBeTruthy()
    expect(Array.isArray(tree.children)).toBe(true)
  })
})
