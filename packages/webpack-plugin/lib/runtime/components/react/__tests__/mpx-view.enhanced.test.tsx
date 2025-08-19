import React from 'react'
import renderer from 'react-test-renderer'
import { render, fireEvent } from '@testing-library/react-native'

// Mock dependencies
jest.mock('@mpxjs/utils', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  isFunction: jest.fn((fn) => typeof fn === 'function')
}))

jest.mock('../utils', () => ({
  parseUrl: jest.fn(() => 'parsed-url'),
  PERCENT_REGEX: /\d+%/,
  splitStyle: jest.fn((style) => ({ style: style || {}, transformStyle: {} })),
  splitProps: jest.fn((props) => ({ props: props || {}, transformProps: {} })),
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
    onLayout: jest.fn(),
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

// Import the component after mocks
const MpxView = require('../mpx-view.tsx').default

describe('MpxView Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // 快照测试 - 基础渲染
  it('renders mpx-view with snapshot', () => {
    const ViewComponent = renderer.create(
      <MpxView
        key="default"
        style={{ width: 200, height: 100 }}
        testID="test-view"
      >
        <MpxView>Child View</MpxView>
      </MpxView>
    )
    const tree = ViewComponent.toJSON()
    expect(tree).toMatchSnapshot()
  })

  // 快照测试 - 带样式的容器
  it('renders styled container with snapshot', () => {
    const containerStyle = {
      backgroundColor: '#f0f0f0',
      padding: 16,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    }

    const ViewComponent = renderer.create(
      <MpxView
        key="styled-container"
        style={containerStyle}
        testID="styled-container"
      >
        <MpxView style={{ flex: 1 }}>Content Area</MpxView>
      </MpxView>
    )
    const tree = ViewComponent.toJSON()
    expect(tree).toMatchSnapshot()
  })

  // 快照测试 - 复杂布局
  it('renders complex layout with snapshot', () => {
    const ViewComponent = renderer.create(
      <MpxView
        key="complex-layout"
        style={{ flex: 1, flexDirection: 'column' }}
        testID="complex-layout"
      >
        <MpxView style={{ height: 60, backgroundColor: '#007AFF' }}>
          Header
        </MpxView>
        <MpxView style={{ flex: 1, padding: 20 }}>
          <MpxView style={{ marginBottom: 16 }}>
            Content Block 1
          </MpxView>
          <MpxView style={{ marginBottom: 16 }}>
            Content Block 2
          </MpxView>
        </MpxView>
        <MpxView style={{ height: 50, backgroundColor: '#f8f8f8' }}>
          Footer
        </MpxView>
      </MpxView>
    )
    const tree = ViewComponent.toJSON()
    expect(tree).toMatchSnapshot()
  })

  // Testing Library 测试 - 基础功能
  it('can be found by testID', () => {
    const { getByTestId } = render(
      <MpxView testID="findable-view" />
    )
    expect(getByTestId('findable-view')).toBeTruthy()
  })

  // Testing Library 测试 - 点击事件
  it('handles press events', () => {
    const mockOnPress = jest.fn()
    const { getByTestId } = render(
      <MpxView 
        testID="pressable-view"
        onPress={mockOnPress}
      >
        Pressable Content
      </MpxView>
    )

    const view = getByTestId('pressable-view')
    fireEvent.press(view)
    expect(mockOnPress).toHaveBeenCalledTimes(1)
  })

  // Testing Library 测试 - 长按事件
  it('handles long press events', () => {
    const mockOnLongPress = jest.fn()
    const { getByTestId } = render(
      <MpxView 
        testID="long-pressable-view"
        onLongPress={mockOnLongPress}
      >
        Long Pressable Content
      </MpxView>
    )

    const view = getByTestId('long-pressable-view')
    fireEvent(view, 'longPress')
    expect(mockOnLongPress).toHaveBeenCalledTimes(1)
  })

  // Testing Library 测试 - 嵌套结构
  it('renders nested views correctly', () => {
    const { getByTestId } = render(
      <MpxView testID="parent-view">
        <MpxView testID="child-view-1">Child 1</MpxView>
        <MpxView testID="child-view-2">Child 2</MpxView>
      </MpxView>
    )

    expect(getByTestId('parent-view')).toBeTruthy()
    expect(getByTestId('child-view-1')).toBeTruthy()
    expect(getByTestId('child-view-2')).toBeTruthy()
  })

  // Testing Library 测试 - 可访问性
  it('handles accessibility props', () => {
    const { getByTestId } = render(
      <MpxView 
        testID="accessible-view"
        accessible={true}
        accessibilityLabel="Accessible container"
        accessibilityRole="button"
        accessibilityHint="Tap to perform action"
      >
        Accessible Content
      </MpxView>
    )

    const view = getByTestId('accessible-view')
    expect(view).toBeTruthy()
    expect(view.props.accessible).toBe(true)
    expect(view.props.accessibilityLabel).toBe('Accessible container')
    expect(view.props.accessibilityRole).toBe('button')
  })

  // 边界情况测试
  it('handles empty view', () => {
    const component = renderer.create(<MpxView />)
    const tree = component.toJSON()
    expect(tree).toBeTruthy()
  })

  it('handles view with only style', () => {
    const component = renderer.create(
      <MpxView style={{ width: 100, height: 100, backgroundColor: 'red' }} />
    )
    const tree = component.toJSON()
    expect(tree).toBeTruthy()
  })

  // 性能测试 - 大量子元素
  it('handles multiple children efficiently', () => {
    const children = Array.from({ length: 10 }, (_, index) => (
      <MpxView key={index} testID={`child-${index}`}>
        Child {index}
      </MpxView>
    ))

    const { getByTestId } = render(
      <MpxView testID="parent-with-many-children">
        {children}
      </MpxView>
    )

    expect(getByTestId('parent-with-many-children')).toBeTruthy()
    expect(getByTestId('child-0')).toBeTruthy()
    expect(getByTestId('child-9')).toBeTruthy()
  })
})
