
import React from 'react'
import { act, render, screen } from '@testing-library/react-native'
import { Image } from 'react-native'
import MpxView, { __parseBgImageForTest as parseBgImage } from '../../../lib/runtime/components/react/mpx-view'
import MpxInlineText from '../../../lib/runtime/components/react/mpx-inline-text'
import { fireTap, flushImageSize } from './helpers'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { __getLastPanGesture } = require('react-native-gesture-handler')

// Mock mpx-portal
jest.mock('../../../lib/runtime/components/react/mpx-portal', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mockReact = require('react')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return mockReact.forwardRef((props: any, ref: any) => {
    return mockReact.createElement('View', { ...props, ref, testID: 'mock-portal' })
  })
})

function getBackgroundView () {
  return screen.UNSAFE_getAllByType('View').find((node) => {
    return node.props.onLayout && node.props.style?.position === 'absolute' && node.props.style?.overflow === 'hidden'
  })
}

function layoutBackground (width: number, height: number) {
  const backgroundView = getBackgroundView()
  expect(backgroundView).toBeTruthy()
  act(() => {
    backgroundView.props.onLayout({
      nativeEvent: {
        layout: { width, height }
      }
    })
  })
  return backgroundView
}

function layoutBackgroundIfNeeded (width: number, height: number) {
  const backgroundView = getBackgroundView()
  if (backgroundView) {
    act(() => {
      backgroundView.props.onLayout({
        nativeEvent: {
          layout: { width, height }
        }
      })
    })
  }
  return backgroundView
}

