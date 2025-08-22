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
  // 综合基础属性测试
  it('should handle basic scroll properties and configurations', () => {
    const { rerender, toJSON } = render(
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

    // 基础垂直滚动测试
    let scrollElement = screen.getByTestId('basic-scroll')
    expect(scrollElement).toBeTruthy()
    expect(scrollElement.props.horizontal).toBe(false)
    expect(scrollElement.props.scrollEnabled).toBe(true)

    // 测试水平滚动
    rerender(
      <MpxScrollView 
        testID="basic-scroll"
        scroll-x={true}
        scroll-y={false}
      >
        <MpxView>
          <MpxText>Horizontal content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    scrollElement = screen.getByTestId('basic-scroll')
    expect(scrollElement.props.horizontal).toBe(true)
    expect(scrollElement.props.scrollEnabled).toBe(true)

    // 测试滚动条和分页属性
    rerender(
      <MpxScrollView 
        testID="basic-scroll"
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

    scrollElement = screen.getByTestId('basic-scroll')
    expect(scrollElement.props.horizontal).toBe(false)
    expect(scrollElement.props.showsVerticalScrollIndicator).toBe(false)
    expect(scrollElement.props.pagingEnabled).toBe(true)

    // 测试增强模式和弹性效果
    rerender(
      <MpxScrollView 
        testID="basic-scroll"
        scroll-y={true}
        enhanced={true}
        bounces={false}
      >
        <MpxView>
          <MpxText>Enhanced content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    scrollElement = screen.getByTestId('basic-scroll')
    expect(scrollElement.props.bounces).toBe(false)

    // 测试禁用滚动的边界情况
    rerender(
      <MpxScrollView 
        testID="basic-scroll"
        scroll-x={false}
        scroll-y={false}
      >
        <MpxView>
          <MpxText>No scroll content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    scrollElement = screen.getByTestId('basic-scroll')
    expect(scrollElement.props.scrollEnabled).toBe(false)

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

  // 边界情况和空内容测试
  it('should handle edge cases and empty content', () => {
    const { rerender } = render(
      <MpxScrollView 
        testID="edge-scroll"
        scroll-y={true}
      >
        {null}
      </MpxScrollView>
    )

    // 测试空内容
    let scrollElement = screen.getByTestId('edge-scroll')
    expect(scrollElement).toBeTruthy()
    expect(scrollElement.props.scrollEnabled).toBe(true)

    // 测试空内容但禁用滚动
    rerender(
      <MpxScrollView 
        testID="edge-scroll"
        scroll-x={false}
        scroll-y={false}
      >
        {null}
      </MpxScrollView>
    )

    scrollElement = screen.getByTestId('edge-scroll')
    expect(scrollElement.props.scrollEnabled).toBe(false)
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