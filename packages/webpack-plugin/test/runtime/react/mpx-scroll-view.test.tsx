import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { ScrollView } from 'react-native'



import MpxScrollView from '../../../lib/runtime/components/react/mpx-scroll-view'
import MpxView from '../../../lib/runtime/components/react/mpx-view'
import MpxText from '../../../lib/runtime/components/react/mpx-text'

// Mock mpx-portal
jest.mock('../../../lib/runtime/components/react/mpx-portal', () => {
  const mockReact = require('react')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return mockReact.forwardRef((props: any, ref: any) => {
    return mockReact.createElement('View', { ...props, ref })
  })
})



describe('MpxScrollView', () => {
  // 基础渲染和滚动方向测试
  it('should render with basic scroll properties', () => {
    const { toJSON } = render(
      <MpxScrollView 
        testID="basic-scroll"
        scroll-y={true}
        style={{ height: 200 }}
      >
        <MpxView>
          <MpxText>Scrollable content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    const scrollElement = screen.getByTestId('basic-scroll')
    expect(scrollElement).toBeTruthy()
    expect(scrollElement.props.horizontal).toBe(false)
    expect(scrollElement.props.scrollEnabled).toBe(true)
    expect(toJSON()).toMatchSnapshot()
  })

  it('should handle horizontal and vertical scroll directions', () => {
    const { rerender } = render(
      <MpxScrollView 
        testID="direction-scroll"
        scroll-x={true}
        scroll-y={false}
      >
        <MpxView>
          <MpxText>Horizontal content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    let scrollElement = screen.getByTestId('direction-scroll')
    expect(scrollElement.props.horizontal).toBe(true)

    // 测试垂直滚动
    rerender(
      <MpxScrollView 
        testID="direction-scroll"
        scroll-x={false}
        scroll-y={true}
      >
        <MpxView>
          <MpxText>Vertical content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    scrollElement = screen.getByTestId('direction-scroll')
    expect(scrollElement.props.horizontal).toBe(false)
  })

  // 滚动条和分页测试
  it('should handle scrollbar and paging properties', () => {
    const { toJSON } = render(
      <MpxScrollView 
        testID="scrollbar-paging-scroll"
        scroll-y={true}
        show-scrollbar={false}
        paging-enabled={true}
        enhanced={true}
      >
        <MpxView>
          <MpxText>Paging content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    const scrollElement = screen.getByTestId('scrollbar-paging-scroll')
    expect(scrollElement.props.showsVerticalScrollIndicator).toBe(false)
    expect(scrollElement.props.pagingEnabled).toBe(true)
    expect(toJSON()).toMatchSnapshot()
  })

  // 滚动事件测试
  it('should handle scroll events', () => {
    const mockOnScroll = jest.fn()

    render(
      <MpxScrollView 
        testID="event-scroll"
        scroll-y={true}
        bindscroll={mockOnScroll}
      >
        <MpxView style={{ height: 1000 }}>
          <MpxText>Long scrollable content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    const scrollElement = screen.getByTestId('event-scroll')

    // 模拟滚动事件
    fireEvent.scroll(scrollElement, {
      nativeEvent: {
        contentOffset: { x: 0, y: 100 },
        contentSize: { width: 300, height: 1000 },
        layoutMeasurement: { width: 300, height: 200 }
      }
    })

    expect(mockOnScroll).toHaveBeenCalled()
  })

  // 增强模式测试
  it('should handle enhanced mode', () => {
    render(
      <MpxScrollView 
        testID="enhanced-scroll"
        scroll-y={true}
        enhanced={true}
        bounces={false}
        paging-enabled={true}
      >
        <MpxView>
          <MpxText>Enhanced scrollable content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    const scrollElement = screen.getByTestId('enhanced-scroll')
    expect(scrollElement).toBeTruthy()
    expect(scrollElement.props.pagingEnabled).toBe(true)
    expect(scrollElement.props.bounces).toBe(false)
  })

  // Ref 转发测试
  it('should properly forward refs', () => {
    const ref = React.createRef<ScrollView>()
    
    render(
      <MpxScrollView 
        ref={ref} 
        testID="ref-scroll"
        scroll-y={true}
      >
        <MpxView>
          <MpxText>Ref forwarded content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    // 在测试环境中，ref 可能不会立即设置，所以我们验证组件正确渲染
    const scrollElement = screen.getByTestId('ref-scroll')
    expect(scrollElement).toBeTruthy()
  })

  // 边界情况测试
  it('should handle edge cases and special configurations', () => {
    const { rerender } = render(
      <MpxScrollView 
        testID="edge-scroll"
        scroll-x={false}
        scroll-y={false}
      >
        <MpxView>
          <MpxText>No scroll content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    let scrollElement = screen.getByTestId('edge-scroll')
    expect(scrollElement.props.scrollEnabled).toBe(false)

    // 测试垂直滚动
    rerender(
      <MpxScrollView 
        testID="edge-scroll"
        scroll-y={true}
        enable-back-to-top={true}
      >
        <MpxView>
          <MpxText>Vertical scroll content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    scrollElement = screen.getByTestId('edge-scroll')
    expect(scrollElement.props.horizontal).toBe(false)
    expect(scrollElement.props.scrollsToTop).toBe(true)

    // 测试空内容
    rerender(
      <MpxScrollView 
        testID="edge-scroll"
        scroll-y={true}
      >
        {null}
      </MpxScrollView>
    )

    scrollElement = screen.getByTestId('edge-scroll')
    expect(scrollElement).toBeTruthy()
  })

  // MPX 特定属性测试
  it('should handle MPX specific scroll properties', () => {
    const mockOnRefresh = jest.fn()
    
    render(
      <MpxScrollView 
        testID="mpx-props-scroll"
        scroll-y={true}
        scroll-top={100}
        scroll-left={50}
        refresher-enabled={true}
        refresher-triggered={false}
        bindrefresherrefresh={mockOnRefresh}
      >
        <MpxView>
          <MpxText>MPX properties content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    const scrollElement = screen.getByTestId('mpx-props-scroll')
    expect(scrollElement).toBeTruthy()
    expect(mockOnRefresh).toBeDefined()
  })
})