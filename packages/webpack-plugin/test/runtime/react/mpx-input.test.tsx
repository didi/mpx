import React from 'react'
import { render, screen, fireEvent, userEvent } from '@testing-library/react-native'
import MpxInput from '../../../lib/runtime/components/react/mpx-input'

// Mock mpx-portal
jest.mock('../../../lib/runtime/components/react/mpx-portal', () => {
  const mockReact = require('react')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return mockReact.forwardRef((props: any, ref: any) => {
    return mockReact.createElement('View', { ...props, ref })
  })
})

describe('MpxInput', () => {
  // 基础功能测试
  it('should render with basic props', () => {
    const { toJSON } = render(
      <MpxInput 
        value="test value"
        placeholder="Enter text"
        testID="basic-input" 
      />
    )

    const inputElement = screen.getByTestId('basic-input')
    expect(inputElement).toBeTruthy()
    expect(inputElement.props.value).toBe('test value')
    expect(inputElement.props.placeholder).toBe('Enter text')
    expect(toJSON()).toMatchSnapshot()
  })

  it('should handle different input types', () => {
    const { rerender } = render(<MpxInput type="text" testID="type-input" />)
    let inputElement = screen.getByTestId('type-input')
    expect(inputElement.props.keyboardType).toBe('default')

    rerender(<MpxInput type="number" testID="type-input" />)
    inputElement = screen.getByTestId('type-input')
    expect(inputElement.props.keyboardType).toBe('numeric')

    rerender(<MpxInput type="idcard" testID="type-input" />)
    inputElement = screen.getByTestId('type-input')
    expect(inputElement.props.keyboardType).toBe('default')
  })

  it('should handle password and security features', () => {
    const { toJSON } = render(
      <MpxInput 
        password={true}
        value="secret"
        testID="password-input" 
      />
    )

    const inputElement = screen.getByTestId('password-input')
    expect(inputElement.props.secureTextEntry).toBe(true)
    expect(toJSON()).toMatchSnapshot()
  })

  it('should handle disabled and maxlength constraints', () => {
    render(
      <MpxInput 
        disabled={true}
        maxlength={10}
        value="test"
        testID="constrained-input" 
      />
    )

    const inputElement = screen.getByTestId('constrained-input')
    expect(inputElement.props.editable).toBe(false)
    expect(inputElement.props.maxLength).toBe(10)
  })

  // MPX 特有功能测试
  it('should handle MPX specific props', () => {
    const { toJSON } = render(
      <MpxInput 
        cursor-spacing={5}
        confirm-type="send"
        cursor={3}
        selection-start={0}
        selection-end={5}
        testID="mpx-features-input"
      />
    )

    const inputElement = screen.getByTestId('mpx-features-input')
    expect(inputElement.props.selection).toEqual({ start: 0, end: 5 })
    expect(toJSON()).toMatchSnapshot()
  })

  it('should handle enable-var and parent size props', () => {
    render(
      <MpxInput 
        enable-var={true}
        parent-font-size="16px"
        parent-width="200px"
        parent-height="40px"
        testID="var-input"
      />
    )

    const inputElement = screen.getByTestId('var-input')
    expect(inputElement).toBeTruthy()
  })

  // 事件处理测试
  it('should handle input and focus events', () => {
    const mockOnInput = jest.fn()
    const mockOnFocus = jest.fn()
    const mockOnBlur = jest.fn()

    render(
      <MpxInput 
        bindinput={mockOnInput}
        bindfocus={mockOnFocus}
        bindblur={mockOnBlur}
        testID="event-input"
      />
    )

    const inputElement = screen.getByTestId('event-input')
    
    // 测试焦点事件
    fireEvent(inputElement, 'focus')
    expect(mockOnFocus).toHaveBeenCalled()
    
    // 测试输入事件
    fireEvent(inputElement, 'change', { nativeEvent: { text: 'new text' } })
    expect(mockOnInput).toHaveBeenCalled()
    
    // 测试失焦事件
    fireEvent(inputElement, 'blur')
    expect(mockOnBlur).toHaveBeenCalled()
  })

  it('should handle confirm and selection events', () => {
    const mockOnConfirm = jest.fn()
    const mockOnSelectionChange = jest.fn()

    render(
      <MpxInput 
        bindconfirm={mockOnConfirm}
        bindselectionchange={mockOnSelectionChange}
        testID="advanced-event-input"
      />
    )

    const inputElement = screen.getByTestId('advanced-event-input')
    
    fireEvent(inputElement, 'submitEditing')
    expect(mockOnConfirm).toHaveBeenCalled()
    
    fireEvent(inputElement, 'selectionChange', {
      nativeEvent: { selection: { start: 0, end: 3 } }
    })
    expect(mockOnSelectionChange).toHaveBeenCalled()
  })

  // 样式和布局测试
  it('should handle custom styles', () => {
    const { toJSON } = render(
      <MpxInput 
        style={{
          backgroundColor: '#f0f0f0',
          borderRadius: 5,
          padding: 10
        }}
        testID="styled-input"
      />
    )

    const inputElement = screen.getByTestId('styled-input')
    expect(inputElement).toBeTruthy()
    expect(toJSON()).toMatchSnapshot()
  })

  // 用户交互测试
  it('should handle realistic user typing workflow', async () => {
    const mockOnInput = jest.fn()
    const user = userEvent.setup()
    
    render(
      <MpxInput 
        bindinput={mockOnInput}
        placeholder="Type here"
        testID="typing-input"
        value=""
      />
    )
    
    const input = screen.getByTestId('typing-input')
    
    // 模拟用户打字
    await user.type(input, 'Hello World')
    
    expect(mockOnInput).toHaveBeenCalled()
    expect(input.props.value).toBe('Hello World')
  })

  it('should handle complete form workflow', async () => {
    const mockOnInput = jest.fn()
    const mockOnConfirm = jest.fn()
    const user = userEvent.setup()
    
    render(
      <MpxInput 
        bindinput={mockOnInput}
        bindconfirm={mockOnConfirm}
        maxlength={20}
        testID="form-input"
        value=""
      />
    )
    
    const input = screen.getByTestId('form-input')
    
    // 完整表单流程：获取焦点 -> 输入 -> 确认
    fireEvent(input, 'focus')
    await user.type(input, 'form@example.com')
    fireEvent(input, 'submitEditing')
    
    expect(mockOnInput).toHaveBeenCalled()
    expect(mockOnConfirm).toHaveBeenCalled()
    expect(input.props.value).toBe('form@example.com')
  })

  // 边界情况测试
  it('should handle edge cases and constraints', () => {
    // 测试空值和特殊值
    const { rerender } = render(<MpxInput value={undefined} testID="edge-input" />)
    let inputElement = screen.getByTestId('edge-input')
    expect(inputElement.props.value).toBe('')

    // 测试 maxlength 为 0
    rerender(<MpxInput maxlength={0} testID="edge-input" />)
    inputElement = screen.getByTestId('edge-input')
    expect(inputElement.props.maxLength).toBe(0)

    // 测试布尔值
    rerender(<MpxInput value={true} testID="edge-input" />)
    inputElement = screen.getByTestId('edge-input')
    expect(inputElement.props.value).toBe('')
  })

  // 表单集成测试
  it('should handle form integration with name prop', () => {
    render(
      <MpxInput 
        name="username"
        value="john_doe"
        testID="form-integration-input"
      />
    )
    
    const inputElement = screen.getByTestId('form-integration-input')
    expect(inputElement).toBeTruthy()
    expect(inputElement.props.value).toBe('john_doe')
  })
})