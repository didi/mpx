import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import Input from '../../../lib/runtime/components/react/mpx-input'

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

  // MPX 特有功能测试
  describe('MPX specific features', () => {
    it('should handle cursor-spacing prop', () => {
      render(<Input cursor-spacing={10} testID="cursor-spacing-input" />)

      const inputElement = screen.getByTestId('cursor-spacing-input')
      expect(inputElement).toBeTruthy()
      // cursor-spacing 主要用于键盘避让，这里验证组件能正确接收该属性
    })

    it('should handle confirm-type prop', () => {
      const { toJSON } = render(
        <Input
          confirm-type="search"
          testID="confirm-type-input"
          value="search me"
        />
      )

      const inputElement = screen.getByTestId('confirm-type-input')
      expect(inputElement).toBeTruthy()
      expect(inputElement.props.enterKeyHint).toBe('search')
      expect(toJSON()).toMatchSnapshot()
    })

    it('should handle confirm-hold prop', () => {
      render(
        <Input
          confirm-hold={true}
          testID="confirm-hold-input"
          value="hold confirm"
        />
      )

      const inputElement = screen.getByTestId('confirm-hold-input')
      expect(inputElement).toBeTruthy()
      expect(inputElement.props.blurOnSubmit).toBe(false)
    })

    it('should handle cursor positioning', () => {
      render(<Input cursor={5} value="cursor test" testID="cursor-input" />)

      const inputElement = screen.getByTestId('cursor-input')
      expect(inputElement).toBeTruthy()
      expect(inputElement.props.selection).toEqual({ start: 5, end: 5 })
    })

    it('should handle selection range', () => {
      render(
        <Input
          selection-start={2}
          selection-end={8}
          value="selection test"
          testID="selection-input"
        />
      )

      const inputElement = screen.getByTestId('selection-input')
      expect(inputElement).toBeTruthy()
      expect(inputElement.props.selection).toEqual({ start: 2, end: 8 })
    })

    it('should handle cursor-color prop', () => {
      render(
        <Input
          cursor-color="#ff0000"
          value="red cursor"
          testID="cursor-color-input"
        />
      )

      const inputElement = screen.getByTestId('cursor-color-input')
      expect(inputElement).toBeTruthy()
      expect(inputElement.props.selectionColor).toBe('#ff0000')
    })

    it('should handle placeholder-style prop', () => {
      render(
        <Input
          placeholder="Styled placeholder"
          placeholder-style={{ color: '#999999' }}
          testID="placeholder-style-input"
        />
      )

      const inputElement = screen.getByTestId('placeholder-style-input')
      expect(inputElement).toBeTruthy()
      expect(inputElement.props.placeholderTextColor).toBe('#999999')
    })

    it('should handle enable-var prop', () => {
      const styleWithVar = {
        color: 'var(--text-color)',
        fontSize: 16
      }

      render(
        <Input
          enable-var={true}
          style={styleWithVar}
          value="CSS Variables"
          testID="var-enabled-input"
        />
      )

      const inputElement = screen.getByTestId('var-enabled-input')
      expect(inputElement).toBeTruthy()
    })

    it('should handle parent size props', () => {
      render(
        <Input
          parent-font-size={16}
          parent-width={300}
          parent-height={50}
          testID="parent-size-input"
          value="Parent Size"
        />
      )

      const inputElement = screen.getByTestId('parent-size-input')
      expect(inputElement).toBeTruthy()
    })

    it('should handle adjust-position prop', () => {
      render(
        <Input
          adjust-position={false}
          testID="no-adjust-input"
          value="No adjustment"
        />
      )

      const inputElement = screen.getByTestId('no-adjust-input')
      expect(inputElement).toBeTruthy()
    })
  })

  // 输入类型详细测试
  describe('Input types', () => {
    it('should handle idcard type', () => {
      render(<Input type="idcard" value="123456789" testID="idcard-input" />)

      const inputElement = screen.getByTestId('idcard-input')
      expect(inputElement).toBeTruthy()
      expect(inputElement.props.keyboardType).toBe('default')
    })

    it('should handle digit type', () => {
      render(<Input type="digit" value="123.45" testID="digit-input" />)

      const inputElement = screen.getByTestId('digit-input')
      expect(inputElement).toBeTruthy()
      // digit type 在不同平台有不同的 keyboardType
      expect(['decimal-pad', 'numeric']).toContain(inputElement.props.keyboardType)
    })
  })

  // 事件处理详细测试
  describe('Event handling', () => {
    it('should handle text change events', () => {
      const mockOnInput = jest.fn()

      render(
        <Input
          bindinput={mockOnInput}
          testID="text-change-input"
          value="initial"
        />
      )

      const inputElement = screen.getByTestId('text-change-input')

      // 模拟文本输入变化事件
      fireEvent(inputElement, 'change', {
        nativeEvent: { text: 'new text' }
      })

      // 验证事件被触发
      expect(mockOnInput).toHaveBeenCalled()
    })

    it('should handle confirm events', () => {
      const mockOnConfirm = jest.fn()

      render(
        <Input
          bindconfirm={mockOnConfirm}
          testID="confirm-input"
          value="confirm me"
        />
      )

      const inputElement = screen.getByTestId('confirm-input')

      // 模拟确认事件（回车键）
      fireEvent(inputElement, 'submitEditing')

      expect(mockOnConfirm).toHaveBeenCalled()
    })

    it('should handle selection change events', () => {
      const mockOnSelectionChange = jest.fn()

      render(
        <Input
          bindselectionchange={mockOnSelectionChange}
          testID="selection-change-input"
          value="selection test"
        />
      )

      const inputElement = screen.getByTestId('selection-change-input')

      // 模拟选择变化事件
      fireEvent(inputElement, 'selectionChange', {
        nativeEvent: { selection: { start: 0, end: 5 } }
      })

      expect(mockOnSelectionChange).toHaveBeenCalled()
    })
  })

  // 边界情况和错误处理
  describe('Edge cases', () => {
    it('should handle very long text with maxlength', () => {
      const longText = 'a'.repeat(1000)

      render(
        <Input
          value={longText}
          maxlength={10}
          testID="long-text-input"
        />
      )

      const inputElement = screen.getByTestId('long-text-input')
      expect(inputElement).toBeTruthy()
      // 文本应该被截断到 maxlength
      expect(inputElement.props.value).toBe('aaaaaaaaaa')
      expect(inputElement.props.maxLength).toBe(10)
    })

    it('should handle unlimited maxlength', () => {
      render(
        <Input
          maxlength={-1}
          value="unlimited text"
          testID="unlimited-input"
        />
      )

      const inputElement = screen.getByTestId('unlimited-input')
      expect(inputElement).toBeTruthy()
      expect(inputElement.props.maxLength).toBeUndefined()
    })

    it('should handle undefined and null values', () => {
      render(<Input value={undefined} testID="undefined-input" />)

      const inputElement = screen.getByTestId('undefined-input')
      expect(inputElement).toBeTruthy()
      expect(inputElement.props.value).toBe('')
    })

    it('should handle boolean value', () => {
      render(<Input value={true as any} testID="boolean-input" />)

      const inputElement = screen.getByTestId('boolean-input')
      expect(inputElement).toBeTruthy()
      // 非字符串/数字值应该转换为空字符串
      expect(inputElement.props.value).toBe('')
    })

    it('should handle zero maxlength', () => {
      render(
        <Input
          maxlength={0}
          value="should be empty"
          testID="zero-maxlength-input"
        />
      )

      const inputElement = screen.getByTestId('zero-maxlength-input')
      expect(inputElement).toBeTruthy()
      expect(inputElement.props.value).toBe('')
      expect(inputElement.props.maxLength).toBe(0)
    })
  })

  // 样式和布局测试
  describe('Styles and layout', () => {
    it('should handle complex style combinations', () => {
      const complexStyle = {
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        color: '#333333',
        fontWeight: 'bold' as const
      }

      const { toJSON } = render(
        <Input
          style={complexStyle}
          value="styled input"
          testID="complex-style-input"
        />
      )

      const inputElement = screen.getByTestId('complex-style-input')
      expect(inputElement).toBeTruthy()
      expect(inputElement.props.style).toMatchObject({
        ...complexStyle,
        padding: 0 // Input 组件会重置 padding
      })
      expect(toJSON()).toMatchSnapshot()
    })

    it('should handle position fixed style (Portal integration)', () => {
      const fixedStyle = {
        position: 'fixed' as const,
        top: 100,
        left: 50
      }

      const { toJSON } = render(
        <Input
          style={fixedStyle}
          value="Fixed Position Input"
          testID="fixed-position-input"
        />
      )

      // Portal 会包装固定定位的组件
      expect(toJSON()).toMatchSnapshot()
    })
  })

  // 表单集成测试
  describe('Form integration', () => {
    it('should handle name prop for form integration', () => {
      render(
        <Input
          name="username"
          value="john_doe"
          testID="named-input"
        />
      )

      const inputElement = screen.getByTestId('named-input')
      expect(inputElement).toBeTruthy()
      // name 属性主要用于表单集成，这里验证组件能正确接收
    })
  })
})
