import React from 'react'
import renderer from 'react-test-renderer'
import Input from '../mpx-input'

// Mock dependencies
jest.mock('@mpxjs/utils', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  isFunction: jest.fn((fn) => typeof fn === 'function')
}))

jest.mock('../utils', () => ({
  parseUrl: jest.fn(),
  PERCENT_REGEX: /%$/,
  isIOS: false,
  useUpdateEffect: jest.fn((effect, deps) => {
    const mockReact = require('react')
    mockReact.useEffect(effect, deps)
  }),
  useTransformStyle: jest.fn((style) => ({
    normalStyle: style || {},
    hasSelfPercent: false,
    hasPositionFixed: false,
    hasVarDec: false,
    varContextRef: { current: {} },
    setWidth: jest.fn(),
    setHeight: jest.fn()
  })),
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
  getCustomEvent: jest.fn((type, evt, ref, props) => ({
    type,
    target: {
      value: evt?.nativeEvent?.text || evt?.nativeEvent?.value || ''
    },
    detail: {
      value: evt?.nativeEvent?.text || evt?.nativeEvent?.value || '',
      cursor: 0
    }
  }))
}))

jest.mock('../useNodesRef', () => ({
  __esModule: true,
  default: jest.fn()
}))

jest.mock('../context', () => {
  const mockReact = require('react')
  return {
    FormContext: mockReact.createContext(null),
    KeyboardAvoidContext: mockReact.createContext(null)
  }
})

jest.mock('../mpx-portal', () => {
  const mockReact = require('react')
  return {
    __esModule: true,
    default: mockReact.forwardRef((props: any, ref: any) => {
      return mockReact.createElement('View', { ...props, ref })
    })
  }
})

describe('MpxInput Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // 基础渲染测试
  it('should render with default props', () => {
    const component = renderer.create(<Input adjust-position={true} />)
    const tree = component.toJSON()
    expect(tree).toBeTruthy()
    expect(tree).toMatchSnapshot()
  })

  it('should render with value prop', () => {
    const component = renderer.create(
      <Input value="test value" adjust-position={true} />
    )
    const tree = component.toJSON()
    expect(tree).toBeTruthy()
    expect(tree).toMatchSnapshot()
  })

  it('should render with placeholder', () => {
    const component = renderer.create(
      <Input placeholder="Enter text here" adjust-position={true} />
    )
    const tree = component.toJSON()
    expect(tree).toBeTruthy()
    expect(tree).toMatchSnapshot()
  })

  // 输入类型测试
  it('should handle text type', () => {
    const component = renderer.create(
      <Input type="text" value="text input" adjust-position={true} />
    )
    expect(component.toJSON()).toMatchSnapshot()
  })

  it('should handle number type', () => {
    const component = renderer.create(
      <Input type="number" value="123" adjust-position={true} />
    )
    expect(component.toJSON()).toMatchSnapshot()
  })

  it('should handle password input', () => {
    const component = renderer.create(
      <Input password value="secret" adjust-position={true} />
    )
    expect(component.toJSON()).toMatchSnapshot()
  })

  // 状态测试
  it('should handle disabled state', () => {
    const component = renderer.create(
      <Input disabled value="disabled" adjust-position={true} />
    )
    expect(component.toJSON()).toMatchSnapshot()
  })

  it('should handle auto-focus', () => {
    const component = renderer.create(
      <Input auto-focus value="auto focus" adjust-position={true} />
    )
    expect(component.toJSON()).toMatchSnapshot()
  })

  // 约束测试
  it('should handle maxlength', () => {
    const component = renderer.create(
      <Input maxlength={10} value="short" adjust-position={true} />
    )
    expect(component.toJSON()).toMatchSnapshot()
  })

  // 样式测试
  it('should handle custom styles', () => {
    const style = {
      fontSize: 16,
      color: '#333',
      backgroundColor: '#f5f5f5'
    }
    const component = renderer.create(
      <Input style={style} value="styled" adjust-position={true} />
    )
    expect(component.toJSON()).toMatchSnapshot()
  })

  // 事件处理测试
  it('should handle input events', () => {
    const mockOnInput = jest.fn()
    const component = renderer.create(
      <Input bindinput={mockOnInput} value="test" adjust-position={true} />
    )
    expect(component.toJSON()).toMatchSnapshot()
  })

  it('should handle focus events', () => {
    const mockOnFocus = jest.fn()
    const component = renderer.create(
      <Input bindfocus={mockOnFocus} value="test" adjust-position={true} />
    )
    expect(component.toJSON()).toMatchSnapshot()
  })

  // 边界情况测试
  it('should handle empty value', () => {
    const component = renderer.create(
      <Input value="" adjust-position={true} />
    )
    expect(component.toJSON()).toMatchSnapshot()
  })

  it('should handle numeric value', () => {
    const component = renderer.create(
      <Input value={123} adjust-position={true} />
    )
    expect(component.toJSON()).toMatchSnapshot()
  })

  // 更新测试
  it('should update value correctly', () => {
    const component = renderer.create(
      <Input value="initial" adjust-position={true} />
    )

    let tree = component.toJSON()
    expect(tree).toMatchSnapshot('initial value')

    // 更新组件
    component.update(
      <Input value="updated" adjust-position={true} />
    )

    tree = component.toJSON()
    expect(tree).toMatchSnapshot('updated value')
  })

  it('should update disabled state', () => {
    const component = renderer.create(
      <Input value="test" disabled={false} adjust-position={true} />
    )

    let tree = component.toJSON()
    expect(tree).toMatchSnapshot('enabled state')

    // 更新到禁用状态
    component.update(
      <Input value="test" disabled={true} adjust-position={true} />
    )

    tree = component.toJSON()
    expect(tree).toMatchSnapshot('disabled state')
  })
})
