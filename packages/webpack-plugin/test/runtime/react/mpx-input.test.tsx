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
  // 综合基础功能测试
  it('should handle basic props, input types and constraints', () => {
    const { rerender, toJSON } = render(
      <MpxInput 
        value="test value"
        placeholder="Enter text"
        testID="basic-input" 
      />
    )

    // 基础属性测试
    let inputElement = screen.getByTestId('basic-input')
    expect(inputElement).toBeTruthy()
    expect(inputElement.props.value).toBe('test value')
    expect(inputElement.props.placeholder).toBe('Enter text')

    // 测试不同输入类型
    rerender(<MpxInput type="number" testID="basic-input" />)
    inputElement = screen.getByTestId('basic-input')
    expect(inputElement.props.keyboardType).toBe('numeric')

    rerender(<MpxInput type="text" testID="basic-input" />)
    inputElement = screen.getByTestId('basic-input')
    expect(inputElement.props.keyboardType).toBe('default')

    // 测试密码功能
    rerender(
      <MpxInput 
        password={true}
        value="secret"
        testID="basic-input" 
      />
    )
    inputElement = screen.getByTestId('basic-input')
    expect(inputElement.props.secureTextEntry).toBe(true)

    // 测试约束条件
    rerender(
      <MpxInput 
        disabled={true}
        maxlength={10}
        value="test"
        testID="basic-input" 
      />
    )
    inputElement = screen.getByTestId('basic-input')
    expect(inputElement.props.editable).toBe(false)
    expect(inputElement.props.maxLength).toBe(10)
    expect(toJSON()).toMatchSnapshot()
  })

  // MPX 选择属性测试
  it('should handle MPX selection properties', () => {
    const { toJSON } = render(
      <MpxInput 
        selection-start={0}
        selection-end={5}
        testID="selection-input"
      />
    )

    const inputElement = screen.getByTestId('selection-input')
    expect(inputElement.props.selection).toEqual({ start: 0, end: 5 })
    expect(toJSON()).toMatchSnapshot()
  })

  // 综合事件处理测试
  it('should handle various input events', () => {
    const mockOnInput = jest.fn()
    const mockOnFocus = jest.fn()
    const mockOnBlur = jest.fn()
    const mockOnConfirm = jest.fn()
    const mockOnSelectionChange = jest.fn()

    render(
      <MpxInput 
        bindinput={mockOnInput}
        bindfocus={mockOnFocus}
        bindblur={mockOnBlur}
        bindconfirm={mockOnConfirm}
        bindselectionchange={mockOnSelectionChange}
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
    
    // 测试确认事件
    fireEvent(inputElement, 'submitEditing')
    expect(mockOnConfirm).toHaveBeenCalled()
    
    // 测试选择变化事件
    fireEvent(inputElement, 'selectionChange', {
      nativeEvent: { selection: { start: 0, end: 3 } }
    })
    expect(mockOnSelectionChange).toHaveBeenCalled()
    
    // 测试失焦事件
    fireEvent(inputElement, 'blur')
    expect(mockOnBlur).toHaveBeenCalled()
  })

  // 用户交互测试
  it('should handle realistic user typing workflow', async () => {
    const mockOnInput = jest.fn()
    const mockOnConfirm = jest.fn()
    const user = userEvent.setup()
    
    render(
      <MpxInput 
        bindinput={mockOnInput}
        bindconfirm={mockOnConfirm}
        placeholder="Type here"
        maxlength={20}
        testID="typing-input"
        value=""
      />
    )
    
    const input = screen.getByTestId('typing-input')
    
    // 完整用户交互流程：获取焦点 -> 输入 -> 确认
    fireEvent(input, 'focus')
    await user.type(input, 'Hello World')
    fireEvent(input, 'submitEditing')
    
    expect(mockOnInput).toHaveBeenCalled()
    expect(mockOnConfirm).toHaveBeenCalled()
    expect(input.props.value).toBe('Hello World')
  })
})