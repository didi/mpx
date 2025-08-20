import React from 'react'
import { render, screen } from '@testing-library/react-native'
import Text from '../../../lib/runtime/components/react/mpx-text'

// Mock mpx-portal
jest.mock('../../../lib/runtime/components/react/mpx-portal', () => {
  const mockReact = require('react')
  return {
    __esModule: true,
    default: mockReact.forwardRef((props: any, ref: any) => {
      return mockReact.createElement('View', { ...props, ref })
    })
  }
})

describe('MpxText', () => {
    it('should render text content', () => {
    const { toJSON } = render(<Text>Hello World</Text>)

    // 使用@testing-library查询方法
    expect(screen.getByText('Hello World')).toBeTruthy()
    
    // 如果需要快照测试，可以添加
    expect(toJSON()).toMatchSnapshot()
  })

  it('should render with custom styles', () => {
    const customStyle = { color: 'red', fontSize: 16 }
    
    const { toJSON } = render(<Text style={customStyle}>Styled Text</Text>)
    
    const textElement = screen.getByText('Styled Text')
    expect(textElement).toBeTruthy()
    expect(textElement.props.style).toMatchObject(customStyle)
    expect(toJSON()).toMatchSnapshot()
  })

  it('should handle selectable prop', () => {
    const { toJSON } = render(<Text selectable>Selectable Text</Text>)
    
    const textElement = screen.getByText('Selectable Text')
    expect(textElement).toBeTruthy()
    expect(textElement.props.selectable).toBe(true)
    expect(toJSON()).toMatchSnapshot()
  })

  it('should handle allowFontScaling prop', () => {
    render(<Text allowFontScaling={true}>Scalable Text</Text>)
    
    const textElement = screen.getByText('Scalable Text')
    expect(textElement).toBeTruthy()
    expect(textElement.props.allowFontScaling).toBe(true)
  })

  it('should render nested text components', () => {
    const { toJSON } = render(
      <Text testID="parent-text">
        Parent text
        <Text testID="child-text">Child text</Text>
      </Text>
    )
    
    // 使用testID来查找嵌套的Text组件，因为@testing-library对嵌套文本的处理不同
    expect(screen.getByTestId('parent-text')).toBeTruthy()
    expect(screen.getByTestId('child-text')).toBeTruthy()
    expect(screen.getByText('Child text')).toBeTruthy()
    expect(toJSON()).toMatchSnapshot()
  })

  it('should handle empty text', () => {
    render(<Text testID="empty-text"></Text>)
    
    // 空文本应该仍然渲染Text组件
    const textElement = screen.getByTestId('empty-text')
    expect(textElement).toBeTruthy()
  })

  it('should handle testID prop', () => {
    render(<Text testID="my-text">Test ID Text</Text>)
    
    expect(screen.getByTestId('my-text')).toBeTruthy()
    expect(screen.getByText('Test ID Text')).toBeTruthy()
  })

  it('should handle accessibility props', () => {
    render(
      <Text 
        accessibilityLabel="Text label"
        accessibilityHint="Text hint"
        accessibilityRole="text"
      >
        Accessible Text
      </Text>
    )
    
    const textElement = screen.getByText('Accessible Text')
    expect(textElement).toBeTruthy()
    expect(textElement.props.accessibilityLabel).toBe('Text label')
    expect(textElement.props.accessibilityHint).toBe('Text hint')
    expect(textElement.props.accessibilityRole).toBe('text')
  })

  it('should handle multiple props together', () => {
    const style = { fontWeight: 'bold' as const }
    
    const { toJSON } = render(
      <Text 
        style={style}
        selectable={true}
        allowFontScaling={false}
        testID="complex-text"
      >
        Complex Text
      </Text>
    )
    
    const textElement = screen.getByTestId('complex-text')
    expect(textElement).toBeTruthy()
    expect(textElement.props.style).toMatchObject(style)
    expect(textElement.props.selectable).toBe(true)
    expect(textElement.props.allowFontScaling).toBe(false)
    expect(toJSON()).toMatchSnapshot()
  })
})
