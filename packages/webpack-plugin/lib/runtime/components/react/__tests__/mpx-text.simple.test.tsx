import React from 'react'
import renderer from 'react-test-renderer'
import Text from '../mpx-text'

// Mock dependencies
jest.mock('@mpxjs/utils', () => ({
  error: jest.fn(),
  isFunction: jest.fn((fn) => typeof fn === 'function')
}))

jest.mock('../utils', () => ({
  parseUrl: jest.fn(),
  PERCENT_REGEX: /%$/,
  splitStyle: jest.fn((style) => ({ textStyle: style || {}, backgroundStyle: {}, innerStyle: {} })),
  splitProps: jest.fn((props) => ({ textProps: props, innerProps: {} })),
  useTransformStyle: jest.fn((style) => ({
    normalStyle: style || {},
    hasSelfPercent: false,
    hasPositionFixed: false,
    hasVarDec: false,
    varContextRef: { current: {} },
    setWidth: jest.fn(),
    setHeight: jest.fn()
  })),
  useHover: jest.fn(() => ({
    isHover: false,
    gesture: {}
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

describe('Text Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render text content', () => {
    const component = renderer.create(
      <Text>Hello World</Text>
    )
    
    const tree = component.toJSON()
    expect(tree).toBeTruthy()
    expect(tree).toMatchSnapshot()
  })

  it('should handle style props', () => {
    const textStyle = {
      fontSize: 16,
      color: 'red',
      fontWeight: 'bold'
    }
    
    const component = renderer.create(
      <Text style={textStyle}>Styled Text</Text>
    )
    
    const tree = component.toJSON()
    expect(tree).toBeTruthy()
    expect(tree).toMatchSnapshot()
  })

  it('should handle empty text', () => {
    const component = renderer.create(<Text />)
    
    const tree = component.toJSON()
    expect(tree).toBeTruthy()
  })

  it('should render nested text', () => {
    const component = renderer.create(
      <Text>
        Parent text
        <Text>Child text</Text>
      </Text>
    )
    
    const tree = component.toJSON()
    expect(tree).toBeTruthy()
    expect(tree).toMatchSnapshot()
  })

  it('should handle multiple props', () => {
    const component = renderer.create(
      <Text 
        style={{ color: 'blue' }}
        numberOfLines={2}
        selectable={true}
      >
        Multi-prop text
      </Text>
    )
    
    const tree = component.toJSON()
    expect(tree).toBeTruthy()
  })

  it('should update correctly', () => {
    const component = renderer.create(
      <Text>Initial Text</Text>
    )
    
    let tree = component.toJSON()
    expect(tree).toBeTruthy()
    
    // 更新组件
    component.update(
      <Text style={{ color: 'green' }}>Updated Text</Text>
    )
    
    tree = component.toJSON()
    expect(tree).toBeTruthy()
  })
})
