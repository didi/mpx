import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react-native'
import MpxInput from '../../../lib/runtime/components/react/mpx-input'

describe('MpxInput', () => {
  // 基础功能测试
  it('should render with basic props', () => {
    const { toJSON } = render(
      <MpxInput
        testID="basic-input"
        value="test value"
        placeholder="Enter text"
        enable-var={true}
      />
    )

    const inputElement = screen.getByTestId('basic-input')
    expect(inputElement.props.value).toBe('test value')
    expect(inputElement.props.placeholder).toBe('Enter text')
    expect(toJSON()).toMatchSnapshot()
  })

  // 参数化测试 - 不同输入类型
  it.each([
    ['text', 'default'],
    ['number', 'numeric'],
    ['idcard', 'default'],
    ['digit', expect.stringMatching(/decimal-pad|numeric/)]
  ])('should handle input type %s with keyboard %s', (type, expectedKeyboard) => {
    const { toJSON } = render(
      <MpxInput
        testID="type-input"
        type={type as any}
        value="123"
        enable-var={true}
      />
    )

    const inputElement = screen.getByTestId('type-input')
    expect(inputElement.props.keyboardType).toEqual(expectedKeyboard)
    expect(toJSON()).toMatchSnapshot(`input-type-${type}`)
  })

  // 参数化测试 - 属性组合
  it.each([
    { password: true, disabled: false, multiline: false },
    { password: false, disabled: true, multiline: false },
    { password: false, disabled: false, multiline: true },
    { focus: true, 'auto-focus': false },
    { focus: false, 'auto-focus': true },
    { focus: true, 'auto-focus': true }
  ])('should handle property combinations: %p', (props) => {
    const { rerender } = render(
      <MpxInput
        testID="combo-input"
        value="test"
        enable-var={true}
        {...props}
      />
    )

    const inputElement = screen.getByTestId('combo-input')
    expect(inputElement).toBeTruthy()

    // 验证关键属性映射
    if (props.password) expect(inputElement.props.secureTextEntry).toBe(true)
    if (props.disabled) expect(inputElement.props.editable).toBe(false)
    if (props.multiline) expect(inputElement.props.multiline).toBe(true)
    if (props.focus || props['auto-focus']) expect(inputElement.props.autoFocus).toBe(true)
  })

  // 事件处理综合测试
  it('should handle all input events', () => {
    const mockBindinput = jest.fn()
    const mockBindfocus = jest.fn()
    const mockBindblur = jest.fn()
    const mockBindconfirm = jest.fn()
    const mockBindselectionchange = jest.fn()

    render(
      <MpxInput
        testID="event-input"
        bindinput={mockBindinput}
        bindfocus={mockBindfocus}
        bindblur={mockBindblur}
        bindconfirm={mockBindconfirm}
        bindselectionchange={mockBindselectionchange}
        value="test events"
        enable-var={true}
      />
    )

    const inputElement = screen.getByTestId('event-input')

    // 触发所有事件
    fireEvent(inputElement, 'change', { nativeEvent: { text: 'new text', selection: { start: 8, end: 8 } } })
    fireEvent(inputElement, 'focus')
    fireEvent(inputElement, 'blur')
    fireEvent(inputElement, 'submitEditing')
    fireEvent(inputElement, 'selectionChange', { nativeEvent: { selection: { start: 4, end: 4 } } })

    // 验证所有事件被调用
    expect(mockBindinput).toHaveBeenCalled()
    expect(mockBindfocus).toHaveBeenCalled()
    expect(mockBindblur).toHaveBeenCalled()
    expect(mockBindconfirm).toHaveBeenCalled()
    expect(mockBindselectionchange).toHaveBeenCalled()
  })

  // 表单集成测试
  it('should integrate with form context', () => {
    const mockFormValuesMap = new Map()
    const TestFormProvider = ({ children }: { children: any }) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const React = require('react')
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { FormContext } = require('../../../lib/runtime/components/react/context')
      return React.createElement(FormContext.Provider, {
        value: { formValuesMap: mockFormValuesMap, submit: jest.fn(), reset: jest.fn() }
      }, children)
    }

    // 测试有 name 的情况
    const { unmount } = render(
      <TestFormProvider>
        <MpxInput testID="form-input" name="username" value="test user" enable-var={true} />
      </TestFormProvider>
    )

    expect(mockFormValuesMap.has('username')).toBe(true)
    const formField = mockFormValuesMap.get('username')
    expect(formField.getValue()).toBe('test user')

    // 测试 resetValue 功能
    act(() => {
      formField.resetValue()
    })
    expect(typeof formField.resetValue).toBe('function')

    unmount()
    expect(mockFormValuesMap.has('username')).toBe(false) // 验证清理
  })

  // 警告测试
  it('should warn when form lacks name attribute', () => {
    const mockFormValuesMap = new Map()
    const originalWarn = console.warn
    const mockWarn = jest.fn()
    console.warn = mockWarn

    const TestFormProvider = ({ children }: { children: any }) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const React = require('react')
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { FormContext } = require('../../../lib/runtime/components/react/context')
      return React.createElement(FormContext.Provider, {
        value: { formValuesMap: mockFormValuesMap, submit: jest.fn(), reset: jest.fn() }
      }, children)
    }

    render(
      <TestFormProvider>
        <MpxInput testID="no-name-input" value="test" enable-var={true} />
      </TestFormProvider>
    )

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('If a form component is used, the name attribute is required.')
    )
    console.warn = originalWarn
  })

  // 值解析边界测试
  it('should handle value parsing edge cases', () => {
    const testCases = [
      { value: undefined, maxlength: 140, expected: '' },
      { value: 'very long text', maxlength: 5, expected: 'very ' },
      { value: 'short', maxlength: -1, expected: 'short', expectedMaxLength: undefined },
      { value: 12345, maxlength: 140, expected: '12345' },
      { value: 'any text', maxlength: 0, expected: '' }
    ]

    testCases.forEach(({ value, maxlength, expected, expectedMaxLength }, index) => {
      const { rerender } = render(
        <MpxInput
          testID="parse-input"
          value={value as any}
          maxlength={maxlength}
          enable-var={true}
        />
      )

      const inputElement = screen.getByTestId('parse-input')
      expect(inputElement.props.value).toBe(expected)
      if (expectedMaxLength !== undefined) {
        expect(inputElement.props.maxLength).toBe(expectedMaxLength)
      }
    })
  })

  // 选择和光标测试
  it('should handle selection and cursor positioning', () => {
    // 测试 selection-start 和 selection-end
    const { rerender } = render(
      <MpxInput
        testID="selection-input"
        value="hello world"
        selection-start={5}
        selection-end={-1}
        enable-var={true}
      />
    )

    let inputElement = screen.getByTestId('selection-input')
    expect(inputElement.props.selection.start).toBe(5)
    expect(inputElement.props.selection.end).toBe(11) // tmpValue.current.length

    // 测试 cursor 属性
    rerender(
      <MpxInput
        testID="selection-input"
        value="hello world"
        cursor={7}
        enable-var={true}
      />
    )

    inputElement = screen.getByTestId('selection-input')
    expect(inputElement.props.selection.start).toBe(7)
    expect(inputElement.props.selection.end).toBe(7)

    // 测试没有 selection 的情况
    rerender(
      <MpxInput
        testID="selection-input"
        value="hello world"
        enable-var={true}
      />
    )

    inputElement = screen.getByTestId('selection-input')
    expect(inputElement.props.selection).toBeUndefined()
  })

  // 多行和确认类型组合测试
  it('should handle multiline and confirm-type combinations', () => {
    const testCases = [
      { multiline: true, 'confirm-type': 'return', expectedEnterKeyHint: undefined, expectedBlurOnSubmit: false },
      { multiline: true, 'confirm-type': 'done', expectedEnterKeyHint: 'done', expectedBlurOnSubmit: false },
      { multiline: false, 'confirm-type': 'search', expectedEnterKeyHint: 'search', expectedBlurOnSubmit: true }
    ]

    testCases.forEach((testCase) => {
      const { rerender } = render(
        <MpxInput
          testID="multiline-confirm-input"
          value="test"
          enable-var={true}
          {...testCase}
        />
      )

      const inputElement = screen.getByTestId('multiline-confirm-input')
      expect(inputElement.props.enterKeyHint).toBe(testCase.expectedEnterKeyHint)
      expect(inputElement.props.blurOnSubmit).toBe(testCase.expectedBlurOnSubmit)
    })
  })

  // 键盘避让和触摸事件测试
  it('should handle keyboard avoidance and touch events', () => {
    const mockKeyboardAvoidRef = { current: null }
    const TestKeyboardAvoidProvider = ({ children }: { children: any }) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const React = require('react')
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { KeyboardAvoidContext } = require('../../../lib/runtime/components/react/context')
      return React.createElement(KeyboardAvoidContext.Provider, {
        value: mockKeyboardAvoidRef
      }, children)
    }

    render(
      <TestKeyboardAvoidProvider>
        <MpxInput
          testID="keyboard-input"
          adjust-position={true}
          cursor-spacing={10}
          value="test"
          enable-var={true}
        />
      </TestKeyboardAvoidProvider>
    )

    const inputElement = screen.getByTestId('keyboard-input')

    // 测试触摸事件
    fireEvent(inputElement, 'touchStart')
    fireEvent(inputElement, 'touchEnd', { nativeEvent: {} })

    expect(inputElement).toBeTruthy()
  })

  // 多行内容尺寸变化测试
  it('should handle multiline content size changes', () => {
    const mockBindlinechange = jest.fn()

    render(
      <MpxInput
        testID="multiline-size-input"
        multiline={true}
        auto-height={true}
        bindlinechange={mockBindlinechange}
        value="Line 1\nLine 2"
        enable-var={true}
      />
    )

    const inputElement = screen.getByTestId('multiline-size-input')

    // 测试内容尺寸变化
    fireEvent(inputElement, 'contentSizeChange', {
      nativeEvent: { contentSize: { width: 200, height: 60 } }
    })

    fireEvent(inputElement, 'contentSizeChange', {
      nativeEvent: { contentSize: { width: 200, height: 120 } }
    })

    expect(mockBindlinechange).toHaveBeenCalled()
  })

  // Portal 渲染测试
  it('should render in Portal when position is fixed', () => {
    const mockUseTransformStyle = jest.fn(() => ({
      hasPositionFixed: true, // 正确：hasPositionFixed 来自 useTransformStyle
      hasSelfPercent: false,
      normalStyle: { position: 'absolute' },
      setWidth: jest.fn(),
      setHeight: jest.fn()
    }))

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const originalModule = jest.requireActual('../../../lib/runtime/components/react/utils')
    jest.doMock('../../../lib/runtime/components/react/utils', () => ({
      ...originalModule,
      useTransformStyle: mockUseTransformStyle
    }))

    delete require.cache[require.resolve('../../../lib/runtime/components/react/mpx-input')]
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const MockedMpxInput = require('../../../lib/runtime/components/react/mpx-input').default

    const { toJSON } = render(
      React.createElement(MockedMpxInput, {
        testID: 'portal-input',
        value: 'Portal content',
        'enable-var': true
      })
    )

    expect(toJSON()).toMatchSnapshot('input-with-portal')
    jest.dontMock('../../../lib/runtime/components/react/utils')
  })

  // onChange 返回值处理测试
  it('should handle onChange return values', () => {
    const mockBindinput = jest.fn()
      .mockReturnValueOnce('modified value')
      .mockReturnValueOnce(undefined)

    render(
      <MpxInput
        testID="onchange-input"
        bindinput={mockBindinput}
        value="original"
        enable-var={true}
      />
    )

    const inputElement = screen.getByTestId('onchange-input')

    // 测试返回字符串的情况
    fireEvent(inputElement, 'change', {
      nativeEvent: { text: 'new text', selection: { start: 8, end: 8 } }
    })

    // 测试返回 undefined 的情况
    fireEvent(inputElement, 'change', {
      nativeEvent: { text: 'another text', selection: { start: 12, end: 12 } }
    })

    expect(mockBindinput).toHaveBeenCalledTimes(2)
  })

  // 补充关键的覆盖率测试
  it('should handle edge cases for better coverage', () => {
    const mockBindinput = jest.fn()

    // 测试 tmpValue.current === text 的情况（应该 return early）
    render(
      <MpxInput
        testID="edge-input"
        bindinput={mockBindinput}
        value="test"
        enable-var={true}
      />
    )

    const inputElement = screen.getByTestId('edge-input')

    // 触发相同文本的 change 事件
    fireEvent(inputElement, 'change', {
      nativeEvent: { text: 'test', selection: { start: 4, end: 4 } }
    })

    // 触发不同文本的 change 事件
    fireEvent(inputElement, 'change', {
      nativeEvent: { text: 'different', selection: undefined }
    })

    expect(mockBindinput).toHaveBeenCalledTimes(1) // 只有第二次调用有效

    // 测试没有 bindinput 的情况
    const { rerender } = render(
      <MpxInput
        testID="no-bindinput"
        value="test2"
        enable-var={true}
      />
    )

    const noBindinputElement = screen.getByTestId('no-bindinput')
    fireEvent(noBindinputElement, 'change', {
      nativeEvent: { text: 'changed', selection: { start: 7, end: 7 } }
    })

    expect(noBindinputElement).toBeTruthy()
  })

  // 精简的分支覆盖率补充测试
  it('should handle key remaining branches efficiently', () => {
    // 测试 number 类型 value 和特殊 maxlength
    const { rerender } = render(
      <MpxInput
        testID="efficient-branch-input"
        value={12345}
        type="number"
        maxlength={-1}
        enable-var={true}
      />
    )

    let inputElement = screen.getByTestId('efficient-branch-input')
    expect(inputElement.props.value).toBe('12345')
    expect(inputElement.props.maxLength).toBeUndefined()

    // 测试 multiline 相关分支组合
    rerender(
      <MpxInput
        testID="efficient-branch-input"
        multiline={true}
        confirm-type="return"
        auto-height={false}
        enable-var={true}
      />
    )

    inputElement = screen.getByTestId('efficient-branch-input')
    expect(inputElement.props.enterKeyHint).toBeUndefined()
    expect(inputElement.props.textAlignVertical).toBe('top')

    // 测试 selection 未设置的情况
    expect(inputElement.props.selection).toBeUndefined()
  })
})
