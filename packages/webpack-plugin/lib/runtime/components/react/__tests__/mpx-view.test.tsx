import React from 'react'
import { render, screen } from '@testing-library/react-native'
import View from '../mpx-view'
import Text from '../mpx-text'

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

describe('MpxView', () => {
  it('should render basic view', () => {
    const { toJSON } = render(
      <View testID="basic-view">
        <Text>Basic View Content</Text>
      </View>
    )
    
    expect(screen.getByTestId('basic-view')).toBeTruthy()
    expect(screen.getByText('Basic View Content')).toBeTruthy()
    expect(toJSON()).toMatchSnapshot()
  })

  it('should apply custom styles', () => {
    const customStyle = { 
      backgroundColor: '#f0f0f0',
      padding: 20,
      flex: 1
    }
    
    const { toJSON } = render(
      <View style={customStyle} testID="styled-view">
        <Text>Styled Content</Text>
      </View>
    )
    
    const viewElement = screen.getByTestId('styled-view')
    expect(viewElement).toBeTruthy()
    expect(viewElement.props.style).toMatchObject(customStyle)
    expect(toJSON()).toMatchSnapshot()
  })

  it('should handle nested views', () => {
    const { toJSON } = render(
      <View testID="parent-view">
        <View testID="child-view-1">
          <Text>Child 1</Text>
        </View>
        <View testID="child-view-2">
          <Text>Child 2</Text>
        </View>
      </View>
    )
    
    expect(screen.getByTestId('parent-view')).toBeTruthy()
    expect(screen.getByTestId('child-view-1')).toBeTruthy()
    expect(screen.getByTestId('child-view-2')).toBeTruthy()
    expect(screen.getByText('Child 1')).toBeTruthy()
    expect(screen.getByText('Child 2')).toBeTruthy()
    expect(toJSON()).toMatchSnapshot()
  })

  it('should handle accessibility props', () => {
    render(
      <View 
        testID="accessible-view"
        accessibilityLabel="Main container"
        accessibilityHint="Contains important content"
        accessibilityRole="main"
      >
        <Text>Accessible Content</Text>
      </View>
    )
    
    const viewElement = screen.getByTestId('accessible-view')
    expect(viewElement).toBeTruthy()
    expect(viewElement.props.accessibilityLabel).toBe('Main container')
    expect(viewElement.props.accessibilityHint).toBe('Contains important content')
    expect(viewElement.props.accessibilityRole).toBe('main')
  })

  it('should handle complex nested structure', () => {
    const { toJSON } = render(
      <View testID="complex-structure" style={{ flex: 1 }}>
        <View testID="header" style={{ height: 50 }}>
          <Text>Header Content</Text>
        </View>
        <View testID="body" style={{ flex: 1 }}>
          <View testID="section-1">
            <Text>Section 1</Text>
          </View>
          <View testID="section-2">
            <Text>Section 2</Text>
          </View>
        </View>
        <View testID="footer" style={{ height: 50 }}>
          <Text>Footer Content</Text>
        </View>
      </View>
    )
    
    // 验证所有组件都能被找到
    expect(screen.getByTestId('complex-structure')).toBeTruthy()
    expect(screen.getByTestId('header')).toBeTruthy()
    expect(screen.getByTestId('body')).toBeTruthy()
    expect(screen.getByTestId('section-1')).toBeTruthy()
    expect(screen.getByTestId('section-2')).toBeTruthy()
    expect(screen.getByTestId('footer')).toBeTruthy()
    
    // 验证文本内容
    expect(screen.getByText('Header Content')).toBeTruthy()
    expect(screen.getByText('Section 1')).toBeTruthy()
    expect(screen.getByText('Section 2')).toBeTruthy()
    expect(screen.getByText('Footer Content')).toBeTruthy()
    expect(toJSON()).toMatchSnapshot()
  })

  it('should handle empty view', () => {
    render(<View testID="empty-view"></View>)
    
    const viewElement = screen.getByTestId('empty-view')
    expect(viewElement).toBeTruthy()
    expect(viewElement.children).toEqual([])
  })

  it('should handle view with single child', () => {
    render(
      <View testID="single-child-view">
        <Text>Only Child</Text>
      </View>
    )
    
    expect(screen.getByTestId('single-child-view')).toBeTruthy()
    expect(screen.getByText('Only Child')).toBeTruthy()
  })

  it('should handle view with multiple text children', () => {
    render(
      <View testID="multi-text-view">
        <Text>First Text</Text>
        <Text>Second Text</Text>
        <Text>Third Text</Text>
      </View>
    )
    
    expect(screen.getByTestId('multi-text-view')).toBeTruthy()
    expect(screen.getByText('First Text')).toBeTruthy()
    expect(screen.getByText('Second Text')).toBeTruthy()
    expect(screen.getByText('Third Text')).toBeTruthy()
  })
})
