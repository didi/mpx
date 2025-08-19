import React from 'react'
import { render } from '@testing-library/react-native'
import renderer from 'react-test-renderer'

// Mock MPX utilities（这些是必须的，因为它们不是标准 RN 组件）
jest.mock('@mpxjs/utils', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  isFunction: jest.fn(() => true),
}))

jest.mock('../utils', () => ({
  parseUrl: jest.fn(() => 'parsed-url'),
  PERCENT_REGEX: /\d+%/,
  splitStyle: jest.fn(() => ({ style: {}, transformStyle: {} })),
  splitProps: jest.fn(() => ({ props: {}, transformProps: {} })),
  useTransformStyle: jest.fn(() => ({})),
  useHover: jest.fn(() => ({
    isHover: false,
    gesture: {}
  })),
  wrapChildren: jest.fn((children) => children),
  useLayout: jest.fn(() => ({
    onLayout: jest.fn(),
    layoutRef: { current: null }
  })),
  extendObject: jest.fn((obj) => obj)
}))

// Import the component after mocks
const MpxView = require('../mpx-view.tsx').default

describe('MpxView - Minimal RN Testing (Industry Standard)', () => {
  it('renders correctly with react-test-renderer', () => {
    const tree = renderer.create(<MpxView />).toJSON()
    expect(tree).toBeTruthy()
    expect(tree).toMatchSnapshot()
  })

  it('renders with children', () => {
    const tree = renderer.create(
      <MpxView>
        <MpxView testID="child" />
      </MpxView>
    ).toJSON()
    expect(tree).toBeTruthy()
    expect(tree).toMatchSnapshot()
  })

  it('passes props correctly', () => {
    const tree = renderer.create(
      <MpxView 
        testID="test-view"
        style={{ backgroundColor: 'red' }}
        accessible={true}
      />
    ).toJSON()
    expect(tree).toBeTruthy()
    expect(tree).toMatchSnapshot()
  })

  // Testing Library 测试（推荐用于交互测试）
  it('can be found by testID using Testing Library', () => {
    const { getByTestId } = render(
      <MpxView testID="findable-view" />
    )
    expect(getByTestId('findable-view')).toBeTruthy()
  })

  it('handles style props', () => {
    const testStyle = { backgroundColor: 'blue', padding: 10 }
    const { getByTestId } = render(
      <MpxView testID="styled-view" style={testStyle} />
    )
    const element = getByTestId('styled-view')
    expect(element).toBeTruthy()
    // 注意：style 的具体验证取决于组件的实现
  })

  it('handles accessibility props', () => {
    const { getByTestId } = render(
      <MpxView 
        testID="accessible-view"
        accessible={true}
        accessibilityLabel="Test view"
        accessibilityRole="button"
      />
    )
    const element = getByTestId('accessible-view')
    expect(element).toBeTruthy()
    expect(element.props.accessible).toBe(true)
    expect(element.props.accessibilityLabel).toBe('Test view')
  })
})
