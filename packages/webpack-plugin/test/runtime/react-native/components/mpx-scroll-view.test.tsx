import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react-native'
import { Animated } from 'react-native'

import MpxScrollView from '../../../../lib/runtime/components/react/mpx-scroll-view'
import MpxView from '../../../../lib/runtime/components/react/mpx-view'
import MpxText from '../../../../lib/runtime/components/react/mpx-text'
import { IntersectionObserverContext } from '../../../../lib/runtime/components/react/context'
import { createTouchEvent } from './helpers'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { __getLastPanGesture, __getLastScrollViewRef, __resetScrollViewRefs } = require('react-native-gesture-handler')

const createScrollEvent = (x = 0, y = 0, contentWidth = 300, contentHeight = 1000, layoutWidth = 300, layoutHeight = 400) => ({
  nativeEvent: {
    contentOffset: { x, y },
    contentSize: { width: contentWidth, height: contentHeight },
    layoutMeasurement: { width: layoutWidth, height: layoutHeight }
  }
})

const mockPortal = jest.fn()

// Mock mpx-portal
jest.mock('../../../../lib/runtime/components/react/mpx-portal', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mockReact = require('react')
  return mockReact.forwardRef((props: any, ref: any) => {
    mockPortal(props)
    return mockReact.createElement('View', { ...props, ref, testID: 'mock-portal' })
  })
})

