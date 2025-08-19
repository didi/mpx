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

// Import the component after mocks
const MpxText = require('../mpx-text.tsx').default

describe('MpxText Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // 快照测试 - 基础文本
  it('renders mpx-text with snapshot', () => {
    const TextComponent = renderer.create(
      <MpxText
        key="default"
        style={{ fontSize: 16, color: '#333' }}
        testID="test-text"
      >
        Hello MPX Text
      </MpxText>
    )
    const tree = TextComponent.toJSON()
    expect(tree).toMatchSnapshot()
  })

  // 快照测试 - 样式文本
  it('renders styled text with snapshot', () => {
    const textStyle = {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#007AFF',
      textAlign: 'center',
      lineHeight: 24,
      letterSpacing: 0.5
    }

    const TextComponent = renderer.create(
      <MpxText
        key="styled-text"
        style={textStyle}
        testID="styled-text"
      >
        样式化文本内容
      </MpxText>
    )
    const tree = TextComponent.toJSON()
    expect(tree).toMatchSnapshot()
  })

  // 快照测试 - 多行文本
  it('renders multiline text with snapshot', () => {
    const TextComponent = renderer.create(
      <MpxText
        key="multiline-text"
        style={{ fontSize: 14, lineHeight: 20 }}
        numberOfLines={3}
        ellipsizeMode="tail"
        testID="multiline-text"
      >
        这是一段很长的文本内容，用来测试多行文本的显示效果。
        这段文本会被限制在3行内显示，超出的部分会用省略号表示。
        测试文本换行和省略号的处理逻辑。
      </MpxText>
    )
    const tree = TextComponent.toJSON()
    expect(tree).toMatchSnapshot()
  })

  // 快照测试 - 嵌套文本
  it('renders nested text with snapshot', () => {
    const TextComponent = renderer.create(
      <MpxText
        key="nested-text"
        style={{ fontSize: 16 }}
        testID="nested-text"
      >
        这是父级文本，
        <MpxText style={{ fontWeight: 'bold', color: 'red' }}>
          这是嵌套的粗体红色文本
        </MpxText>
        ，回到正常文本。
      </MpxText>
    )
    const tree = TextComponent.toJSON()
    expect(tree).toMatchSnapshot()
  })

  // 快照测试 - 可选择文本
  it('renders selectable text with snapshot', () => {
    const TextComponent = renderer.create(
      <MpxText
        key="selectable-text"
        style={{ fontSize: 14, padding: 10 }}
        selectable={true}
        testID="selectable-text"
      >
        这是可选择的文本内容，用户可以选择和复制这段文字。
      </MpxText>
    )
    const tree = TextComponent.toJSON()
    expect(tree).toMatchSnapshot()
  })

  // Testing Library 测试 - 基础功能
  it('can be found by testID', () => {
    const { getByTestId } = render(
      <MpxText testID="findable-text">可查找的文本</MpxText>
    )
    expect(getByTestId('findable-text')).toBeTruthy()
  })

  // Testing Library 测试 - 文本内容
  it('displays correct text content', () => {
    const { getByText } = render(
      <MpxText>测试文本内容</MpxText>
    )
    expect(getByText('测试文本内容')).toBeTruthy()
  })

  // Testing Library 测试 - 点击事件
  it('handles press events', () => {
    const mockOnPress = jest.fn()
    const { getByTestId } = render(
      <MpxText 
        testID="pressable-text"
        onPress={mockOnPress}
      >
        可点击文本
      </MpxText>
    )

    const text = getByTestId('pressable-text')
    fireEvent.press(text)
    expect(mockOnPress).toHaveBeenCalledTimes(1)
  })

  // Testing Library 测试 - 长按事件
  it('handles long press events', () => {
    const mockOnLongPress = jest.fn()
    const { getByTestId } = render(
      <MpxText 
        testID="long-pressable-text"
        onLongPress={mockOnLongPress}
      >
        可长按文本
      </MpxText>
    )

    const text = getByTestId('long-pressable-text')
    fireEvent(text, 'longPress')
    expect(mockOnLongPress).toHaveBeenCalledTimes(1)
  })

  // Testing Library 测试 - 可访问性
  it('handles accessibility props', () => {
    const { getByTestId } = render(
      <MpxText 
        testID="accessible-text"
        accessible={true}
        accessibilityLabel="重要提示文本"
        accessibilityRole="text"
        accessibilityHint="这是一段重要的提示信息"
      >
        重要提示
      </MpxText>
    )

    const text = getByTestId('accessible-text')
    expect(text).toBeTruthy()
    expect(text.props.accessible).toBe(true)
    expect(text.props.accessibilityLabel).toBe('重要提示文本')
    expect(text.props.accessibilityRole).toBe('text')
  })

  // 边界情况测试
  it('handles empty text', () => {
    const component = renderer.create(<MpxText />)
    const tree = component.toJSON()
    expect(tree).toBeTruthy()
  })

  it('handles text with only spaces', () => {
    const component = renderer.create(<MpxText>   </MpxText>)
    const tree = component.toJSON()
    expect(tree).toBeTruthy()
  })

  it('handles very long text', () => {
    const longText = 'A'.repeat(1000)
    const component = renderer.create(
      <MpxText numberOfLines={1} ellipsizeMode="tail">
        {longText}
      </MpxText>
    )
    const tree = component.toJSON()
    expect(tree).toBeTruthy()
  })

  // 特殊字符测试
  it('handles special characters', () => {
    const specialText = '特殊字符测试: 🚀 ❤️ 👍 \n\t换行和制表符'
    const { getByText } = render(
      <MpxText>{specialText}</MpxText>
    )
    expect(getByText(specialText)).toBeTruthy()
  })

  // 数字和布尔值测试
  it('handles number and boolean children', () => {
    const { getByText } = render(
      <MpxText>
        数字: {123} 布尔值: {true.toString()}
      </MpxText>
    )
    expect(getByText('数字: 123 布尔值: true')).toBeTruthy()
  })

  // 样式更新测试
  it('updates style correctly', () => {
    const component = renderer.create(
      <MpxText style={{ color: 'red' }}>初始文本</MpxText>
    )
    
    let tree = component.toJSON()
    expect(tree).toBeTruthy()
    
    // 更新样式
    component.update(
      <MpxText style={{ color: 'blue', fontSize: 18 }}>更新文本</MpxText>
    )
    
    tree = component.toJSON()
    expect(tree).toBeTruthy()
  })

  // 文本截断测试
  it('handles text truncation', () => {
    const component = renderer.create(
      <MpxText 
        numberOfLines={2}
        ellipsizeMode="middle"
        style={{ width: 100 }}
      >
        这是一段需要截断的很长很长的文本内容
      </MpxText>
    )
    const tree = component.toJSON()
    expect(tree).toBeTruthy()
    expect(tree).toMatchSnapshot()
  })
})
