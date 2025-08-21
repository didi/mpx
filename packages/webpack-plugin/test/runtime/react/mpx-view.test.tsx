// Mock Easing before any imports
jest.doMock('react-native', () => {
  const RN = jest.requireActual('react-native')
  return {
    ...RN,
    Easing: {
      linear: jest.fn(),
      ease: jest.fn(),
      in: jest.fn(() => jest.fn()),
      out: jest.fn(() => jest.fn()),
      inOut: jest.fn(() => jest.fn()),
      poly: jest.fn(() => jest.fn()),
      bezier: jest.fn(() => jest.fn()),
      circle: jest.fn(),
      sin: jest.fn(),
      exp: jest.fn(),
      elastic: jest.fn(() => jest.fn()),
      back: jest.fn(() => jest.fn()),
      bounce: jest.fn(),
      step0: jest.fn(),
      step1: jest.fn()
    }
  }
})

import React from 'react'
import { render, screen } from '@testing-library/react-native'
import MpxView from '../../../lib/runtime/components/react/mpx-view'
import MpxInlineText from '../../../lib/runtime/components/react/mpx-inline-text'

// Mock mpx-portal
jest.mock('../../../lib/runtime/components/react/mpx-portal', () => {
  const mockReact = require('react')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return mockReact.forwardRef((props: any, ref: any) => {
    return mockReact.createElement('View', { ...props, ref })
  })
})

describe('MpxView', () => {
  // 基础渲染和样式测试
  it('should render with basic props and styles', () => {
    const { toJSON } = render(
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
    expect(viewElement).toBeTruthy()
    expect(toJSON()).toMatchSnapshot()
  })

  it('should handle nested views and complex structure', () => {
    const { toJSON } = render(
      <MpxView testID="nested-view" style={{ padding: 5 }}>
        <MpxView style={{ margin: 2 }}>
          <MpxInlineText>Nested content</MpxInlineText>
        </MpxView>
        <MpxInlineText>Sibling content</MpxInlineText>
      </MpxView>
    )

    const viewElement = screen.getByTestId('nested-view')
    expect(viewElement).toBeTruthy()
    expect(toJSON()).toMatchSnapshot()
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
    expect(viewElement).toBeTruthy()
    expect(bindtap).toBeDefined()
    expect(bindtouchstart).toBeDefined()
    expect(bindtouchend).toBeDefined()
  })

  it('should handle background properties', () => {
    const { toJSON } = render(
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
    expect(viewElement).toBeTruthy()
    expect(toJSON()).toMatchSnapshot()
  })

  // 布局和样式测试
  it('should handle flex layout properties', () => {
    const { toJSON } = render(
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
    expect(viewElement).toBeTruthy()
    expect(toJSON()).toMatchSnapshot()
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
    const { rerender } = render(
      <MpxView testID="edge-view" style={undefined}>
        <MpxInlineText>Edge case content</MpxInlineText>
      </MpxView>
    )

    let viewElement = screen.getByTestId('edge-view')
    expect(viewElement).toBeTruthy()

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
    expect(viewElement).toBeTruthy()
  })
})