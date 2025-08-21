import React from 'react'
import { render, screen } from '@testing-library/react-native'
import MpxText from '../../../lib/runtime/components/react/mpx-text'

// Mock mpx-portal
jest.mock('../../../lib/runtime/components/react/mpx-portal', () => {
  const mockReact = require('react')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return mockReact.forwardRef((props: any, ref: any) => {
    return mockReact.createElement('View', { ...props, ref })
  })
})

describe('MpxText', () => {
  // 基础文本渲染测试
  it('should render text with basic props', () => {
    const { toJSON } = render(
      <MpxText 
        testID="basic-text"
        style={{
          fontSize: 16,
          color: '#333',
          fontWeight: 'bold'
        }}
      >
        Hello World
      </MpxText>
    )

    const textElement = screen.getByTestId('basic-text')
    expect(textElement).toBeTruthy()
    expect(screen.getByText('Hello World')).toBeTruthy()
    expect(toJSON()).toMatchSnapshot()
  })

  it('should handle nested text components', () => {
    const { toJSON } = render(
      <MpxText testID="nested-text">
        Parent text
        <MpxText style={{ color: 'red' }}>
          Nested text
        </MpxText>
        More parent text
      </MpxText>
    )

    const textElement = screen.getByTestId('nested-text')
    expect(textElement).toBeTruthy()
    expect(toJSON()).toMatchSnapshot()
  })

  // 文本选择和缩放属性测试
  it('should handle text selection and scaling properties', () => {
    const { rerender, toJSON } = render(
      <MpxText 
        testID="selection-text"
        selectable={true}
        allowFontScaling={false}
      >
        Selectable text
      </MpxText>
    )

    let textElement = screen.getByTestId('selection-text')
    expect(textElement.props.selectable).toBe(true)
    expect(textElement.props.allowFontScaling).toBe(false)

    // 测试 selectable 为 false
    rerender(
      <MpxText 
        testID="selection-text"
        selectable={false}
      >
        Non-selectable text
      </MpxText>
    )

    textElement = screen.getByTestId('selection-text')
    expect(textElement.props.selectable).toBe(false)
    expect(toJSON()).toMatchSnapshot()
  })

  // MPX 特有功能测试
  it('should handle MPX user-select property', () => {
    const { rerender } = render(
      <MpxText 
        testID="user-select-text"
        user-select="text"
      >
        User selectable text
      </MpxText>
    )

    let textElement = screen.getByTestId('user-select-text')
    expect(textElement.props.selectable).toBe(true)

    // 测试显式设置 selectable 为 false
    rerender(
      <MpxText 
        testID="user-select-text"
        selectable={false}
      >
        Non-selectable text
      </MpxText>
    )

    textElement = screen.getByTestId('user-select-text')
    expect(textElement.props.selectable).toBe(false)
  })

  it('should handle enable-var and parent size props', () => {
    render(
      <MpxText 
        testID="var-text"
        enable-var={true}
        parent-font-size="18px"
        parent-width="300px"
        parent-height="100px"
      >
        Variable enabled text
      </MpxText>
    )

    const textElement = screen.getByTestId('var-text')
    expect(textElement).toBeTruthy()
  })

  it('should handle position fixed with Portal integration', () => {
    const { toJSON } = render(
      <MpxText 
        testID="fixed-text"
        style={{
          position: 'fixed',
          top: 10,
          left: 10,
          color: 'blue'
        }}
      >
        Fixed position text
      </MpxText>
    )

    // Portal 会包装固定定位的组件
    expect(toJSON()).toMatchSnapshot()
  })

  // 样式转换测试
  it('should handle complex style transformations', () => {
    const { toJSON } = render(
      <MpxText 
        testID="complex-style-text"
        style={{
          fontSize: '16px',
          lineHeight: '1.5',
          textAlign: 'center',
          textDecorationLine: 'underline',
          textShadowColor: 'rgba(0,0,0,0.3)',
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 2
        }}
      >
        Complex styled text
      </MpxText>
    )

    const textElement = screen.getByTestId('complex-style-text')
    expect(textElement).toBeTruthy()
    expect(toJSON()).toMatchSnapshot()
  })

  // Ref 转发测试
  it('should properly forward refs', () => {
    const ref = React.createRef()
    
    render(
      <MpxText 
        ref={ref} 
        testID="ref-text"
        selectable={true}
      >
        Ref forwarded text
      </MpxText>
    )

    expect(ref.current).toBeTruthy()
  })

  // 可访问性测试
  it('should handle accessibility props', () => {
    render(
      <MpxText
        testID="accessible-text"
        accessible={true}
        accessibilityLabel="Accessible text label"
        accessibilityHint="This is a hint"
        accessibilityRole="text"
      >
        Accessible text content
      </MpxText>
    )

    const textElement = screen.getByTestId('accessible-text')
    expect(textElement.props.accessible).toBe(true)
    expect(textElement.props.accessibilityLabel).toBe('Accessible text label')
    expect(textElement.props.accessibilityHint).toBe('This is a hint')
  })

  // 边界情况测试
  it('should handle edge cases and special values', () => {
    const { rerender } = render(
      <MpxText testID="edge-text">
        Edge case text
      </MpxText>
    )

    let textElement = screen.getByTestId('edge-text')
    expect(textElement).toBeTruthy()

    // 测试 null children
    rerender(
      <MpxText testID="edge-text">
        {null}
        Valid text
        {false}
      </MpxText>
    )

    textElement = screen.getByTestId('edge-text')
    expect(textElement).toBeTruthy()

    // 测试空字符串
    rerender(
      <MpxText testID="edge-text">
        {""}
      </MpxText>
    )

    textElement = screen.getByTestId('edge-text')
    expect(textElement).toBeTruthy()

    // 测试基础布尔属性
    rerender(
      <MpxText 
        testID="edge-text"
        selectable={true}
        allowFontScaling={false}
      >
        Boolean props text
      </MpxText>
    )

    textElement = screen.getByTestId('edge-text')
    expect(textElement.props.selectable).toBe(true)
    expect(textElement.props.allowFontScaling).toBe(false)
  })
})