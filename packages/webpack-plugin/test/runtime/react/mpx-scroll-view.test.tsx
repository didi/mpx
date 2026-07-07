import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react-native'

import MpxScrollView from '../../../lib/runtime/components/react/mpx-scroll-view'
import MpxView from '../../../lib/runtime/components/react/mpx-view'
import MpxText from '../../../lib/runtime/components/react/mpx-text'
import { IntersectionObserverContext } from '../../../lib/runtime/components/react/context'
import { createTouchEvent } from './helpers'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { __getLastPanGesture } = require('react-native-gesture-handler')

// Mock mpx-portal
jest.mock('../../../lib/runtime/components/react/mpx-portal', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mockReact = require('react')
  return mockReact.forwardRef((props: any, ref: any) => {
    return mockReact.createElement('View', { ...props, ref })
  })
})

describe('MpxScrollView', () => {
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
      >
        <MpxView style={{ width: 800 }}>
          <MpxText>Horizontal content</MpxText>
        </MpxView>
      </MpxScrollView>
    )
    expect(screen.getByTestId('basic-scroll').props.horizontal).toBe(true)
  })

  // MPX特定属性和警告测试
  it('should handle MPX specific properties and warnings', () => {
    const mockRefresh = jest.fn()

    render(
      <MpxScrollView
        testID="mpx-props"
        scroll-x={true}
        scroll-y={true} // 触发警告
        scroll-top={100}
        scroll-left={50}
        refresher-enabled={true}
        bindrefresherrefresh={mockRefresh}
      >
        <MpxView>
          <MpxText>Content with conflicting scroll directions</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    expect(screen.getByTestId('mpx-props')).toBeTruthy()
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

  // 增强模式和手势处理测试
  it('should handle enhanced mode and pan gestures', () => {
    const mockRefresherRefresh = jest.fn()

    render(
      <MpxScrollView
        testID="enhanced-scroll"
        enhanced={true}
        scroll-y={true}
        bounces={true}
        refresher-enabled={true}
        bindrefresherrefresh={mockRefresherRefresh}
      >
        <MpxView slot="refresher" style={{ height: 50 }}>
          <MpxText>Custom refresher</MpxText>
        </MpxView>
        <MpxView style={{ height: 1000 }}>
          <MpxText>Enhanced content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    const scrollElement = screen.getByTestId('enhanced-scroll')

    // 设置refresher高度
    fireEvent(scrollElement.children[0], 'onLayout', {
      nativeEvent: { layout: { height: 50 } }
    })

    const panGesture = __getLastPanGesture()
    act(() => {
      panGesture.onUpdateCallback({ translationY: 30, velocityY: 0 })
      panGesture.onUpdateCallback({ translationY: -20, velocityY: 0 })
      panGesture.onEndCallback({ translationY: 60, velocityY: 0 })
    })

    expect(mockRefresherRefresh).toHaveBeenCalledWith(expect.objectContaining({
      type: 'refresherrefresh'
    }))
  })

  // 滚动位置控制和scroll-into-view测试
  it('should handle scroll position controls and scroll-into-view', () => {
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

    expect(mockSelectRef).toHaveBeenCalledWith('#item2', 'node')
  })

  // Portal渲染测试
  it('should render in Portal when position is fixed', () => {
    // Mock useTransformStyle hook
    const mockUseTransformStyle = jest.fn(() => ({
      hasPositionFixed: true,
      hasVarDec: false,
      hasSelfPercent: false,
      normalStyle: { position: 'absolute' },
      varContextRef: { current: null },
      setWidth: jest.fn(),
      setHeight: jest.fn()
    }))

    try {
      jest.isolateModules(() => {
        jest.doMock('react', () => React)
        const originalModule = jest.requireActual('../../../lib/runtime/components/react/utils')
        jest.doMock('../../../lib/runtime/components/react/utils', () => Object.assign({}, originalModule, {
          useTransformStyle: mockUseTransformStyle
        }))

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const MpxScrollViewWithMock = require('../../../lib/runtime/components/react/mpx-scroll-view').default

        render(
          <MpxScrollViewWithMock
            testID="portal-scroll"
            style={{ position: 'fixed' }}
          >
            <MpxView>
              <MpxText>Fixed positioned content</MpxText>
            </MpxView>
          </MpxScrollViewWithMock>
        )
      })

      expect(screen.getByTestId('portal-scroll')).toBeTruthy()
      expect(mockUseTransformStyle).toHaveBeenCalled()
    } finally {
      jest.dontMock('react')
      jest.dontMock('../../../lib/runtime/components/react/utils')
    }
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
    render(
      <MpxScrollView
        testID="intersection-scroll"
        scroll-y={true}
        enable-trigger-intersection-observer={true}
      >
        <MpxView style={{ height: 1000 }}>
          <MpxText>Intersection content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    const scrollElement = screen.getByTestId('intersection-scroll')

    fireEvent.scroll(scrollElement, {
      nativeEvent: {
        contentOffset: { x: 0, y: 200 },
        contentSize: { width: 300, height: 1000 },
        layoutMeasurement: { width: 300, height: 400 }
      }
    })

    expect(scrollElement).toBeTruthy()
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

    const { rerender } = render(
      <MpxScrollView
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
    fireEvent(scrollElement, 'onLayout', {
      nativeEvent: {
        layout: { width: 300, height: 300 }
      }
    })

    // 测试内容尺寸变化
    fireEvent(scrollElement, 'onContentSizeChange', {
      nativeEvent: { contentSize: { width: 300, height: 800 } }
    })

    // 测试动态内容变化
    rerender(
      <MpxScrollView
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

    expect(scrollElement).toBeTruthy()
  })

  // 关键分支覆盖测试
  it('should handle specific uncovered branches', () => {
    const mockRefresherRefresh = jest.fn()
    const mockScroll = jest.fn()

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
    expect(mockScroll).toHaveBeenCalled()

    fireEvent(scrollElement, 'onScroll', {
      nativeEvent: {
        contentOffset: { x: 0, y: 0 },
        contentSize: { width: 300, height: 1000 },
        layoutMeasurement: { width: 300, height: 400 }
      }
    })

    const panGesture = __getLastPanGesture()
    act(() => {
      panGesture.onUpdateCallback({ translationY: 50, velocityY: 100 })
      panGesture.onUpdateCallback({ translationY: -30, velocityY: -50 })
      panGesture.onUpdateCallback({ translationY: 80, velocityY: 0 })
      panGesture.onEndCallback({ translationY: 80, velocityY: 0 })
    })

    expect(mockRefresherRefresh).toHaveBeenCalled()
  })

  // 复杂手势和状态管理测试
  it('should handle complex gesture states and transitions', () => {
    const mockRefresherRefresh = jest.fn()

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

    // 测试复杂手势处理的特定分支 (617-670)
    const complexGestures = [
      { state: 4, translationY: 30, velocityY: 0 }, // enhanced && bounces分支
      { state: 4, translationY: -20, velocityY: 0 }, // translationY < 0分支
      { state: 4, translationY: 40, velocityY: 0 }, // isAtTop.value分支
      { state: 5, translationY: 105, velocityY: 0 }, // 超过refresherHeight触发刷新
      { state: 5, translationY: 50, velocityY: 0 }, // 普通回弹
      { state: 5, translationY: -15, velocityY: -30 } // 向上滑动隐藏
    ]

    const panGesture = __getLastPanGesture()
    act(() => {
      complexGestures.forEach((gesture) => {
        if (gesture.state === 4) {
          panGesture.onUpdateCallback(gesture)
        } else {
          panGesture.onEndCallback(gesture)
        }
      })
    })

    expect(mockRefresherRefresh).toHaveBeenCalled()
  })

  // 测试 firstScrollIntoViewChange 分支 (272-277)
  it('should handle first scrollIntoView change with setTimeout', () => {
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

    const { rerender } = render(
      <MpxScrollView
        testID="first-scroll-into-view"
        scroll-y={true}
        scroll-into-view=""
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

    // 首次设置 scroll-into-view，触发 firstScrollIntoViewChange.current === true 分支
    rerender(
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

    expect(mockSelectRef).toHaveBeenCalledWith('#item2', 'node')
  })

  // 测试 scrollTo 和 handleScrollIntoView 函数 (300-312)
  it('should handle scrollTo function and handleScrollIntoView details', () => {
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
        testID="scroll-to-test"
        scroll-x={true}
        scroll-y={true}
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
        testID="scroll-to-test"
        scroll-x={true}
        scroll-y={true}
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
  it('should handle onRefresh with undefined refresherTriggered', async () => {
    const mockRefresherRefresh = jest.fn()

    const { getByTestId } = render(
      <MpxScrollView
        testID="refresh-undefined"
        enhanced={false} // 使用普通模式，使用 RefreshControl
        scroll-y={true}
        refresher-enabled={true}
        refresher-triggered={undefined} // 关键：undefined 触发特殊逻辑
        refresher-default-style="black"
        bindrefresherrefresh={mockRefresherRefresh}
        style={{ height: 400 }}
      >
        <MpxView style={{ height: 800 }}>
          <MpxText>Main content</MpxText>
        </MpxView>
      </MpxScrollView>
    )

    const scrollElement = getByTestId('refresh-undefined')

    // 由于使用了 RefreshControl，我们可以通过 refresh 相关事件来触发
    // 模拟 RefreshControl 的 onRefresh 调用
    const refreshControl = scrollElement.props.refreshControl

    // 验证 RefreshControl 存在且有 onRefresh 回调
    expect(refreshControl).toBeDefined()
    expect(refreshControl.props.onRefresh).toBeDefined()

    // 直接调用 onRefresh 函数来触发刷新逻辑
    refreshControl.props.onRefresh()

    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100))

    // 验证 bindrefresherrefresh 被调用
    expect(mockRefresherRefresh).toHaveBeenCalled()
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

    const scrollElement = screen.getByTestId('state-update-conditions')

    const panGesture = __getLastPanGesture()
    act(() => {
      panGesture.onUpdateCallback({ translationY: 50, velocityY: 50 })
      panGesture.onUpdateCallback({ translationY: 30, velocityY: 0 })
      panGesture.onUpdateCallback({ translationY: -25, velocityY: -30 })
      panGesture.onUpdateCallback({ translationY: -25, velocityY: -30 })
    })

    expect(scrollElement).toBeTruthy()
  })

  // 测试 enable-sticky 和内容高度变化场景 (382-392)
  it('should handle sticky scroll and content size changes', () => {
    const originalMode = global.__mpx_mode__
    try {
      global.__mpx_mode__ = 'android'

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

      // 先滚动到底部
      fireEvent.scroll(scrollElement, {
        nativeEvent: {
          contentOffset: { x: 0, y: 500 },
          contentSize: { width: 300, height: 800 },
          layoutMeasurement: { width: 300, height: 300 }
        }
      })

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

      fireEvent(scrollElement, 'onContentSizeChange', {
        nativeEvent: { contentSize: { width: 300, height: 400 } }
      })

      expect(scrollElement).toBeTruthy()
    } finally {
      global.__mpx_mode__ = originalMode
    }
  })

  // 测试 harmony 模式下的 sticky 逻辑 (509-516)
  it('should handle harmony mode sticky scroll', () => {
    const originalMode = global.__mpx_mode__
    try {
      global.__mpx_mode__ = 'harmony'

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
      fireEvent(scrollElement, 'onContentSizeChange', {
        nativeEvent: { contentSize: { width: 300, height: 600 } }
      })

      // 触发滚动来测试 harmony 模式的特殊逻辑
      fireEvent.scroll(scrollElement, {
        nativeEvent: {
          contentOffset: { x: 0, y: 200 },
          contentSize: { width: 300, height: 600 },
          layoutMeasurement: { width: 300, height: 300 }
        }
      })

      expect(scrollElement).toBeTruthy()
    } finally {
      global.__mpx_mode__ = originalMode
    }
  })

  // 测试 enhanced 模式下的 drag 事件 (482-494, 527-537, 542-554)
  it('should handle enhanced drag events', () => {
    const mockDragStart = jest.fn()
    const mockDragging = jest.fn()
    const mockDragEnd = jest.fn()

    render(
      <MpxScrollView
        testID="drag-events"
        enhanced={true}
        scroll-y={true}
        binddragstart={mockDragStart}
        binddragging={mockDragging}
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

    expect(mockDragStart).toHaveBeenCalled()

    // 触发 drag end
    fireEvent(scrollElement, 'onScrollEndDrag', {
      nativeEvent: {
        contentOffset: { x: 0, y: 100 },
        contentSize: { width: 300, height: 800 },
        layoutMeasurement: { width: 300, height: 300 }
      }
    })

    expect(mockDragEnd).toHaveBeenCalled()
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
  it('should handle scrollIntoView with scroll-x enabled', async () => {
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

    // 等待初始渲染完成
    await new Promise(resolve => setTimeout(resolve, 10))

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

    // 等待 setTimeout 完成 (首次 scrollIntoView 变化会用 setTimeout)
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(mockSelectRef).toHaveBeenCalledWith('#item1', 'node')
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
    const mockGesture1 = { current: null }
    const mockGesture2 = { current: null }

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

    expect(screen.getByTestId('gesture-handlers')).toBeTruthy()
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

  // 测试没有 __selectRef 时的 scrollIntoView (311)
  it('should handle scrollIntoView without __selectRef', () => {
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

    expect(screen.getByTestId('no-select-ref')).toBeTruthy()
  })

  // 测试 enableScrollValue.value 为 true 时的 onEnd 分支 (684)
  it('should handle onEnd gesture when scroll is enabled', () => {
    const mockRefresherRefresh = jest.fn()

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
    act(() => {
      panGesture.onEndCallback({ translationY: 50, velocityY: 0 })
    })

    expect(mockRefresherRefresh).not.toHaveBeenCalled()
  })
})
