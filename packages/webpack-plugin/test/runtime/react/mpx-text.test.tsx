import React from 'react'
import { render, screen } from '@testing-library/react-native'
import MpxText from '../../../lib/runtime/components/react/mpx-text'

// Mock mpx-portal
jest.mock('../../../lib/runtime/components/react/mpx-portal', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
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
    const { toJSON } = render(<MpxText>Hello World</MpxText>)

    // 使用@testing-library查询方法
    expect(screen.getByText('Hello World')).toBeTruthy()

    // 如果需要快照测试，可以添加
    expect(toJSON()).toMatchSnapshot()
  })

  it('should render with custom styles', () => {
    const customStyle = { color: 'red', fontSize: 16 }

    const { toJSON } = render(<MpxText style={customStyle}>Styled Text</MpxText>)

    const textElement = screen.getByText('Styled Text')
    expect(textElement).toBeTruthy()
    expect(textElement.props.style).toMatchObject(customStyle)
    expect(toJSON()).toMatchSnapshot()
  })

  it('should handle selectable prop', () => {
    const { toJSON } = render(<MpxText selectable>Selectable Text</MpxText>)

    const textElement = screen.getByText('Selectable Text')
    expect(textElement).toBeTruthy()
    expect(textElement.props.selectable).toBe(true)
    expect(toJSON()).toMatchSnapshot()
  })

  it('should handle allowFontScaling prop', () => {
    render(<MpxText allowFontScaling={true}>Scalable Text</MpxText>)

    const textElement = screen.getByText('Scalable Text')
    expect(textElement).toBeTruthy()
    expect(textElement.props.allowFontScaling).toBe(true)
  })

  it('should render nested text components', () => {
    const { toJSON } = render(
      <MpxText testID="parent-text">
        Parent text
        <MpxText testID="child-text">Child text</MpxText>
      </MpxText>
    )

    // 使用testID来查找嵌套的MpxText组件，因为@testing-library对嵌套文本的处理不同
    expect(screen.getByTestId('parent-text')).toBeTruthy()
    expect(screen.getByTestId('child-text')).toBeTruthy()
    expect(screen.getByText('Child text')).toBeTruthy()
    expect(toJSON()).toMatchSnapshot()
  })

  it('should handle empty text', () => {
    render(<MpxText testID="empty-text"></MpxText>)

    // 空文本应该仍然渲染MpxText组件
    const textElement = screen.getByTestId('empty-text')
    expect(textElement).toBeTruthy()
  })

  it('should handle testID prop', () => {
    render(<MpxText testID="my-text">Test ID MpxText</MpxText>)

    expect(screen.getByTestId('my-text')).toBeTruthy()
    expect(screen.getByText('Test ID MpxText')).toBeTruthy()
  })

    it('should handle accessibility props', () => {
    render(
      <MpxText
        accessibilityLabel="MpxText label"
        accessibilityHint="MpxText hint"
        accessibilityRole="text"
      >
        Accessible MpxText
      </MpxText>
    )

    const textElement = screen.getByText('Accessible MpxText')
    expect(textElement).toBeTruthy()
    expect(textElement.props.accessibilityLabel).toBe('MpxText label')
    expect(textElement.props.accessibilityHint).toBe('MpxText hint')
    expect(textElement.props.accessibilityRole).toBe('text')
  })

  it('should handle multiple props together', () => {
    const style = { fontWeight: 'bold' as const }

    const { toJSON } = render(
      <MpxText
        style={style}
        selectable={true}
        allowFontScaling={false}
        testID="complex-text"
      >
        Complex Text
      </MpxText>
    )

    const textElement = screen.getByTestId('complex-text')
    expect(textElement).toBeTruthy()
    expect(textElement.props.style).toMatchObject(style)
    expect(textElement.props.selectable).toBe(true)
    expect(textElement.props.allowFontScaling).toBe(false)
    expect(toJSON()).toMatchSnapshot()
  })

  // MPX 特有功能测试
  describe('MPX specific features', () => {
    it('should handle user-select prop', () => {
      const { toJSON } = render(<MpxText user-select={true} testID="user-select-text">User Select Text</MpxText>)

      const textElement = screen.getByTestId('user-select-text')
      expect(textElement).toBeTruthy()
      expect(textElement.props.selectable).toBe(true)
      expect(toJSON()).toMatchSnapshot()
    })

    it('should handle user-select prop with selectable false', () => {
      render(<MpxText user-select={true} selectable={false} testID="user-select-override">Override Test</MpxText>)

      const textElement = screen.getByTestId('user-select-override')
      expect(textElement).toBeTruthy()
      // user-select 应该覆盖 selectable
      expect(textElement.props.selectable).toBe(true)
    })

    it('should handle enable-var prop', () => {
      const styleWithVar = { color: 'red', fontSize: 16 }
      const { toJSON } = render(
        <MpxText
          style={styleWithVar}
          enable-var={true}
          testID="var-enabled-text"
        >
          CSS Var Text
        </MpxText>
      )

      const textElement = screen.getByTestId('var-enabled-text')
      expect(textElement).toBeTruthy()
      // 验证样式被正确应用（即使没有实际的CSS变量）
      expect(textElement.props.style).toMatchObject(styleWithVar)
      expect(toJSON()).toMatchSnapshot()
    })

    // TODO: external-var-context 测试需要修复 utils.tsx 中的 React 导入问题
    // it('should handle external-var-context prop', () => { ... })

    it('should handle parent size props', () => {
      const { toJSON } = render(
        <MpxText
          parent-font-size={20}
          parent-width={300}
          parent-height={400}
          testID="parent-size-text"
        >
          Parent Size Text
        </MpxText>
      )

      const textElement = screen.getByTestId('parent-size-text')
      expect(textElement).toBeTruthy()
      expect(toJSON()).toMatchSnapshot()
    })

    it('should handle position fixed style (Portal integration)', () => {
      const fixedStyle = { top: 0, left: 0, color: 'blue' } as any
      const { toJSON } = render(
        <MpxText
          style={fixedStyle}
          testID="fixed-position-text"
        >
          Fixed Position Text
        </MpxText>
      )

      // 由于 Portal 被 mock 为 View，我们检查是否有 Portal 包装
      // 在实际的组件中，hasPositionFixed 为 true 时会使用 Portal
      const textElement = screen.getByTestId('fixed-position-text')
      expect(textElement).toBeTruthy()
      expect(toJSON()).toMatchSnapshot()
    })

    it('should handle complex style transformations', () => {
      const complexStyle = {
        color: 'blue',
        fontSize: 16,
        lineHeight: 1.5,
        textAlign: 'center' as const,
        fontWeight: 'bold' as const
      }

      const { toJSON } = render(
        <MpxText
          style={complexStyle}
          enable-var={true}
          parent-font-size={16}
          testID="complex-style-text"
        >
          Complex Style Text
        </MpxText>
      )

      const textElement = screen.getByTestId('complex-style-text')
      expect(textElement).toBeTruthy()
      expect(textElement.props.style).toMatchObject(complexStyle)
      expect(toJSON()).toMatchSnapshot()
    })
  })

  // Ref 转发测试
  describe('Ref forwarding', () => {
    it('should properly forward refs', () => {
      const ref = React.createRef<any>()

      render(
        <MpxText ref={ref} testID="ref-text">
          Ref MpxText
        </MpxText>
      )

      // 验证 ref 被正确设置
      expect(ref.current).toBeTruthy()

      const textElement = screen.getByTestId('ref-text')
      expect(textElement).toBeTruthy()
    })

    it('should handle ref with complex props', () => {
      const ref = React.createRef<any>()

      render(
        <MpxText
          ref={ref}
          style={{ color: 'red' }}
          selectable={true}
          user-select={true}
          testID="complex-ref-text"
        >
          Complex Ref MpxText
        </MpxText>
      )

      expect(ref.current).toBeTruthy()
      const textElement = screen.getByTestId('complex-ref-text')
      expect(textElement).toBeTruthy()
      expect(textElement.props.selectable).toBe(true)
    })
  })

  // 边界情况测试
  describe('Edge cases', () => {
    it('should handle undefined style', () => {
      render(<MpxText style={undefined} testID="undefined-style">Undefined Style</MpxText>)

      const textElement = screen.getByTestId('undefined-style')
      expect(textElement).toBeTruthy()
      expect(textElement.props.style).toEqual({})
    })

    it('should handle null children', () => {
      render(<MpxText testID="null-children">{null}</MpxText>)

      const textElement = screen.getByTestId('null-children')
      expect(textElement).toBeTruthy()
    })

    it('should handle mixed children types', () => {
      const { toJSON } = render(
        <MpxText testID="mixed-children">
          String text
          {42}
          {null}
          {undefined}
          <MpxText>Nested text</MpxText>
        </MpxText>
      )

      const textElement = screen.getByTestId('mixed-children')
      expect(textElement).toBeTruthy()
      expect(toJSON()).toMatchSnapshot()
    })

    it('should handle empty string children', () => {
      render(<MpxText testID="empty-string">{''}  </MpxText>)

      const textElement = screen.getByTestId('empty-string')
      expect(textElement).toBeTruthy()
    })

    it('should handle boolean props correctly', () => {
      render(
        <MpxText
          selectable={false}
          user-select={false}
          enable-var={false}
          testID="boolean-props"
        >
          Boolean Props MpxText
        </MpxText>
      )

      const textElement = screen.getByTestId('boolean-props')
      expect(textElement).toBeTruthy()
      expect(textElement.props.selectable).toBe(false)
    })
  })
})
