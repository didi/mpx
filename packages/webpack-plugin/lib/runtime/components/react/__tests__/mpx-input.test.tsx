import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import Input from '../mpx-input'

// Mock mpx-portal
jest.mock('../mpx-portal', () => {
  const mockReact = require('react')
  return {
    __esModule: true,
    default: mockReact.forwardRef((props: any, ref: any) => {
      return mockReact.createElement('View', { ...props, ref })
    })
  }
})

describe('MpxInput', () => {
  // 基础渲染测试
  it('should render with default props', () => {
    const { toJSON } = render(<Input testID="default-input" />)
    
    const inputElement = screen.getByTestId('default-input')
    expect(inputElement).toBeTruthy()
    expect(inputElement.props.secureTextEntry).toBe(false)
    expect(inputElement.props.textAlignVertical).toBe('auto')
    expect(toJSON()).toMatchSnapshot()
  })

  it('should render with value prop', () => {
    render(<Input value="test value" testID="value-input" />)
    
    const inputElement = screen.getByTestId('value-input')
    expect(inputElement).toBeTruthy()
    expect(inputElement.props.value).toBe('test value')
  })

  it('should render with placeholder', () => {
    render(<Input placeholder="Enter text here" testID="placeholder-input" />)
    
    const inputElement = screen.getByTestId('placeholder-input')
    expect(inputElement).toBeTruthy()
    expect(inputElement.props.placeholder).toBe('Enter text here')
  })

  // 输入类型测试
  it('should handle text type', () => {
    render(<Input type="text" value="text input" testID="text-input" />)
    
    const inputElement = screen.getByTestId('text-input')
    expect(inputElement).toBeTruthy()
    expect(inputElement.props.value).toBe('text input')
  })

  it('should handle number type', () => {
    render(<Input type="number" value="123" testID="number-input" />)
    
    const inputElement = screen.getByTestId('number-input')
    expect(inputElement).toBeTruthy()
    expect(inputElement.props.value).toBe('123')
  })

  it('should handle password input', () => {
    const { toJSON } = render(<Input password value="secret" testID="password-input" />)
    
    const inputElement = screen.getByTestId('password-input')
    expect(inputElement).toBeTruthy()
    expect(inputElement.props.secureTextEntry).toBe(true)
    expect(toJSON()).toMatchSnapshot()
  })

  // 状态测试
  it('should handle disabled state', () => {
    render(<Input disabled value="disabled" testID="disabled-input" />)
    
    const inputElement = screen.getByTestId('disabled-input')
    expect(inputElement).toBeTruthy()
    expect(inputElement.props.editable).toBe(false)
  })

  it('should handle auto-focus', () => {
    render(<Input autoFocus value="auto focus" testID="autofocus-input" />)
    
    const inputElement = screen.getByTestId('autofocus-input')
    expect(inputElement).toBeTruthy()
    expect(inputElement.props.value).toBe('auto focus')
  })

  // 约束测试
  it('should handle maxlength', () => {
    render(<Input maxlength={10} value="short" testID="maxlength-input" />)
    
    const inputElement = screen.getByTestId('maxlength-input')
    expect(inputElement).toBeTruthy()
    expect(inputElement.props.maxLength).toBe(10)
  })

  // 样式测试
  it('should handle custom styles', () => {
    const style = { 
      backgroundColor: '#f5f5f5',
      color: '#333',
      fontSize: 16
    }
    
    const { toJSON } = render(<Input style={style} value="styled" testID="styled-input" />)
    
    const inputElement = screen.getByTestId('styled-input')
    expect(inputElement).toBeTruthy()
    expect(inputElement.props.style).toMatchObject({
      backgroundColor: '#f5f5f5',
      color: '#333',
      fontSize: 16,
      padding: 0
    })
    expect(toJSON()).toMatchSnapshot()
  })

  // 事件处理测试
  it('should handle input events', () => {
    const mockOnInput = jest.fn()
    
    render(<Input bindinput={mockOnInput} value="test" testID="input-events" />)
    
    const inputElement = screen.getByTestId('input-events')
    expect(inputElement).toBeTruthy()
    expect(inputElement.props.value).toBe('test')
  })

  it('should handle focus events', () => {
    const mockOnFocus = jest.fn()
    
    render(<Input bindfocus={mockOnFocus} value="test" testID="focus-events" />)
    
    const inputElement = screen.getByTestId('focus-events')
    expect(inputElement).toBeTruthy()
    
    // 模拟焦点事件
    fireEvent(inputElement, 'focus')
    expect(mockOnFocus).toHaveBeenCalled()
  })

  it('should handle blur events', () => {
    const mockOnBlur = jest.fn()
    
    render(<Input bindblur={mockOnBlur} value="test" testID="blur-events" />)
    
    const inputElement = screen.getByTestId('blur-events')
    expect(inputElement).toBeTruthy()
    
    // 模拟失焦事件
    fireEvent(inputElement, 'blur')
    expect(mockOnBlur).toHaveBeenCalled()
  })

  // 边界情况测试
  it('should handle empty value', () => {
    render(<Input value="" testID="empty-input" />)
    
    const inputElement = screen.getByTestId('empty-input')
    expect(inputElement).toBeTruthy()
    expect(inputElement.props.value).toBe('')
  })

  it('should handle numeric value', () => {
    render(<Input value={123} testID="numeric-input" />)
    
    const inputElement = screen.getByTestId('numeric-input')
    expect(inputElement).toBeTruthy()
    // 数值会被转换为字符串
    expect(inputElement.props.value).toBe('123')
  })

  // 可访问性测试
  it('should handle accessibility props', () => {
    render(
      <Input 
        testID="accessible-input"
        accessibilityLabel="Input field"
        accessibilityHint="Enter your text here"
        value="accessible"
      />
    )
    
    const inputElement = screen.getByTestId('accessible-input')
    expect(inputElement).toBeTruthy()
    expect(inputElement.props.accessibilityLabel).toBe('Input field')
    expect(inputElement.props.accessibilityHint).toBe('Enter your text here')
  })

  // 多属性组合测试
  it('should handle multiple props together', () => {
    const style = { fontSize: 18 }
    
    const { toJSON } = render(
      <Input 
        style={style}
        placeholder="Enter text"
        maxlength={50}
        disabled={false}
        testID="complex-input"
        value="complex"
      />
    )
    
    const inputElement = screen.getByTestId('complex-input')
    expect(inputElement).toBeTruthy()
    expect(inputElement.props.style).toMatchObject({ fontSize: 18 })
    expect(inputElement.props.placeholder).toBe('Enter text')
    expect(inputElement.props.maxLength).toBe(50)
    expect(inputElement.props.editable).toBe(true)
    expect(inputElement.props.value).toBe('complex')
    expect(toJSON()).toMatchSnapshot()
  })
})
