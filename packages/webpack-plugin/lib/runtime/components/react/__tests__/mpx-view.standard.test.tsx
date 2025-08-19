import React from 'react'
import { render } from '@testing-library/react-native'
import renderer from 'react-test-renderer'

// Mock MPX utilities
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

describe('MpxView - Standard RN Testing', () => {
  it('renders correctly', () => {
    const tree = renderer.create(<MpxView />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  it('renders with children', () => {
    const tree = renderer.create(
      <MpxView>
        <MpxView testID="child" />
      </MpxView>
    ).toJSON()
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
    expect(tree).toMatchSnapshot()
  })

  // Testing Library 测试
  it('can be found by testID using Testing Library', () => {
    const { getByTestId } = render(
      <MpxView testID="findable-view" />
    )
    expect(getByTestId('findable-view')).toBeTruthy()
  })

  it('renders children correctly with Testing Library', () => {
    const { getByText } = render(
      <MpxView>
        <MpxView testID="text-container">Test Content</MpxView>
      </MpxView>
    )
    // 注意：这里可能需要调整，取决于组件的实际实现
    expect(getByText('Test Content')).toBeTruthy()
  })
})