describe('MpxScrollView', () => {
  beforeEach(() => {
    mockPortal.mockClear()
    __resetScrollViewRefs()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  // 基础滚动功能和属性测试
  it('should handle basic scroll properties and events', () => {
    const mockScroll = jest.fn()
    const mockScrollToUpper = jest.fn()
    const mockScrollToLower = jest.fn()

    const { rerender } = render(
      <MpxScrollView
        testID="basic-scroll"
        scroll-y={true}
        upper-threshold={20}
        lower-threshold={30}
        bindscroll={mockScroll}
        bindscrolltoupper={mockScrollToUpper}
        bindscrolltolower={mockScrollToLower}
        style={{ height: 200 }}
      >
        <MpxView style={{ height: 600 }}>
          <MpxText>Scrollable content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    const scrollElement = screen.getByTestId('basic-scroll')
    expect(scrollElement).toBeTruthy()
    expect(scrollElement.props.horizontal).toBe(false)

    // 测试滚动事件
    fireEvent.scroll(scrollElement, {
      nativeEvent: {
        contentOffset: { x: 0, y: 100 },
        contentSize: { width: 300, height: 600 },
        layoutMeasurement: { width: 300, height: 200 }
      }
    })
    expect(mockScroll).toHaveBeenCalled()

    // 测试水平滚动
    rerender(
      <MpxScrollView
        testID="basic-scroll"
        scroll-x={true}
        scroll-y={false}
        style={{ flex: 1 }}
      >
        <MpxView style={{ width: 800 }}>
          <MpxText>Horizontal content</MpxText>
        </MpxView>
      </MpxScrollView>
    )
    const horizontalScroll = screen.getByTestId('basic-scroll')
    expect(horizontalScroll.props.horizontal).toBe(true)
    expect(horizontalScroll.props.style).toEqual(expect.objectContaining({ flex: 1 }))
    expect(horizontalScroll.props.style).not.toHaveProperty('flexGrow')
  })

  it('should emit scrollend with the final scroll metrics', () => {
    const bindscrollend = jest.fn()

    render(
      <MpxScrollView
        testID="scrollend-view"
        scroll-y={true}
        bindscrollend={bindscrollend}
      >
        <MpxView style={{ height: 800 }} />
      </MpxScrollView>
    )

    fireEvent(
      screen.getByTestId('scrollend-view'),
      'onMomentumScrollEnd',
      createScrollEvent(12, 34, 320, 960, 300, 400)
    )

    expect(bindscrollend).toHaveBeenCalledWith(expect.objectContaining({
      type: 'scrollend',
      detail: {
        scrollLeft: 12,
        scrollTop: 34,
        scrollHeight: 960,
        scrollWidth: 320,
        layoutMeasurement: { width: 300, height: 400 }
      }
    }))
  })

  // MPX特定属性和警告测试
  it('should handle MPX specific properties and warnings', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    try {
      render(
        <MpxScrollView
          testID="mpx-props"
          scroll-x={true}
          scroll-y={true}
          scroll-top={100}
          scroll-left={50}
          refresher-enabled={true}
        >
          <MpxView>
            <MpxText>Content with conflicting scroll directions</MpxText>
          </MpxView>
        </MpxScrollView>
      )

      const scrollElement = screen.getByTestId('mpx-props')
      expect(scrollElement.props.horizontal).toBe(false)
      expect(scrollElement.props.refreshControl).toBeTruthy()
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('scroll-x and scroll-y cannot be set to true at the same time'))
    } finally {
      warnSpy.mockRestore()
    }
  })

  // 下拉刷新功能测试
  it('should handle refresher functionality comprehensively', () => {
    const mockRefresherRefresh = jest.fn()

    const { rerender } = render(
      <MpxScrollView
        testID="refresher-scroll"
        enhanced={true}
        scroll-y={true}
        refresher-enabled={true}
        refresher-triggered={false}
        refresher-threshold={80}
        bindrefresherrefresh={mockRefresherRefresh}
      >
        <MpxView slot="refresher" style={{ height: 60 }}>
          <MpxText>Pull to refresh</MpxText>
        </MpxView>
        <MpxView style={{ height: 800 }}>
          <MpxText>Main content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    const scrollElement = screen.getByTestId('refresher-scroll')

    // 设置refresher高度
    fireEvent(scrollElement.children[0], 'onLayout', {
      nativeEvent: { layout: { height: 60 } }
    })

    const panGesture = __getLastPanGesture()
    act(() => {
      panGesture.onUpdateCallback({ translationY: 70, velocityY: 0 })
      panGesture.onEndCallback({ translationY: 70, velocityY: 0 })
    })

    expect(mockRefresherRefresh).toHaveBeenCalledWith(expect.objectContaining({
      type: 'refresherrefresh'
    }))

    // 测试刷新状态变化
    rerender(
      <MpxScrollView
        testID="refresher-scroll"
        enhanced={true}
        scroll-y={true}
        refresher-enabled={true}
        refresher-triggered={true}
        bindrefresherrefresh={mockRefresherRefresh}
      >
        <MpxView slot="refresher" style={{ height: 60 }}>
          <MpxText>Refreshing...</MpxText>
        </MpxView>
        <MpxView style={{ height: 800 }}>
          <MpxText>Main content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    expect(screen.getByText('Refreshing...')).toBeTruthy()
  })

  // 滚动位置控制和scroll-into-view测试
  it('should handle scroll position controls and scroll-into-view', () => {
    jest.useFakeTimers()
    const mockSelectRef = jest.fn(() => ({
      getNodeInstance: () => ({
        nodeRef: {
          current: {
            measureLayout: jest.fn((parent, callback) => {
              // eslint-disable-next-line node/no-callback-literal
              callback(100, 200)
            })
          }
        }
      })
    }))

    const { rerender } = render(
      <MpxScrollView
        testID="position-scroll"
        scroll-y={true}
        scroll-top={100}
        scroll-left={50}
        scroll-with-animation={true}
        __selectRef={mockSelectRef}
      >
        <MpxView id="item1" style={{ height: 200 }}>
          <MpxText>Item 1</MpxText>
        </MpxView>
        <MpxView id="item2" style={{ height: 200 }}>
          <MpxText>Item 2</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    act(() => {
      jest.runOnlyPendingTimers()
    })
    const scrollViewRef = __getLastScrollViewRef()
    expect(scrollViewRef.scrollTo).toHaveBeenCalledWith({
      x: 50,
      y: 100,
      animated: true
    })
    scrollViewRef.scrollTo.mockClear()

    // 测试scroll-into-view
    rerender(
      <MpxScrollView
        testID="position-scroll"
        scroll-y={true}
        scroll-into-view="item2"
        scroll-into-view-offset={10}
        __selectRef={mockSelectRef}
      >
        <MpxView id="item1" style={{ height: 200 }}>
          <MpxText>Item 1</MpxText>
        </MpxView>
        <MpxView id="item2" style={{ height: 200 }}>
          <MpxText>Item 2</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    act(() => {
      jest.runOnlyPendingTimers()
    })
    expect(mockSelectRef).toHaveBeenCalledWith('#item2', 'node')
    expect(scrollViewRef.scrollTo).toHaveBeenCalledWith({
      x: 100,
      y: 210,
      animated: false
    })
  })

  // Portal渲染测试
  it('should render in Portal when position is fixed', () => {
    render(
      <MpxScrollView
        testID="portal-scroll"
        style={{ position: 'fixed' }}
      >
        <MpxView>
          <MpxText>Fixed positioned content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    expect(screen.getByTestId('portal-scroll')).toBeTruthy()
    expect(screen.getByTestId('mock-portal')).toBeTruthy()
    expect(mockPortal).toHaveBeenCalledWith(expect.objectContaining({
      children: expect.objectContaining({
        props: expect.objectContaining({
          testID: 'portal-scroll'
        })
      })
    }))
  })

  // 阈值事件测试
  it('should handle threshold events', () => {
    const mockScrollToUpper = jest.fn()
    const mockScrollToLower = jest.fn()
    const mockScroll = jest.fn()

    render(
      <MpxScrollView
        testID="threshold-scroll"
        scroll-y={true}
        upper-threshold={20}
        lower-threshold={20}
        bindscroll={mockScroll}
        bindscrolltoupper={mockScrollToUpper}
        bindscrolltolower={mockScrollToLower}
        style={{ height: 400 }}
      >
        <MpxView style={{ height: 800 }}>
          <MpxText>Threshold content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    const scrollElement = screen.getByTestId('threshold-scroll')

    // 先远离顶部，再回到 upper threshold 内，才能覆盖向上滚动触发逻辑
    fireEvent.scroll(scrollElement, {
      nativeEvent: {
        contentOffset: { x: 0, y: 100 },
        contentSize: { width: 300, height: 800 },
        layoutMeasurement: { width: 300, height: 400 }
      }
    })

    fireEvent.scroll(scrollElement, {
      nativeEvent: {
        contentOffset: { x: 0, y: 15 }, // 小于upper-threshold 20
        contentSize: { width: 300, height: 800 },
        layoutMeasurement: { width: 300, height: 400 }
      }
    })

    // 测试lower threshold (距底部小于threshold)
    fireEvent.scroll(scrollElement, {
      nativeEvent: {
        contentOffset: { x: 0, y: 385 }, // 800-400-15=385，距底部15小于lower-threshold 20
        contentSize: { width: 300, height: 800 },
        layoutMeasurement: { width: 300, height: 400 }
      }
    })

    expect(mockScrollToUpper).toHaveBeenCalledWith(expect.objectContaining({
      type: 'scrolltoupper',
      detail: expect.objectContaining({ direction: 'top' })
    }))
    expect(mockScrollToLower).toHaveBeenCalledWith(expect.objectContaining({
      type: 'scrolltolower',
      detail: expect.objectContaining({ direction: 'bottom' })
    }))
    expect(mockScroll).toHaveBeenCalledTimes(3)
  })

  // 交叉观察器测试
  it('should handle intersection observer functionality', () => {
    const throttleMeasure = jest.fn()
    render(
      <IntersectionObserverContext.Provider value={{ observer: { throttleMeasure } }}>
        <MpxScrollView
          testID="intersection-scroll"
          scroll-y={true}
          enable-trigger-intersection-observer={true}
        >
          <MpxView style={{ height: 1000 }}>
            <MpxText>Intersection content</MpxText>
          </MpxView>
        </MpxScrollView>
      </IntersectionObserverContext.Provider>
    )

    const scrollElement = screen.getByTestId('intersection-scroll')
    fireEvent.scroll(scrollElement, createScrollEvent(0, 200))
    expect(throttleMeasure).toHaveBeenCalled()
  })

  // 边界情况和错误处理测试
  it('should handle edge cases and error scenarios', () => {
    const mockRefresherRefresh = jest.fn()
    const { rerender } = render(
      <MpxScrollView testID="edge-scroll">
        {/* 空内容 */}
      </MpxScrollView>
    )

    expect(screen.getByTestId('edge-scroll')).toBeTruthy()

    // 测试undefined refresherTriggered的特殊逻辑
    rerender(
      <MpxScrollView
        testID="edge-scroll"
        enhanced={true}
        refresher-enabled={true}
        refresher-triggered={undefined}
        bindrefresherrefresh={mockRefresherRefresh}
      >
        <MpxView slot="refresher" style={{ height: 60 }}>
          <MpxText>Custom refresher</MpxText>
        </MpxView>
        <MpxView style={{ height: 800 }}>
          <MpxText>Main content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    const scrollElement = screen.getByTestId('edge-scroll')

    // 设置refresher高度并触发手势
    fireEvent(scrollElement.children[0], 'onLayout', {
      nativeEvent: { layout: { height: 60 } }
    })

    const panGesture = __getLastPanGesture()
    act(() => {
      panGesture.onUpdateCallback({ translationY: 70, velocityY: 0 })
      panGesture.onEndCallback({ translationY: 70, velocityY: 0 })
    })

    expect(mockRefresherRefresh).toHaveBeenCalledWith(expect.objectContaining({
      type: 'refresherrefresh'
    }))
  })

  // Refs转发测试
  it('should properly forward refs', () => {
    const ref = React.createRef()

    render(
      <MpxScrollView ref={ref} testID="ref-scroll">
        <MpxView>
          <MpxText>Ref content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    expect(ref.current).toBeTruthy()
    expect(screen.getByTestId('ref-scroll')).toBeTruthy()
  })

  // 性能和布局相关测试
  it('should handle layout changes and performance scenarios', () => {
    const mockScroll = jest.fn()
    const ref = React.createRef<any>()

    const { rerender } = render(
      <MpxScrollView
        ref={ref}
        testID="performance-scroll"
        scroll-y={true}
        bindscroll={mockScroll}
        style={{ height: 300 }}
      >
        <MpxView style={{ height: 600 }}>
          <MpxText>Performance content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    const scrollElement = screen.getByTestId('performance-scroll')

    // 测试布局变化
    scrollElement.props.onLayout({
      nativeEvent: {
        layout: { width: 300, height: 300 }
      }
    })

    // 测试内容尺寸变化
    scrollElement.props.onContentSizeChange(300, 800)
    expect(ref.current.getNodeInstance().instance.scrollOffset.current).toEqual(expect.objectContaining({
      contentLength: 800,
      visibleLength: 300
    }))

    // 测试动态内容变化
    rerender(
      <MpxScrollView
        ref={ref}
        testID="performance-scroll"
        scroll-y={true}
        bindscroll={mockScroll}
        style={{ height: 300 }}
      >
        <MpxView style={{ height: 1200 }}>
          <MpxText>Updated content with more height</MpxText>
          <MpxText>Additional content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    screen.getByTestId('performance-scroll').props.onContentSizeChange(300, 1200)
    expect(ref.current.getNodeInstance().instance.scrollOffset.current.contentLength).toBe(1200)
    expect(mockScroll).not.toHaveBeenCalled()
  })

  // 关键分支覆盖测试
  it('should handle specific uncovered branches', () => {
    const mockRefresherRefresh = jest.fn()
    const mockScroll = jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { withTiming } = require('react-native-reanimated')

    render(
      <MpxScrollView
        testID="branch-scroll"
        enhanced={true}
        scroll-y={true}
        bounces={true}
        refresher-enabled={true}
        refresher-triggered={undefined}
        bindscroll={mockScroll}
        bindrefresherrefresh={mockRefresherRefresh}
      >
        <MpxView slot="refresher" style={{ height: 60 }}>
          <MpxText>Custom refresher</MpxText>
        </MpxView>
        <MpxView style={{ height: 1000 }}>
          <MpxText>Branch test content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    const scrollElement = screen.getByTestId('branch-scroll')

    // 设置refresher高度并测试firstScrollIntoViewChange分支
    fireEvent(scrollElement.children[0], 'onLayout', {
      nativeEvent: { layout: { height: 60 } }
    })

    // 测试scrollHandler listener (485行)
    fireEvent(scrollElement, 'onScroll', {
      nativeEvent: {
        contentOffset: { x: 0, y: 150 },
        contentSize: { width: 300, height: 1000 },
        layoutMeasurement: { width: 300, height: 400 }
      }
    })
    expect(mockScroll).toHaveBeenCalledWith(expect.objectContaining({
      detail: {
        scrollLeft: 0,
        scrollTop: 150,
        scrollHeight: 1000,
        scrollWidth: 300,
        deltaX: 0,
        deltaY: 150,
        layoutMeasurement: { width: 300, height: 400 }
      }
    }))

    fireEvent(scrollElement, 'onScroll', {
      nativeEvent: {
        contentOffset: { x: 0, y: 0 },
        contentSize: { width: 300, height: 1000 },
        layoutMeasurement: { width: 300, height: 400 }
      }
    })

    const panGesture = __getLastPanGesture()
    withTiming.mockClear()
    act(() => {
      panGesture.onUpdateCallback({ translationY: 50, velocityY: 100 })
      panGesture.onUpdateCallback({ translationY: -30, velocityY: -50 })
      panGesture.onUpdateCallback({ translationY: 80, velocityY: 0 })
      panGesture.onEndCallback({ translationY: 80, velocityY: 0 })
    })

    expect(mockRefresherRefresh).toHaveBeenCalled()
    expect(withTiming).toHaveBeenCalledWith(60)
  })

  it('should update bounce and scroll states before triggering refresh', () => {
    const mockRefresherRefresh = jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { withTiming } = require('react-native-reanimated')

    render(
      <MpxScrollView
        testID="complex-gesture"
        enhanced={true}
        scroll-y={true}
        bounces={true}
        refresher-enabled={true}
        refresher-threshold={80}
        bindrefresherrefresh={mockRefresherRefresh}
      >
        <MpxView slot="refresher" style={{ height: 100 }}>
          <MpxText>Pull to refresh</MpxText>
        </MpxView>
        <MpxView style={{ height: 1200 }}>
          <MpxText>Complex gesture content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    const scrollElement = screen.getByTestId('complex-gesture')

    // 设置refresher高度
    fireEvent(scrollElement.children[0], 'onLayout', {
      nativeEvent: { layout: { height: 100 } }
    })

    const panGesture = __getLastPanGesture()
    act(() => {
      panGesture.onUpdateCallback({ translationY: 30, velocityY: 0 })
    })
    expect(screen.getByTestId('complex-gesture').props.bounces).toBe(false)
    expect(screen.getByTestId('complex-gesture').props.scrollEnabled).toBe(false)

    withTiming.mockClear()
    act(() => {
      panGesture.onUpdateCallback({ translationY: -20, velocityY: 0 })
      panGesture.onEndCallback({ translationY: -20, velocityY: 0 })
    })
    expect(screen.getByTestId('complex-gesture').props.bounces).toBe(true)
    expect(screen.getByTestId('complex-gesture').props.scrollEnabled).toBe(true)
    expect(withTiming).toHaveBeenCalledWith(0)

    withTiming.mockClear()
    act(() => {
      panGesture.onUpdateCallback({ translationY: 105, velocityY: 0 })
      panGesture.onEndCallback({ translationY: 105, velocityY: 0 })
    })
    expect(withTiming).toHaveBeenCalledWith(100)
    expect(mockRefresherRefresh).toHaveBeenCalledWith(expect.objectContaining({
      type: 'refresherrefresh'
    }))
  })

  // 测试 firstScrollIntoViewChange 分支 (272-277)
  it('should handle first scrollIntoView change with setTimeout', () => {
    jest.useFakeTimers()
    const mockSelectRef = jest.fn(() => ({
      getNodeInstance: () => ({
        nodeRef: {
          current: {
            measureLayout: jest.fn((parent, callback) => {
              // eslint-disable-next-line node/no-callback-literal
              callback(0, 300) // 模拟元素位置
            })
          }
        }
      })
    }))

    try {
      render(
        <MpxScrollView
          testID="first-scroll-into-view"
          scroll-y={true}
          scroll-into-view="item2"
          scroll-into-view-offset={20}
          scroll-with-animation={true}
          __selectRef={mockSelectRef}
        >
          <MpxView id="item1" style={{ height: 200 }}>
            <MpxText>Item 1</MpxText>
          </MpxView>
          <MpxView id="item2" style={{ height: 300 }}>
            <MpxText>Item 2</MpxText>
          </MpxView>
        </MpxScrollView>
      )

      expect(mockSelectRef).not.toHaveBeenCalled()

      act(() => {
        jest.runOnlyPendingTimers()
      })

      expect(mockSelectRef).toHaveBeenCalledWith('#item2', 'node')
    } finally {
      jest.useRealTimers()
    }
  })

  // 测试 scrollTo 和 handleScrollIntoView 函数 (300-312)
  it('should handle scrollTo function and handleScrollIntoView details', () => {
    const ref = React.createRef<any>()
    const mockSelectRef = jest.fn(() => ({
      getNodeInstance: () => ({
        nodeRef: {
          current: {
            measureLayout: jest.fn((parent, callback) => {
              // eslint-disable-next-line node/no-callback-literal
              callback(150, 250) // 模拟元素位置
            })
          }
        }
      })
    }))

    const { rerender } = render(
      <MpxScrollView
        ref={ref}
        testID="scroll-to-test"
        scroll-x={true}
        scroll-y={false}
        scroll-into-view=""
        scroll-into-view-offset={15}
        scroll-with-animation={false}
        __selectRef={mockSelectRef}
      >
        <MpxView id="target" style={{ height: 400, marginTop: 300 }}>
          <MpxText>Target element</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    // 通过 rerender 设置 scroll-into-view 来触发 handleScrollIntoView
    rerender(
      <MpxScrollView
        ref={ref}
        testID="scroll-to-test"
        scroll-x={true}
        scroll-y={false}
        scroll-into-view="target"
        scroll-into-view-offset={15}
        scroll-with-animation={false}
        __selectRef={mockSelectRef}
      >
        <MpxView id="target" style={{ height: 400, marginTop: 300 }}>
          <MpxText>Target element</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    expect(mockSelectRef).toHaveBeenCalledWith('#target', 'node')
    expect(ref.current.getNodeInstance().nodeRef.current.scrollTo).toHaveBeenCalledWith({
      x: 165,
      y: 250,
      animated: false
    })
  })

  // 测试 updateIntersection 函数 (443-454)
  it('should handle intersection observer updates correctly', () => {
    const mockThrottleMeasure1 = jest.fn()
    const mockThrottleMeasure2 = jest.fn()

    const mockIntersectionObservers = {
      observer1: { throttleMeasure: mockThrottleMeasure1 },
      observer2: { throttleMeasure: mockThrottleMeasure2 }
    }

    render(
      <IntersectionObserverContext.Provider value={mockIntersectionObservers}>
        <MpxScrollView
          testID="intersection-observer"
          scroll-y={true}
          enable-trigger-intersection-observer={true}
        >
          <MpxView style={{ height: 1000 }}>
            <MpxText>Intersection observer content</MpxText>
          </MpxView>
        </MpxScrollView>
      </IntersectionObserverContext.Provider>
    )

    const scrollElement = screen.getByTestId('intersection-observer')

    // 触发滚动来调用 updateIntersection
    fireEvent.scroll(scrollElement, {
      nativeEvent: {
        contentOffset: { x: 0, y: 300 },
        contentSize: { width: 300, height: 1000 },
        layoutMeasurement: { width: 300, height: 400 }
      }
    })

    expect(mockThrottleMeasure1).toHaveBeenCalled()
    expect(mockThrottleMeasure2).toHaveBeenCalled()
  })

  // 测试 scrollHandler listener (485)
  it('should trigger scrollHandler listener correctly', () => {
    const mockScroll = jest.fn()

    render(
      <MpxScrollView
        testID="scroll-handler-listener"
        scroll-y={true}
        bindscroll={mockScroll}
      >
        <MpxView style={{ height: 1000 }}>
          <MpxText>Scroll handler content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    const scrollElement = screen.getByTestId('scroll-handler-listener')

    // 使用 onScroll 事件来触发 scrollHandler 的 listener
    fireEvent(scrollElement, 'onScroll', {
      nativeEvent: {
        contentOffset: { x: 0, y: 200 },
        contentSize: { width: 300, height: 1000 },
        layoutMeasurement: { width: 300, height: 400 }
      }
    })

    expect(mockScroll).toHaveBeenCalled()
  })

  // 测试 onRefresh 函数特殊逻辑 (527-539)
  it('should handle onRefresh with undefined refresherTriggered', () => {
    jest.useFakeTimers()
    const mockRefresherRefresh = jest.fn()

    try {
      render(
        <MpxScrollView
          testID="refresh-undefined"
          enhanced={true}
          scroll-y={true}
          refresher-enabled={true}
          refresher-triggered={undefined}
          bindrefresherrefresh={mockRefresherRefresh}
          style={{ height: 400 }}
        >
          <MpxView slot="refresher" style={{ height: 100 }}>
            <MpxText>Pull to refresh</MpxText>
          </MpxView>
          <MpxView style={{ height: 800 }}>
            <MpxText>Main content</MpxText>
          </MpxView>
        </MpxScrollView>
      )

      let scrollElement = screen.getByTestId('refresh-undefined')

      fireEvent(scrollElement.children[0], 'onLayout', {
        nativeEvent: { layout: { height: 100 } }
      })

      const panGesture = __getLastPanGesture()
      act(() => {
        panGesture.onUpdateCallback({ translationY: 100, velocityY: 0 })
        panGesture.onEndCallback({ translationY: 100, velocityY: 0 })
      })

      scrollElement = screen.getByTestId('refresh-undefined')
      expect(mockRefresherRefresh).toHaveBeenCalled()
      expect(scrollElement.props.scrollEnabled).toBe(false)

      act(() => {
        jest.advanceTimersByTime(500)
      })

      expect(screen.getByTestId('refresh-undefined').props.scrollEnabled).toBe(true)
    } finally {
      jest.useRealTimers()
    }
  })

  // 测试状态更新条件分支 (594-596, 607-609)
  it('should handle state update conditions correctly', () => {
    render(
      <MpxScrollView
        testID="state-update-conditions"
        enhanced={true}
        scroll-y={true}
        bounces={true}
        refresher-enabled={true}
      >
        <MpxView style={{ height: 1000 }}>
          <MpxText>State update content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    const panGesture = __getLastPanGesture()
    act(() => {
      panGesture.onUpdateCallback({ translationY: 50, velocityY: 50 })
    })
    expect(screen.getByTestId('state-update-conditions').props.scrollEnabled).toBe(false)

    act(() => {
      panGesture.onUpdateCallback({ translationY: 30, velocityY: 0 })
      panGesture.onUpdateCallback({ translationY: -25, velocityY: -30 })
      panGesture.onUpdateCallback({ translationY: -25, velocityY: -30 })
    })

    expect(screen.getByTestId('state-update-conditions').props.scrollEnabled).toBe(true)
  })

  // 测试 enable-sticky 和内容高度变化场景 (382-392)
  it('should handle sticky scroll and content size changes', () => {
    const originalMode = global.__mpx_mode__
    const scrollOffset = {
      setValue: jest.fn()
    }
    try {
      global.__mpx_mode__ = 'android'
      ;(Animated.Value as jest.Mock).mockReturnValueOnce(scrollOffset)
      ;(Animated.event as jest.Mock).mockImplementationOnce((_mapping, config) => {
        return (event: any) => config.listener(event)
      })

      const { rerender } = render(
        <MpxScrollView
          testID="sticky-scroll"
          scroll-y={true}
          enable-sticky={true}
          style={{ height: 300 }}
        >
          <MpxView style={{ height: 800 }}>
            <MpxText>Sticky content</MpxText>
          </MpxView>
        </MpxScrollView>
      )

      const scrollElement = screen.getByTestId('sticky-scroll')
      scrollElement.props.onContentSizeChange(300, 800)

      // 先滚动到底部
      scrollElement.props.onScroll(createScrollEvent(0, 500, 300, 800, 300, 300))

      // 减少内容高度，触发 maxOffset 调整逻辑
      rerender(
        <MpxScrollView
          testID="sticky-scroll"
          scroll-y={true}
          enable-sticky={true}
          style={{ height: 300 }}
        >
          <MpxView style={{ height: 400 }}>
            <MpxText>Reduced content</MpxText>
          </MpxView>
        </MpxScrollView>
      )

      screen.getByTestId('sticky-scroll').props.onContentSizeChange(300, 400)

      expect(scrollOffset.setValue).toHaveBeenCalledWith(100)
    } finally {
      global.__mpx_mode__ = originalMode
    }
  })

  // 测试 harmony 模式下的 sticky 逻辑 (509-516)
  it('should handle harmony mode sticky scroll', () => {
    const originalMode = global.__mpx_mode__
    const scrollOffset = {
      setValue: jest.fn()
    }
    try {
      global.__mpx_mode__ = 'harmony'
      ;(Animated.Value as jest.Mock).mockReturnValueOnce(scrollOffset)
      ;(Animated.event as jest.Mock).mockImplementationOnce((_mapping, config) => {
        return (event: any) => config.listener(event)
      })

      render(
        <MpxScrollView
          testID="harmony-sticky"
          scroll-y={true}
          enable-sticky={true}
          style={{ height: 300 }}
        >
          <MpxView style={{ height: 600 }}>
            <MpxText>Harmony content</MpxText>
          </MpxView>
        </MpxScrollView>
      )

      const scrollElement = screen.getByTestId('harmony-sticky')

      // 先触发内容尺寸变化
      scrollElement.props.onContentSizeChange(300, 600)

      // 触发滚动来测试 harmony 模式的特殊逻辑
      scrollElement.props.onScroll(createScrollEvent(0, 200, 300, 600, 300, 300))

      expect(scrollOffset.setValue).toHaveBeenCalledWith(200)
    } finally {
      global.__mpx_mode__ = originalMode
    }
  })

  // 测试 enhanced 模式下的 drag 事件 (482-494, 527-537, 542-554)
  it('should handle enhanced drag events', () => {
    const mockDragStart = jest.fn()
    const mockDragEnd = jest.fn()

    render(
      <MpxScrollView
        testID="drag-events"
        enhanced={true}
        scroll-y={true}
        binddragstart={mockDragStart}
        binddragend={mockDragEnd}
        style={{ height: 300 }}
      >
        <MpxView style={{ height: 800 }}>
          <MpxText>Draggable content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    const scrollElement = screen.getByTestId('drag-events')

    // 触发 drag start
    fireEvent(scrollElement, 'onScrollBeginDrag', {
      nativeEvent: {
        contentOffset: { x: 0, y: 10 },
        contentSize: { width: 300, height: 800 },
        layoutMeasurement: { width: 300, height: 300 }
      }
    })

    expect(mockDragStart).toHaveBeenCalledWith(expect.objectContaining({
      detail: { scrollLeft: 0, scrollTop: 10 }
    }))

    // 触发 drag end
    fireEvent(scrollElement, 'onScrollEndDrag', {
      nativeEvent: {
        contentOffset: { x: 0, y: 100 },
        contentSize: { width: 300, height: 800 },
        layoutMeasurement: { width: 300, height: 300 }
      }
    })

    expect(mockDragEnd).toHaveBeenCalledWith(expect.objectContaining({
      detail: { scrollLeft: 0, scrollTop: 100 }
    }))
  })

  // 测试 bindtouchmove 和 binddragging 触发 (481-493)
  it('should handle bindtouchmove and binddragging', () => {
    const mockTouchMove = jest.fn()
    const mockDragging = jest.fn()

    const { rerender } = render(
      <MpxScrollView
        testID="touch-move-test"
        enhanced={false}
        scroll-y={true}
        bindtouchmove={mockTouchMove}
        style={{ height: 300 }}
      >
        <MpxView style={{ height: 600 }}>
          <MpxText>Touch content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    fireEvent(screen.getByTestId('touch-move-test'), 'touchMove', createTouchEvent())
    expect(mockTouchMove).toHaveBeenCalledWith(expect.objectContaining({
      nativeEvent: expect.objectContaining({
        pageX: 10,
        pageY: 20
      })
    }))

    // 测试 enhanced 模式下的 binddragging
    rerender(
      <MpxScrollView
        testID="touch-move-test"
        enhanced={true}
        scroll-y={true}
        binddragging={mockDragging}
        style={{ height: 300 }}
      >
        <MpxView style={{ height: 600 }}>
          <MpxText>Dragging content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    fireEvent(screen.getByTestId('touch-move-test'), 'touchMove', createTouchEvent())
    expect(mockDragging).toHaveBeenCalledWith(expect.objectContaining({
      type: 'dragging',
      detail: {
        scrollLeft: 0,
        scrollTop: 0
      }
    }))
  })

  // 测试 refresher 在 refreshing 状态下的手势处理 (667-694)
  it('should handle gestures during refreshing state', () => {
    const mockRefresherRefresh = jest.fn()

    const { rerender } = render(
      <MpxScrollView
        testID="refreshing-gesture"
        enhanced={true}
        scroll-y={true}
        bounces={true}
        refresher-enabled={true}
        refresher-triggered={false}
        refresher-threshold={60}
        bindrefresherrefresh={mockRefresherRefresh}
      >
        <MpxView slot="refresher" style={{ height: 80 }}>
          <MpxText>Pull to refresh</MpxText>
        </MpxView>
        <MpxView style={{ height: 1000 }}>
          <MpxText>Main content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    const scrollElement = screen.getByTestId('refreshing-gesture')

    // 设置 refresher 高度
    fireEvent(scrollElement.children[0], 'onLayout', {
      nativeEvent: { layout: { height: 80 } }
    })

    // 模拟进入 refreshing 状态
    rerender(
      <MpxScrollView
        testID="refreshing-gesture"
        enhanced={true}
        scroll-y={true}
        bounces={true}
        refresher-enabled={true}
        refresher-triggered={true}
        refresher-threshold={60}
        bindrefresherrefresh={mockRefresherRefresh}
      >
        <MpxView slot="refresher" style={{ height: 80 }}>
          <MpxText>Refreshing...</MpxText>
        </MpxView>
        <MpxView style={{ height: 1000 }}>
          <MpxText>Main content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    const panGesture = __getLastPanGesture()
    act(() => {
      panGesture.onUpdateCallback({ translationY: 40, velocityY: 0 })
      panGesture.onEndCallback({ translationY: 40, velocityY: 0 })
      panGesture.onUpdateCallback({ translationY: -30, velocityY: -50 })
      panGesture.onEndCallback({ translationY: -30, velocityY: -50 })
      panGesture.onUpdateCallback({ translationY: 70, velocityY: 0 })
      panGesture.onEndCallback({ translationY: 70, velocityY: 0 })
    })

    expect(mockRefresherRefresh).not.toHaveBeenCalled()
    expect(screen.getByText('Refreshing...')).toBeTruthy()
  })

  // 测试 scrollX 场景下的 handleScrollIntoView (317)
  it('should handle scrollIntoView with scroll-x enabled', () => {
    jest.useFakeTimers()
    const mockSelectRef = jest.fn(() => ({
      getNodeInstance: () => ({
        nodeRef: {
          current: {
            measureLayout: jest.fn((parent, callback) => {
              // eslint-disable-next-line node/no-callback-literal
              callback(200, 50)
            })
          }
        }
      })
    }))

    const { rerender } = render(
      <MpxScrollView
        testID="scroll-x-into-view"
        scroll-x={true}
        scroll-into-view=""
        __selectRef={mockSelectRef}
      >
        <MpxView id="item1" style={{ width: 300 }}>
          <MpxText>Item 1</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    act(() => {
      jest.runOnlyPendingTimers()
    })
    const scrollViewRef = __getLastScrollViewRef()
    scrollViewRef.scrollTo.mockClear()

    // 设置 scroll-into-view 触发滚动
    rerender(
      <MpxScrollView
        testID="scroll-x-into-view"
        scroll-x={true}
        scroll-into-view="item1"
        scroll-into-view-offset={10}
        scroll-with-animation={true}
        __selectRef={mockSelectRef}
      >
        <MpxView id="item1" style={{ width: 300 }}>
          <MpxText>Item 1</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(mockSelectRef).toHaveBeenCalledWith('#item1', 'node')
    expect(scrollViewRef.scrollTo).toHaveBeenCalledWith({
      x: 210,
      y: 50,
      animated: true
    })
    jest.useRealTimers()
  })

  // 测试没有 refresher content 时的逻辑 (294)
  it('should handle refresher without custom refresher content', () => {
    const mockRefresh = jest.fn()

    const { rerender } = render(
      <MpxScrollView
        testID="no-custom-refresher"
        enhanced={false}
        scroll-y={true}
        refresher-enabled={true}
        refresher-triggered={false}
        bindrefresherrefresh={mockRefresh}
      >
        <MpxView style={{ height: 600 }}>
          <MpxText>Main content only</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    // 切换 refresherTriggered
    rerender(
      <MpxScrollView
        testID="no-custom-refresher"
        enhanced={false}
        scroll-y={true}
        refresher-enabled={true}
        refresher-triggered={true}
        bindrefresherrefresh={mockRefresh}
      >
        <MpxView style={{ height: 600 }}>
          <MpxText>Main content only</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    const scrollElement = screen.getByTestId('no-custom-refresher')
    expect(scrollElement.props.refreshControl).toBeTruthy()
    expect(scrollElement.props.refreshControl.props.refreshing).toBe(true)
  })

  // 测试 simultaneousHandlers 和 waitFor (734-735)
  it('should handle simultaneousHandlers and waitFor props', () => {
    const mockGesture1 = { current: { name: 'gesture-1' } }
    const mockGesture2 = { current: { name: 'gesture-2' } }

    render(
      <MpxScrollView
        testID="gesture-handlers"
        scroll-y={true}
        simultaneous-handlers={[mockGesture1, mockGesture2]}
        wait-for={[mockGesture1]}
      >
        <MpxView style={{ height: 600 }}>
          <MpxText>Gesture content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    const scrollElement = screen.getByTestId('gesture-handlers')
    expect(scrollElement.props.simultaneousHandlers).toEqual([mockGesture1, mockGesture2])
    expect(scrollElement.props.waitFor).toEqual([mockGesture1])
  })

  // 测试 pagingEnabled 在 enhanced 模式下 (742)
  it('should handle pagingEnabled in enhanced mode', () => {
    render(
      <MpxScrollView
        testID="paging-enhanced"
        enhanced={true}
        scroll-y={true}
        paging-enabled={true}
        style={{ height: 300 }}
      >
        <MpxView style={{ height: 900 }}>
          <MpxText>Page 1</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    const scrollElement = screen.getByTestId('paging-enhanced')
    expect(scrollElement.props.pagingEnabled).toBe(true)
  })

  // prop 形式缺少 selector resolver 时不触发 scrollIntoView 处理
  it('keeps prop scrollIntoView inert without __selectRef', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    try {
      render(
        <MpxScrollView
          testID="no-select-ref"
          scroll-y={true}
          scroll-into-view="item1"
        >
          <MpxView id="item1" style={{ height: 200 }}>
            <MpxText>Item 1</MpxText>
          </MpxView>
        </MpxScrollView>
      )

      expect(screen.getByTestId('no-select-ref').props.scrollEnabled).toBe(true)
      expect(warnSpy).not.toHaveBeenCalled()
    } finally {
      warnSpy.mockRestore()
    }
  })

  // 测试 enableScrollValue.value 为 true 时的 onEnd 分支 (684)
  it('should handle onEnd gesture when scroll is enabled', () => {
    const mockRefresherRefresh = jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { withTiming } = require('react-native-reanimated')

    render(
      <MpxScrollView
        testID="enabled-scroll-gesture"
        enhanced={true}
        scroll-y={true}
        bounces={true}
        refresher-enabled={true}
        bindrefresherrefresh={mockRefresherRefresh}
      >
        <MpxView slot="refresher" style={{ height: 60 }}>
          <MpxText>Refresher</MpxText>
        </MpxView>
        <MpxView style={{ height: 800 }}>
          <MpxText>Content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    const scrollElement = screen.getByTestId('enabled-scroll-gesture')

    fireEvent(scrollElement.children[0], 'onLayout', {
      nativeEvent: { layout: { height: 60 } }
    })

    const panGesture = __getLastPanGesture()
    withTiming.mockClear()
    act(() => {
      panGesture.onEndCallback({ translationY: 50, velocityY: 0 })
    })

    expect(mockRefresherRefresh).not.toHaveBeenCalled()
    expect(withTiming).not.toHaveBeenCalled()
  })

  it('should animate imperative scrollTo when duration is provided', () => {
    const ref = React.createRef<any>()
    const originalRequestAnimationFrame = global.requestAnimationFrame
    let now = 0
    const dateNow = jest.spyOn(Date, 'now').mockImplementation(() => now)
    const rafCallbacks: Array<(time: number) => void> = []
    global.requestAnimationFrame = jest.fn((callback) => {
      rafCallbacks.push(callback as (time: number) => void)
      return rafCallbacks.length
    }) as any

    try {
      render(
        <MpxScrollView
          ref={ref}
          testID="imperative-scroll"
          scroll-x={true}
          scroll-y={false}
        >
          <MpxView style={{ width: 1000 }}>
            <MpxText>Wide content</MpxText>
          </MpxView>
        </MpxScrollView>
      )

      const nodeInstance = ref.current.getNodeInstance()
      const nativeScrollTo = nodeInstance.nodeRef.current.scrollTo
      nodeInstance.instance.node.scrollTo({
        left: 40,
        top: 100,
        animated: true,
        duration: 100
      })

      expect(global.requestAnimationFrame).toHaveBeenCalledTimes(1)
      expect(nativeScrollTo).not.toHaveBeenCalled()

      now = 50
      act(() => {
        rafCallbacks.shift()!(50)
      })
      expect(nativeScrollTo).toHaveBeenNthCalledWith(1, {
        x: 20,
        y: 50,
        animated: false
      })
      expect(global.requestAnimationFrame).toHaveBeenCalledTimes(2)

      now = 100
      act(() => {
        rafCallbacks.shift()!(100)
      })
      expect(nativeScrollTo).toHaveBeenNthCalledWith(2, {
        x: 40,
        y: 100,
        animated: false
      })
      expect(nativeScrollTo).toHaveBeenNthCalledWith(3, {
        x: 40,
        y: 100,
        animated: false
      })
    } finally {
      global.requestAnimationFrame = originalRequestAnimationFrame
      dateNow.mockRestore()
    }
  })

  it('should warn for scrollIntoView unavailable target branches', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const ref = React.createRef<any>()
    const missingSelectRef = jest.fn(() => null)
    const missingNodeRef = jest.fn(() => ({
      getNodeInstance: () => ({
        nodeRef: {
          current: null
        }
      })
    }))
    const failedMeasureRef = jest.fn(() => ({
      getNodeInstance: () => ({
        nodeRef: {
          current: {
            measureLayout: jest.fn((parent, success, fail) => {
              fail('measure failed')
            })
          }
        }
      })
    }))
    const throwingSelectRef = jest.fn(() => {
      throw new Error('select failed')
    })

    try {
      const { rerender } = render(
        <MpxScrollView
          ref={ref}
          testID="scroll-into-view-warnings"
          scroll-y={true}
        >
          <MpxView id="target">
            <MpxText>Target</MpxText>
          </MpxView>
        </MpxScrollView>
      )

      ref.current.getNodeInstance().instance.node.scrollIntoView('target')
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('__selectRef is not available'))

      rerender(
        <MpxScrollView
          ref={ref}
          testID="scroll-into-view-warnings"
          scroll-y={true}
          __selectRef={missingSelectRef}
        >
          <MpxView id="target">
            <MpxText>Target</MpxText>
          </MpxView>
        </MpxScrollView>
      )
      ref.current.getNodeInstance().instance.node.scrollIntoView('target')
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Element not found for selector: #target'))

      rerender(
        <MpxScrollView
          ref={ref}
          testID="scroll-into-view-warnings"
          scroll-y={true}
          __selectRef={missingNodeRef}
        >
          <MpxView id="target">
            <MpxText>Target</MpxText>
          </MpxView>
        </MpxScrollView>
      )
      ref.current.getNodeInstance().instance.node.scrollIntoView('.target')
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Node ref not available for selector: .target'))

      rerender(
        <MpxScrollView
          ref={ref}
          testID="scroll-into-view-warnings"
          scroll-y={true}
          __selectRef={failedMeasureRef}
        >
          <MpxView id="target">
            <MpxText>Target</MpxText>
          </MpxView>
        </MpxScrollView>
      )
      ref.current.getNodeInstance().instance.node.scrollIntoView('#target')
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to measure layout for selector #target'))

      rerender(
        <MpxScrollView
          ref={ref}
          testID="scroll-into-view-warnings"
          scroll-y={true}
          __selectRef={throwingSelectRef}
        >
          <MpxView id="target">
            <MpxText>Target</MpxText>
          </MpxView>
        </MpxScrollView>
      )
      ref.current.getNodeInstance().instance.node.scrollIntoView('target')
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('handleScrollIntoView error for selector target'))
    } finally {
      warnSpy.mockRestore()
    }
  })
})
