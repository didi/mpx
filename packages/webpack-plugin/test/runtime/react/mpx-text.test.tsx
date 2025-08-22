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
  // 综合基础功能测试
  it('should handle basic rendering, nested text and selection properties', () => {
    const { rerender, toJSON } = render(
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

    // 基础文本渲染测试
    let textElement = screen.getByTestId('basic-text')
    expect(textElement).toBeTruthy()
    expect(screen.getByText('Hello World')).toBeTruthy()

    // 测试嵌套文本组件
    rerender(
      <MpxText testID="basic-text">
        Parent text
        <MpxText style={{ color: 'red' }}>
          Nested text
        </MpxText>
        More parent text
      </MpxText>
    )

    textElement = screen.getByTestId('basic-text')
    expect(textElement).toBeTruthy()

    // 测试文本选择属性
    rerender(
      <MpxText 
        testID="basic-text"
        selectable={true}
        allowFontScaling={false}
      >
        Selectable text
      </MpxText>
    )

    textElement = screen.getByTestId('basic-text')
    expect(textElement.props.selectable).toBe(true)
    expect(textElement.props.allowFontScaling).toBe(false)

    // 测试复杂样式转换
    rerender(
      <MpxText 
        testID="basic-text"
        style={{
          fontSize: '16px',
          lineHeight: '1.5',
          textAlign: 'center',
          textDecorationLine: 'underline'
        }}
      >
        Complex styled text
      </MpxText>
    )

    textElement = screen.getByTestId('basic-text')
    expect(textElement).toBeTruthy()
    expect(toJSON()).toMatchSnapshot()
  })

  // MPX user-select 属性测试
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

    // 验证 ref 被正确转发
    expect(ref.current).toBeTruthy()
    expect(ref.current).toHaveProperty('getNodeInstance')
    expect(typeof ref.current.getNodeInstance).toBe('function')

    // 验证组件正确渲染
    const textElement = screen.getByTestId('ref-text')
    expect(textElement).toBeTruthy()
    expect(textElement.props.selectable).toBe(true)
  })
})