describe('MpxView', () => {
  // 基础渲染和样式测试
  it('should render with basic props and styles', () => {
    render(
      <MpxView
        testID="basic-view"
        style={{
          backgroundColor: '#f0f0f0',
          padding: 10,
          borderRadius: 5
        }}
      >
        <MpxInlineText>Basic content</MpxInlineText>
      </MpxView>
    )

    const viewElement = screen.getByTestId('basic-view')
    expect(viewElement.props.style).toEqual({
      backgroundColor: '#f0f0f0',
      borderRadius: 5,
      boxSizing: 'content-box',
      padding: 10
    })
    expect(viewElement.children).toHaveLength(1)
    expect((viewElement.children[0] as any).props.children).toBe('Basic content')
  })

  it('should handle nested views and complex structure', () => {
    render(
      <MpxView testID="nested-view" style={{ padding: 5 }}>
        <MpxView testID="nested-child-view" style={{ margin: 2 }}>
          <MpxInlineText>Nested content</MpxInlineText>
        </MpxView>
        <MpxInlineText>Sibling content</MpxInlineText>
      </MpxView>
    )

    const viewElement = screen.getByTestId('nested-view')
    const childView = screen.getByTestId('nested-child-view')
    expect(viewElement.props.style).toEqual({
      boxSizing: 'content-box',
      padding: 5
    })
    expect(childView.props.style).toEqual({ margin: 2 })
    expect(viewElement.children).toHaveLength(2)
    expect((viewElement.children[0] as any).props.testID).toBe('nested-child-view')
    expect((childView.children[0] as any).props.children).toBe('Nested content')
    expect((viewElement.children[1] as any).props.children).toBe('Sibling content')
  })

  // MPX 特有功能测试
  it('should handle MPX touch events', () => {
    const bindtap = jest.fn()
    const bindtouchstart = jest.fn()
    const bindtouchend = jest.fn()

    render(
      <MpxView
        testID="touchable-view"
        bindtap={bindtap}
        bindtouchstart={bindtouchstart}
        bindtouchend={bindtouchend}
      >
        <MpxInlineText>Touch me</MpxInlineText>
      </MpxView>
    )

    const viewElement = screen.getByTestId('touchable-view')
    fireTap(viewElement)

    expect(bindtouchstart).toHaveBeenCalledWith(expect.objectContaining({
      type: 'touchstart',
      detail: { x: 10, y: 20 }
    }))
    expect(bindtouchend).toHaveBeenCalledWith(expect.objectContaining({
      type: 'touchend',
      detail: { x: 10, y: 20 }
    }))
    expect(bindtap).toHaveBeenCalledWith(expect.objectContaining({
      type: 'tap',
      detail: { x: 10, y: 20 }
    }))
  })

  it('should handle background properties', () => {
    render(
      <MpxView
        testID="background-view"
        enable-background={true}
        enable-fast-image={true}
        style={{
          backgroundColor: '#ff0000',
          backgroundImage: 'linear-gradient(45deg, #ff0000 0%, #00ff00 100%)',
          borderRadius: 10
        }}
      >
        <MpxInlineText>Background content</MpxInlineText>
      </MpxView>
    )

    const viewElement = screen.getByTestId('background-view')
    expect(viewElement.props.style).toEqual({
      backgroundColor: '#ff0000',
      borderRadius: 10
    })
    layoutBackground(100, 100)
    expect(screen.getByTestId('linear-gradient').props).toEqual(expect.objectContaining({
      angle: 45,
      colors: ['#ff0000', '#00ff00'],
      locations: [0, 1],
      useAngle: true
    }))
  })

  // 布局和样式测试
  it('should handle flex layout properties', () => {
    render(
      <MpxView
        testID="flex-view"
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          flex: 1
        }}
      >
        <MpxInlineText>Item 1</MpxInlineText>
        <MpxInlineText>Item 2</MpxInlineText>
      </MpxView>
    )

    const viewElement = screen.getByTestId('flex-view')
    expect(viewElement.props.style).toEqual({
      alignItems: 'center',
      display: 'flex',
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'nowrap',
      justifyContent: 'space-between'
    })
    expect(viewElement.children).toHaveLength(2)
    expect((viewElement.children[0] as any).props.children).toBe('Item 1')
    expect((viewElement.children[1] as any).props.children).toBe('Item 2')
  })

  it('should apply complete flex defaults without a flex shorthand', () => {
    render(<MpxView testID="default-flex-view" style={{ display: 'flex' }} />)
    expect(screen.getByTestId('default-flex-view').props.style).toEqual({
      display: 'flex',
      flexBasis: 'auto',
      flexDirection: 'row',
      flexShrink: 1,
      flexWrap: 'nowrap'
    })
  })

  // Ref 转发测试
  it('should properly forward refs', () => {
    const ref = React.createRef()

    render(
      <MpxView ref={ref} testID="ref-view">
        <MpxInlineText>Ref content</MpxInlineText>
      </MpxView>
    )

    expect(ref.current).toBeTruthy()
  })

  // 可访问性测试
  it('should handle accessibility props', () => {
    render(
      <MpxView
        testID="accessible-view"
        accessible={true}
        accessibilityLabel="Test view"
        accessibilityRole="button"
      >
        <MpxInlineText>Accessible content</MpxInlineText>
      </MpxView>
    )

    const viewElement = screen.getByTestId('accessible-view')
    expect(viewElement).toBeTruthy()
    expect(viewElement.props.accessible).toBe(true)
    expect(viewElement.props.accessibilityLabel).toBe('Test view')
  })

  // 边界情况和异常处理测试
  it('should handle edge cases and null values', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    try {
      const { rerender } = render(
        <MpxView testID="edge-view" style={undefined}>
          <MpxInlineText>Edge case content</MpxInlineText>
        </MpxView>
      )

      let viewElement = screen.getByTestId('edge-view')
      expect(viewElement).toBeTruthy()
      expect(screen.getByText('Edge case content')).toBeTruthy()

      // 测试 null children
      rerender(
        <MpxView testID="edge-view">
          {null}
          <MpxInlineText>Valid content</MpxInlineText>
          {false}
        </MpxView>
      )

      viewElement = screen.getByTestId('edge-view')
      expect(viewElement).toBeTruthy()
      expect(screen.queryByText('Edge case content')).toBeNull()
      expect(screen.getByText('Valid content')).toBeTruthy()

      // 测试零值和负值样式
      rerender(
        <MpxView
          testID="edge-view"
          style={{
            width: 0,
            height: -1,
            margin: 0,
            padding: -5
          }}
        >
          <MpxInlineText>Zero/negative values</MpxInlineText>
        </MpxView>
      )

      viewElement = screen.getByTestId('edge-view')
      expect(viewElement.props.style).toEqual(expect.objectContaining({
        width: 0,
        height: -1,
        margin: 0,
        padding: -5
      }))
      expect(screen.queryByText('Valid content')).toBeNull()
      expect(screen.getByText('Zero/negative values')).toBeTruthy()
      expect(warnSpy).not.toHaveBeenCalled()
      expect(errorSpy).not.toHaveBeenCalled()
    } finally {
      warnSpy.mockRestore()
      errorSpy.mockRestore()
    }
  })

  // 背景图片功能测试
  it('should handle background image properties', async () => {
    render(
      <MpxView
        testID="bg-image-view"
        enable-background={true}
        style={{
          width: 200,
          height: 200,
          backgroundImage: 'url(https://example.com/image.jpg)'
        }}
      >
        <MpxInlineText>Background image content</MpxInlineText>
      </MpxView>
    )
    await flushImageSize()

    const viewElement = screen.getByTestId('bg-image-view')
    expect(viewElement).toBeTruthy()
    expect(screen.getByTestId('fast-image').props.source).toEqual({
      uri: 'https://example.com/image.jpg'
    })
  })

  it('should handle enabled background without background image', () => {
    render(<MpxView testID="empty-background-view" enable-background={true} />)

    expect(screen.getByTestId('empty-background-view')).toBeTruthy()
    expect(getBackgroundView()).toBeUndefined()
  })

  // 线性渐变背景测试
  it('should handle linear gradient backgrounds', () => {
    render(
      <MpxView
        testID="gradient-view"
        enable-background={true}
        style={{
          width: 300,
          height: 150,
          backgroundImage: 'linear-gradient(45deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)'
        }}
      >
        <MpxInlineText>Gradient background</MpxInlineText>
      </MpxView>
    )

    const viewElement = screen.getByTestId('gradient-view')
    expect(viewElement.props.style).toEqual({ height: 150, width: 300 })
    layoutBackground(300, 150)
    expect(screen.getByTestId('linear-gradient').props).toEqual(expect.objectContaining({
      angle: 45,
      colors: ['#ff0000', '#00ff00', '#0000ff'],
      locations: [0, 0.5, 1],
      useAngle: true
    }))
  })

  it('should render animated view when animation is enabled', () => {
    render(
      <MpxView
        testID="animated-view"
        enable-animation="api"
        style={{ opacity: 1 }}
      />
    )

    expect(screen.getByTestId('animated-view')).toBeTruthy()
  })

  // 悬停状态测试
  it('should handle hover states and timing', () => {
    jest.useFakeTimers()
    const hoverStyle = {
      backgroundColor: '#00ff00',
      transform: [{ scale: 1.1 }]
    }

    try {
      render(
        <MpxView
          testID="hover-view"
          hover-style={hoverStyle}
          hover-start-time={100}
          hover-stay-time={200}
          style={{
            width: 100,
            height: 100,
            backgroundColor: '#ff0000'
          }}
        >
          <MpxInlineText>Hover me</MpxInlineText>
        </MpxView>
      )

      const gesture = __getLastPanGesture()
      act(() => {
        gesture.onTouchesDownCallback()
        jest.advanceTimersByTime(100)
      })
      expect(screen.getByTestId('hover-view').props.style).toEqual(expect.objectContaining({
        backgroundColor: '#00ff00',
        transform: [{ scale: 1.1 }]
      }))

      act(() => {
        gesture.onTouchesUpCallback()
        jest.advanceTimersByTime(200)
      })
      expect(screen.getByTestId('hover-view').props.style).toEqual(expect.objectContaining({
        backgroundColor: '#ff0000'
      }))
    } finally {
      jest.useRealTimers()
    }
  })

  // 基础 Portal 功能测试
  it('should handle Portal functionality', () => {
    render(
      <MpxView
        testID="portal-view"
        style={{ width: 100, height: 100, backgroundColor: '#f0f0f0', position: 'fixed' }}
      >
        <MpxInlineText>Portal view content</MpxInlineText>
      </MpxView>
    )

    const viewElement = screen.getByTestId('portal-view')
    expect(viewElement).toBeTruthy()
    expect(screen.getByTestId('mock-portal')).toBeTruthy()
  })

  // 手势事件测试
  it('should handle comprehensive touch and gesture events', () => {
    const mockBindtouchstart = jest.fn()
    const mockBindtouchend = jest.fn()

    render(
      <MpxView
        testID="gesture-view"
        bindtouchstart={mockBindtouchstart}
        bindtouchend={mockBindtouchend}
        style={{ width: 100, height: 100 }}
      >
        <MpxInlineText>Gesture area</MpxInlineText>
      </MpxView>
    )

    const viewElement = screen.getByTestId('gesture-view')
    fireTap(viewElement)
    expect(mockBindtouchstart).toHaveBeenCalledWith(expect.objectContaining({
      type: 'touchstart'
    }))
    expect(mockBindtouchend).toHaveBeenCalledWith(expect.objectContaining({
      type: 'touchend'
    }))
  })

  it('should pass text styles through to inline children', () => {
    render(
      <MpxView
        testID="context-view"
        enable-text-pass-through={true}
        style={{
          backgroundColor: '#007AFF',
          borderRadius: 8,
          padding: 16,
          margin: 12,
          width: 200,
          height: 100,
          color: '#ff0000',
          fontSize: 16
        }}
      >
        <MpxInlineText>Context styled view</MpxInlineText>
      </MpxView>
    )

    const viewElement = screen.getByTestId('context-view')
    expect(viewElement).toBeTruthy()
    expect(screen.getByText('Context styled view').props.style).toEqual(expect.objectContaining({
      color: '#ff0000',
      fontSize: 16
    }))
  })

  // 父级尺寸上下文测试
  it('should handle parent size context', () => {
    render(
      <MpxView
        testID="parent-size-view"
        parent-font-size={16}
        parent-width={400}
        parent-height={300}
        style={{
          width: 'calc(75%)',
          height: 'calc(50%)',
          fontSize: '150%',
          padding: 10
        }}
      >
        <MpxInlineText>Parent size context view</MpxInlineText>
      </MpxView>
    )

    const viewElement = screen.getByTestId('parent-size-view')
    expect(viewElement).toBeTruthy()
    expect(viewElement.props.style).toEqual(expect.objectContaining({
      width: 300,
      height: 150
    }))
    expect(screen.getByText('Parent size context view').props.style).toEqual(expect.objectContaining({
      fontSize: 24
    }))
  })

  // 复杂背景属性组合测试
  it('should handle complex background property combinations', () => {
    render(
      <MpxView
        testID="complex-bg-view"
        enable-background={true}
        enable-fast-image={true}
        style={{
          width: 300,
          height: 200,
          backgroundImage: 'linear-gradient(to right, rgba(255,0,0,0.5), rgba(0,255,0,0.5))',
          borderRadius: 10
        }}
      >
        <MpxInlineText>Complex background</MpxInlineText>
      </MpxView>
    )

    const viewElement = screen.getByTestId('complex-bg-view')
    expect(viewElement.props.style).toEqual({
      borderRadius: 10,
      height: 200,
      width: 300
    })
    layoutBackground(300, 200)
    expect(screen.getByTestId('linear-gradient').props).toEqual(expect.objectContaining({
      angle: 90,
      colors: ['rgba(255,0,0,0.5)', 'rgba(0,255,0,0.5)'],
      locations: [0, 1],
      useAngle: true
    }))
  })

  // 布局变化和尺寸计算测试
  it('should handle layout changes and size calculations', () => {
    const mockOnLayout = jest.fn()

    const { rerender } = render(
      <MpxView
        testID="layout-view"
        enable-offset={true}
        onLayout={mockOnLayout}
        style={{
          width: 100,
          height: 100,
          backgroundColor: '#f0f0f0'
        }}
      >
        <MpxInlineText>Initial size</MpxInlineText>
      </MpxView>
    )

    let viewElement = screen.getByTestId('layout-view')
    viewElement.props.onLayout({
      nativeEvent: {
        layout: { width: 100, height: 100 }
      }
    })
    expect(mockOnLayout).toHaveBeenCalledWith(expect.objectContaining({
      nativeEvent: {
        layout: { width: 100, height: 100 }
      }
    }))

    // 改变尺寸
    rerender(
      <MpxView
        testID="layout-view"
        enable-offset={true}
        onLayout={mockOnLayout}
        style={{
          width: 200,
          height: 150,
          backgroundColor: '#f0f0f0'
        }}
      >
        <MpxInlineText>Changed size</MpxInlineText>
      </MpxView>
    )

    viewElement = screen.getByTestId('layout-view')
    viewElement.props.onLayout({
      nativeEvent: {
        layout: { width: 200, height: 150 }
      }
    })
    expect(mockOnLayout).toHaveBeenCalledTimes(2)
    expect(viewElement.props.style).toEqual(expect.objectContaining({
      width: 200,
      height: 150
    }))
  })

  it('should resolve self percent styles after layout', () => {
    render(
      <MpxView
        testID="self-percent-view"
        style={{
          width: 100,
          height: 100,
          borderRadius: 'calc(50%)' as any
        }}
      />
    )

    let viewElement = screen.getByTestId('self-percent-view')
    expect(viewElement.props.style).toEqual(expect.objectContaining({
      borderRadius: 0,
      opacity: 0
    }))

    act(() => {
      viewElement.props.onLayout({
        nativeEvent: {
          layout: { width: 100, height: 100 }
        }
      })
    })

    viewElement = screen.getByTestId('self-percent-view')
    expect(viewElement.props.style).toEqual(expect.objectContaining({
      borderRadius: 50
    }))
    expect(viewElement.props.style.opacity).toBeUndefined()
  })

  // 深度嵌套和复杂结构测试
  it('should handle deeply nested complex structures', () => {
    render(
      <MpxView testID="deep-nested-view" style={{ padding: 10 }}>
        <MpxView testID="deep-level-1" style={{ backgroundColor: '#ff0000', margin: 5 }}>
          <MpxInlineText>Level 1</MpxInlineText>
          <MpxView testID="deep-level-2" style={{ backgroundColor: '#00ff00', margin: 5 }}>
            <MpxInlineText>Level 2</MpxInlineText>
            <MpxView testID="deep-level-3" style={{ backgroundColor: '#0000ff', margin: 5 }}>
              <MpxInlineText>Level 3</MpxInlineText>
              <MpxView testID="deep-level-4" style={{ backgroundColor: '#ffff00', margin: 5 }}>
                <MpxInlineText>Level 4</MpxInlineText>
              </MpxView>
            </MpxView>
          </MpxView>
        </MpxView>
      </MpxView>
    )

    const viewElement = screen.getByTestId('deep-nested-view')
    const levels = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'].map((backgroundColor, index) => {
      const level = screen.getByTestId(`deep-level-${index + 1}`)
      expect(level.props.style).toEqual({ backgroundColor, margin: 5 })
      expect((level.children[0] as any).props.children).toBe(`Level ${index + 1}`)
      return level
    })
    expect(viewElement.props.style).toEqual({ boxSizing: 'content-box', padding: 10 })
    expect((viewElement.children[0] as any).props.testID).toBe('deep-level-1')
    levels.slice(1).forEach((level, index) => {
      expect((levels[index].children[1] as any).props.testID).toBe(level.props.testID)
    })
  })

  // 边界条件和错误处理测试
  it('should handle boundary conditions and error cases', () => {
    const { rerender } = render(
      <MpxView
        testID="boundary-view"
        style={{
          width: 0, // 零宽度
          height: -1, // 负高度
          margin: null, // null 值
          padding: undefined // undefined 值
        }}
      >
        <MpxInlineText>Boundary case</MpxInlineText>
      </MpxView>
    )

    let viewElement = screen.getByTestId('boundary-view')
    expect(viewElement).toBeTruthy()

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)

    rerender(
      <MpxView
        testID="boundary-view"
        enable-background={true}
        style={{
          backgroundImage: 'invalid-url',
          backgroundColor: 'invalid-color'
        }}
      >
        <MpxInlineText>Invalid properties</MpxInlineText>
      </MpxView>
    )

    viewElement = screen.getByTestId('boundary-view')
    expect(viewElement).toBeTruthy()
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('background use should be stable'))
    errorSpy.mockRestore()
  })

  it('should parse supported background-image values and report dropped gradients', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(jest.fn())
    const error = jest.spyOn(console, 'error').mockImplementation(jest.fn())

    try {
      expect(parseBgImage('url("https://example.com/a.png")')).toEqual({
        src: 'https://example.com/a.png',
        type: 'image'
      })
      expect(parseBgImage('linear-gradient(red 0% 50%, 25%, blue)')).toEqual({
        type: 'linear',
        linearInfo: {
          direction: '180deg',
          colors: ['red', 'red', 'blue'],
          locations: [0, 0.5, 1]
        }
      })
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('color hint'))

      expect(parseBgImage('linear-gradient(red, linear-gradient(blue, green))')).toEqual({})
      expect(error).toHaveBeenCalledWith(expect.stringContaining('多重渐变'))

      expect(parseBgImage('radial-gradient(red, blue)')).toEqual({})
      expect(error).toHaveBeenCalledWith(expect.stringContaining('仅支持 url(...) / linear-gradient(...)'))
    } finally {
      warn.mockRestore()
      error.mockRestore()
    }
  })

  it('should render layout-dependent linear gradient backgrounds', () => {
    render(
      <MpxView
        testID="layout-gradient-view"
        enable-background={true}
        style={{
          width: 200,
          height: 100,
          borderWidth: 4,
          borderRadius: 10,
          backgroundImage: 'linear-gradient(to bottom right, red 0%, blue 100%)',
          backgroundSize: ['50%', '100%'],
          backgroundPosition: ['center', 'center']
        }}
      >
        <MpxInlineText>Gradient with layout</MpxInlineText>
      </MpxView>
    )

    const backgroundView = layoutBackground(200, 100)
    const gradient = screen.getByTestId('linear-gradient')
    const gradientProps = gradient.props
    layoutBackground(200, 100)
    expect(screen.getByTestId('linear-gradient').props).toBe(gradientProps)
    expect(gradient.props.colors).toEqual(['red', 'blue'])
    expect(gradient.props.locations).toEqual([0, 1])
    expect(gradient.props.angle).toBeCloseTo(135)
    expect(gradient.props.style).toEqual(expect.objectContaining({
      width: '50%',
      height: '100%'
    }))
    expect(backgroundView.props.style).toEqual(expect.objectContaining({
      borderRadius: 6,
      overflow: 'hidden'
    }))
  })

  it('should resolve cover image background size and percent position after layout', async () => {
    render(
      <MpxView
        testID="layout-image-view"
        enable-background={true}
        enable-fast-image={true}
        style={{
          width: 300,
          height: 100,
          backgroundImage: 'url(https://example.com/cover.jpg)',
          backgroundSize: ['cover'],
          backgroundPosition: ['right', '25%']
        }}
      >
        <MpxInlineText>Image with layout</MpxInlineText>
      </MpxView>
    )

    layoutBackground(300, 100)
    await flushImageSize()
    const image = screen.getByTestId('fast-image')
    const imageProps = image.props
    layoutBackground(300, 100)
    expect(screen.getByTestId('fast-image').props).toBe(imageProps)

    expect(image.props.source).toEqual({
      uri: 'https://example.com/cover.jpg'
    })
    expect(image.props.style).toEqual(expect.objectContaining({
      width: 300,
      height: 300,
      right: 0,
      top: -50
    }))
  })

  it('should parse gradient interpolation and invalid color stop fallbacks', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(jest.fn())
    const error = jest.spyOn(console, 'error').mockImplementation(jest.fn())

    try {
      expect(parseBgImage('linear-gradient(100grad, red 0%, green, blue 100%)')).toEqual({
        type: 'linear',
        linearInfo: {
          direction: '100grad',
          colors: ['red', 'green', 'blue'],
          locations: [0, 0.5, 1]
        }
      })
      expect(parseBgImage('linear-gradient(red 10px, blue)')).toEqual({
        type: 'linear',
        linearInfo: {
          direction: '180deg',
          colors: ['red', 'blue'],
          locations: [0, 1]
        }
      })
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('色标位置仅支持百分比'))

      expect(parseBgImage('linear-gradient(30%, 40%)')).toEqual({})
      expect(error).toHaveBeenCalledWith(expect.stringContaining('至少需要 2 个有效色标'))
    } finally {
      warn.mockRestore()
      error.mockRestore()
    }
  })

  it('should normalize linear gradient angle units', () => {
    const cases = [
      { id: 'turn-gradient', image: 'linear-gradient(0.25turn, red, blue)', angle: 90 },
      { id: 'rad-gradient', image: 'linear-gradient(3.141592653589793rad, red, blue)', angle: 180 },
      { id: 'grad-gradient', image: 'linear-gradient(100grad, red, blue)', angle: 90 },
      { id: 'alias-gradient', image: 'linear-gradient(to right bottom, red, blue)', angle: 135 },
      { id: 'top-right-alias-gradient', image: 'linear-gradient(to right top, red, blue)', angle: 45 },
      { id: 'bottom-left-alias-gradient', image: 'linear-gradient(to left bottom, red, blue)', angle: 225 }
    ]

    cases.forEach(({ id, image, angle }) => {
      const { unmount } = render(
        <MpxView
          testID={id}
          enable-background={true}
          style={{
            width: 100,
            height: 100,
            backgroundImage: image,
            backgroundSize: [100, 100]
          }}
        >
          <MpxInlineText>{id}</MpxInlineText>
        </MpxView>
      )

      layoutBackgroundIfNeeded(100, 100)
      expect(screen.getByTestId('linear-gradient').props.angle).toBeCloseTo(angle)
      unmount()
    })
  })

  it('should resolve contain and auto image background sizing', async () => {
    const cases = [
      {
        id: 'contain-image',
        backgroundSize: ['contain'],
        layout: { width: 300, height: 100 },
        expectedStyle: { width: 100, height: 100 }
      },
      {
        id: 'auto-height-image',
        backgroundSize: ['auto', '50%'],
        layout: { width: 300, height: 200 },
        expectedStyle: { width: 100, height: 100 }
      },
      {
        id: 'auto-width-image',
        backgroundSize: ['50%', 'auto'],
        layout: { width: 300, height: 200 },
        expectedStyle: { width: 150, height: 150 }
      },
      {
        id: 'auto-auto-image',
        backgroundSize: ['auto', 'auto'],
        layout: { width: 300, height: 200 },
        expectedStyle: { width: 100, height: 100 }
      }
    ]

    for (const item of cases) {
      const { unmount } = render(
        <MpxView
          testID={item.id}
          enable-background={true}
          enable-fast-image={true}
          style={{
            width: item.layout.width,
            height: item.layout.height,
            backgroundImage: `url(https://example.com/${item.id}.jpg)`,
            backgroundSize: item.backgroundSize
          }}
        >
          <MpxInlineText>{item.id}</MpxInlineText>
        </MpxView>
      )

      layoutBackgroundIfNeeded(item.layout.width, item.layout.height)
      await flushImageSize()
      expect(screen.getByTestId('fast-image').props.style).toEqual(expect.objectContaining(item.expectedStyle))
      unmount()
    }
  })

  it('should reuse cached image dimensions and ignore stale image callbacks', () => {
    type ImageSizeCallback = (width: number, height: number) => void
    const getSize = Image.getSize as jest.Mock
    const defaultGetSize = getSize.getMockImplementation()
    const imageSizeCallbacks = new Map<string, ImageSizeCallback>()
    getSize.mockClear()
    getSize.mockImplementation((uri, success) => {
      imageSizeCallbacks.set(uri, success)
    })
    const renderImageView = (src?: string) => (
      <MpxView
        testID="cached-image-view"
        enable-background={true}
        enable-fast-image={true}
        style={src
          ? {
              backgroundImage: `url(https://example.com/${src}.jpg)`,
              backgroundSize: ['auto', 'auto']
            }
          : {}}
      />
    )

    try {
      const imageRender = render(renderImageView('cached'))
      act(() => {
        imageSizeCallbacks.get('https://example.com/cached.jpg')!(80, 40)
      })
      expect(screen.getByTestId('fast-image').props.style).toEqual(expect.objectContaining({ width: 80, height: 40 }))

      imageRender.rerender(renderImageView())
      imageRender.rerender(renderImageView('cached'))
      expect(screen.getByTestId('fast-image').props.style).toEqual(expect.objectContaining({ width: 80, height: 40 }))
      expect(getSize).toHaveBeenCalledTimes(1)

      imageRender.rerender(renderImageView('stale'))
      imageRender.rerender(renderImageView('latest'))
      act(() => {
        imageSizeCallbacks.get('https://example.com/latest.jpg')!(240, 120)
      })
      expect(screen.getByTestId('fast-image').props.source.uri).toContain('latest.jpg')
      expect(screen.getByTestId('fast-image').props.style).toEqual(expect.objectContaining({ width: 240, height: 120 }))

      act(() => {
        imageSizeCallbacks.get('https://example.com/stale.jpg')!(60, 30)
      })
      expect(screen.getByTestId('fast-image').props.style).toEqual(expect.objectContaining({ width: 240, height: 120 }))
      expect(getSize).toHaveBeenCalledTimes(3)
    } finally {
      getSize.mockImplementation(defaultGetSize)
    }
  })

  it('should clamp inherited inner background radii at zero', () => {
    render(
      <MpxView
        testID="inner-radius-view"
        enable-background={true}
        style={{
          borderWidth: 4,
          borderRadius: 2,
          backgroundImage: 'linear-gradient(red, blue)',
          backgroundSize: [100, 100]
        }}
      />
    )
    expect((screen.getByTestId('inner-radius-view').children[0] as any).props.style).toEqual(expect.objectContaining({
      borderRadius: 0,
      overflow: 'hidden'
    }))
  })

  it('should normalize numeric and three-part background positions', async () => {
    const cases = [
      {
        id: 'numeric-position',
        backgroundPosition: 5,
        expectedStyle: { left: 5, top: 45 }
      },
      {
        id: 'single-left-position',
        backgroundPosition: ['left'],
        expectedStyle: { left: 0, top: 45 }
      },
      {
        id: 'single-top-position',
        backgroundPosition: ['top'],
        expectedStyle: { left: 45, top: 0 }
      },
      {
        id: 'two-keyword-position',
        backgroundPosition: ['right', 'bottom'],
        expectedStyle: { right: 0, bottom: 0 }
      },
      {
        id: 'three-leading-keywords-position',
        backgroundPosition: ['left', 'bottom', 10],
        expectedStyle: { left: 0, bottom: 10 }
      },
      {
        id: 'three-keyword-position',
        backgroundPosition: ['bottom', 10, 'right'],
        expectedStyle: { bottom: 10, right: 0 }
      },
      {
        id: 'three-offset-position',
        backgroundPosition: ['right', 10, 'bottom'],
        expectedStyle: { right: 10, bottom: 0 }
      }
    ]

    for (const item of cases) {
      const { unmount } = render(
        <MpxView
          testID={item.id}
          enable-background={true}
          enable-fast-image={true}
          style={{
            width: 100,
            height: 100,
            backgroundImage: `url(https://example.com/${item.id}.jpg)`,
            backgroundSize: [10, 10],
            backgroundPosition: item.backgroundPosition as any
          }}
        >
          <MpxInlineText>{item.id}</MpxInlineText>
        </MpxView>
      )

      layoutBackgroundIfNeeded(100, 100)
      await flushImageSize()
      expect(screen.getByTestId('fast-image').props.style).toEqual(expect.objectContaining(item.expectedStyle))
      unmount()
    }
  })

  it('should record render performance scopes when enabled', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const perf = require('@mpxjs/perf')
    const runtimeGlobal = global as any
    perf.scopeStart.mockClear()
    perf.scopeEnd.mockClear()
    runtimeGlobal.__mpx_perf_framework__ = true

    try {
      render(<MpxView testID="perf-view" />)

      expect(perf.scopeStart.mock.calls.map(([name]: [string]) => name)).toEqual([
        'view:render:total',
        'view:render:props',
        'view:render:style',
        'view:render:innerProps',
        'view:render:createElement'
      ])
      expect(perf.scopeEnd).toHaveBeenCalledTimes(5)
    } finally {
      runtimeGlobal.__mpx_perf_framework__ = false
    }
  })
})
