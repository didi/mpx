/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { expectPortalHostRendered, renderWithPortalHost, resetMpxRuntimeGlobals } from './rn-component-test-utils'

const MpxSwiper = require('../../../../lib/runtime/components/react/mpx-swiper').default
const MpxSwiperItem = require('../../../../lib/runtime/components/react/mpx-swiper-item').default

beforeEach(() => {
  jest.clearAllMocks()
  const { __resetAnimatedReactions } = require('react-native-reanimated')
  __resetAnimatedReactions()
  resetMpxRuntimeGlobals()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('MpxSwiper', () => {
  it('renders swiper items, pagination and emits touch change from gesture', () => {
    const bindchange = jest.fn()
    const { __getLastPanGesture } = require('react-native-gesture-handler')
    const { __flushAnimatedReactions } = require('react-native-reanimated')
    render(
      <MpxSwiper
        testID="swiper"
        style={{ width: 300, height: 120 }}
        indicator-dots={true}
        bindchange={bindchange}
      >
        <MpxSwiperItem item-id="a" enable-var={false}>
          <Text>A</Text>
        </MpxSwiperItem>
        <MpxSwiperItem item-id="b" enable-var={false}>
          <Text>B</Text>
        </MpxSwiperItem>
      </MpxSwiper>
    )

    expect(screen.getAllByText('A').length).toBeGreaterThan(0)
    expect(screen.getByTestId('gesture-detector')).toBeTruthy()
    fireEvent(screen.getByTestId('swiper'), 'layout', {
      nativeEvent: { layout: { width: 300, height: 120 } }
    })
    const gesture = __getLastPanGesture()
    act(() => {
      gesture.onBeginCallback({ absoluteX: 0, velocityX: 0 })
      gesture.onUpdateCallback({ absoluteX: -180, velocityX: 0 })
      gesture.onFinalizeCallback({ absoluteX: -180, velocityX: 150 })
      __flushAnimatedReactions()
    })
    expect(gesture.activeOffsetX).toHaveBeenCalled()
    expect(bindchange).toHaveBeenCalledWith(expect.objectContaining({
      type: 'change',
      detail: { current: 1, source: 'touch' }
    }))
  })

  it('updates from props, autoplay and boundary gestures', () => {
    jest.useFakeTimers()
    const bindchange = jest.fn()
    const { __getLastPanGesture } = require('react-native-gesture-handler')
    const { __flushAnimatedReactions, withTiming } = require('react-native-reanimated')
    const { rerender } = render(
      <MpxSwiper
        testID="prop-swiper"
        style={{ width: 240, height: 100 }}
        current={0}
        autoplay={true}
        interval={10}
        circular={false}
        previous-margin="0"
        next-margin="0"
        bindchange={bindchange}
      >
        <MpxSwiperItem item-id="one" enable-var={false}>
          <Text>One</Text>
        </MpxSwiperItem>
        <MpxSwiperItem item-id="two" enable-var={false}>
          <Text>Two</Text>
        </MpxSwiperItem>
        <MpxSwiperItem item-id="three" enable-var={false}>
          <Text>Three</Text>
        </MpxSwiperItem>
      </MpxSwiper>
    )

    fireEvent(screen.getByTestId('prop-swiper'), 'layout', {
      nativeEvent: { layout: { width: 240, height: 100 } }
    })
    withTiming.mockClear()
    act(() => {
      jest.advanceTimersByTime(10)
      __flushAnimatedReactions()
    })
    expect(withTiming).toHaveBeenCalledWith(-240, expect.objectContaining({ duration: 500 }), expect.any(Function))
    expect(bindchange).toHaveBeenCalledWith(expect.objectContaining({
      detail: { current: 1, source: 'autoplay' }
    }))

    bindchange.mockClear()
    withTiming.mockClear()
    rerender(
      <MpxSwiper
        testID="prop-swiper"
        style={{ width: 240, height: 100 }}
        current={2}
        autoplay={false}
        circular={false}
        previous-margin="10"
        next-margin="20"
        bindchange={bindchange}
      >
        <MpxSwiperItem item-id="one" enable-var={false}>
          <Text>One</Text>
        </MpxSwiperItem>
        <MpxSwiperItem item-id="two" enable-var={false}>
          <Text>Two</Text>
        </MpxSwiperItem>
      </MpxSwiper>
    )
    let gesture = __getLastPanGesture()
    act(() => {
      gesture.onBeginCallback({ absoluteX: 0, velocityX: 0 })
      gesture.onUpdateCallback({ absoluteX: 260, velocityX: 0 })
      gesture.onFinalizeCallback({ absoluteX: 260, velocityX: 120 })
      __flushAnimatedReactions()
    })
    expect(withTiming).toHaveBeenLastCalledWith(-0, expect.objectContaining({ duration: 500 }), expect.any(Function))
    expect(bindchange).toHaveBeenCalledWith(expect.objectContaining({
      detail: { current: 0, source: 'touch' }
    }))

    bindchange.mockClear()
    withTiming.mockClear()
    rerender(
      <MpxSwiper
        testID="circular-swiper"
        style={{ width: 240, height: 100 }}
        current={1}
        circular={true}
        previous-margin="10"
        next-margin="10"
        bindchange={bindchange}
      >
        <MpxSwiperItem item-id="one" enable-var={false}>
          <Text>One</Text>
        </MpxSwiperItem>
        <MpxSwiperItem item-id="two" enable-var={false}>
          <Text>Two</Text>
        </MpxSwiperItem>
      </MpxSwiper>
    )
    fireEvent(screen.getByTestId('circular-swiper'), 'layout', {
      nativeEvent: { layout: { width: 240, height: 100 } }
    })
    act(() => {
      __flushAnimatedReactions()
    })
    expect(bindchange).toHaveBeenCalledWith(expect.objectContaining({
      detail: { current: 1, source: '' }
    }))
    bindchange.mockClear()
    withTiming.mockClear()
    gesture = __getLastPanGesture()
    act(() => {
      gesture.onBeginCallback({ absoluteX: 0, velocityX: 0 })
      gesture.onUpdateCallback({ absoluteX: -520, velocityX: 0 })
      gesture.onFinalizeCallback({ absoluteX: -520, velocityX: 150 })
      __flushAnimatedReactions()
    })
    expect(withTiming).toHaveBeenLastCalledWith(-870, expect.objectContaining({ duration: 500 }), expect.any(Function))
    expect(bindchange).toHaveBeenCalledWith(expect.objectContaining({
      detail: { current: 0, source: 'touch' }
    }))
    jest.useRealTimers()
  })

  it('emits bindchange when current updates after layout', () => {
    const bindchange = jest.fn()
    const { __flushAnimatedReactions } = require('react-native-reanimated')
    const { rerender } = render(
      <MpxSwiper
        testID="change-swiper"
        style={{ width: 240, height: 100 }}
        current={0}
        bindchange={bindchange}
      >
        <MpxSwiperItem item-id="one" enable-var={false}>
          <Text>One</Text>
        </MpxSwiperItem>
        <MpxSwiperItem item-id="two" enable-var={false}>
          <Text>Two</Text>
        </MpxSwiperItem>
      </MpxSwiper>
    )

    fireEvent(screen.getByTestId('change-swiper'), 'layout', {
      nativeEvent: { layout: { width: 240, height: 100 } }
    })
    rerender(
      <MpxSwiper
        testID="change-swiper"
        style={{ width: 240, height: 100 }}
        current={1}
        bindchange={bindchange}
      >
        <MpxSwiperItem item-id="one" enable-var={false}>
          <Text>One</Text>
        </MpxSwiperItem>
        <MpxSwiperItem item-id="two" enable-var={false}>
          <Text>Two</Text>
        </MpxSwiperItem>
      </MpxSwiper>
    )
    act(() => {
      __flushAnimatedReactions()
    })

    expect(bindchange).toHaveBeenCalledWith(expect.objectContaining({
      detail: { current: 1, source: '' }
    }))

    bindchange.mockClear()
    fireEvent(screen.getByTestId('change-swiper'), 'layout', {
      nativeEvent: { layout: { width: 260, height: 100 } }
    })
    expect(bindchange).not.toHaveBeenCalled()
  })

  it('rolls back a vertical swiper with one item', () => {
    const { __getLastPanGesture } = require('react-native-gesture-handler')
    const { withTiming } = require('react-native-reanimated')
    render(
      <MpxSwiper
        testID="single-swiper"
        style={{ width: 200, height: 100 }}
        current={0}
        vertical={true}
        indicator-dots={true}
        indicator-margin={0}
      >
        <MpxSwiperItem item-id="only" enable-var={false}>
          <Text>Only</Text>
        </MpxSwiperItem>
      </MpxSwiper>
    )
    const gesture = __getLastPanGesture()
    withTiming.mockClear()
    act(() => {
      gesture.onBeginCallback({ absoluteY: 0, velocityY: 0 })
      gesture.onUpdateCallback({ absoluteY: 60, velocityY: 0 })
      gesture.onFinalizeCallback({ absoluteY: 60, velocityY: 0 })
    })
    expect(gesture.activeOffsetY).toHaveBeenCalled()
    expect(withTiming).toHaveBeenCalledWith(0, expect.objectContaining({ duration: 500 }))
  })

  it('does not attach a gesture detector when gestures are disabled', () => {
    render(
      <MpxSwiper
        testID="plain-swiper"
        style={{ width: 200, height: 100 }}
        disableGesture={true}
      >
        <MpxSwiperItem item-id="first" enable-var={false}>
          <Text>First</Text>
        </MpxSwiperItem>
        <MpxSwiperItem item-id="second" enable-var={false}>
          <Text>Second</Text>
        </MpxSwiperItem>
      </MpxSwiper>
    )
    expect(screen.queryByTestId('gesture-detector')).toBeNull()
  })

  it('renders fixed swipers through the portal', () => {
    const fixedRender = renderWithPortalHost(
      <MpxSwiper
        testID="fixed-swiper"
        style={{ width: 200, height: 100, position: 'fixed' }}
      >
        <MpxSwiperItem item-id="x" enable-var={false}>
          <Text>X</Text>
        </MpxSwiperItem>
      </MpxSwiper>
    )
    expectPortalHostRendered(fixedRender.toJSON(), 'fixed-swiper')
  })

  it('handles autoplay terminal page and circular rollover', () => {
    jest.useFakeTimers()
    const terminalChange = jest.fn()
    const circularChange = jest.fn()
    const { __flushAnimatedReactions, withTiming } = require('react-native-reanimated')
    const firstRender = render(
      <MpxSwiper
        testID="autoplay-last"
        style={{ width: 200, height: 100 }}
        current={1}
        autoplay={true}
        interval={10}
        bindchange={terminalChange}
      >
        <MpxSwiperItem item-id="a" enable-var={false}>
          <Text>A</Text>
        </MpxSwiperItem>
        <MpxSwiperItem item-id="b" enable-var={false}>
          <Text>B</Text>
        </MpxSwiperItem>
      </MpxSwiper>
    )

    fireEvent(screen.getByTestId('autoplay-last'), 'layout', {
      nativeEvent: { layout: { width: 200, height: 100 } }
    })
    withTiming.mockClear()
    act(() => {
      jest.advanceTimersByTime(20)
    })
    expect(withTiming).not.toHaveBeenCalled()
    expect(terminalChange).not.toHaveBeenCalled()
    firstRender.unmount()

    render(
      <MpxSwiper
        testID="autoplay-circular"
        style={{ width: 200, height: 100 }}
        current={1}
        autoplay={true}
        circular={true}
        interval={10}
        bindchange={circularChange}
      >
        <MpxSwiperItem item-id="a" enable-var={false}>
          <Text>A</Text>
        </MpxSwiperItem>
        <MpxSwiperItem item-id="b" enable-var={false}>
          <Text>B</Text>
        </MpxSwiperItem>
      </MpxSwiper>
    )
    fireEvent(screen.getByTestId('autoplay-circular'), 'layout', {
      nativeEvent: { layout: { width: 200, height: 100 } }
    })
    withTiming.mockClear()
    act(() => {
      jest.advanceTimersByTime(10)
    })
    expect(withTiming).toHaveBeenCalledWith(-600, expect.objectContaining({
      duration: 500
    }), expect.any(Function))
    act(() => {
      __flushAnimatedReactions()
    })

    expect(circularChange).toHaveBeenCalledWith(expect.objectContaining({
      detail: { current: 0, source: 'autoplay' }
    }))
    jest.useRealTimers()
  })

  it('handles margin, circular and children length updates', () => {
    jest.useFakeTimers()
    const bindchange = jest.fn()
    const { __flushAnimatedReactions } = require('react-native-reanimated')
    const { rerender } = render(
      <MpxSwiper
        testID="updating-swiper"
        style={{ width: 300, height: 120 }}
        current={2}
        autoplay={true}
        interval={10}
        bindchange={bindchange}
      >
        <MpxSwiperItem item-id="one" enable-var={false}>
          <Text>One</Text>
        </MpxSwiperItem>
        <MpxSwiperItem item-id="two" enable-var={false}>
          <Text>Two</Text>
        </MpxSwiperItem>
        <MpxSwiperItem item-id="three" enable-var={false}>
          <Text>Three</Text>
        </MpxSwiperItem>
      </MpxSwiper>
    )
    fireEvent(screen.getByTestId('updating-swiper'), 'layout', {
      nativeEvent: { layout: { width: 300, height: 120 } }
    })

    rerender(
      <MpxSwiper
        testID="updating-swiper"
        style={{ width: 300, height: 120 }}
        current={2}
        autoplay={true}
        interval={10}
        previous-margin="10"
        next-margin="20"
        bindchange={bindchange}
      >
        <MpxSwiperItem item-id="one" enable-var={false}>
          <Text>One</Text>
        </MpxSwiperItem>
        <MpxSwiperItem item-id="two" enable-var={false}>
          <Text>Two</Text>
        </MpxSwiperItem>
        <MpxSwiperItem item-id="three" enable-var={false}>
          <Text>Three</Text>
        </MpxSwiperItem>
      </MpxSwiper>
    )

    rerender(
      <MpxSwiper
        testID="updating-swiper"
        style={{ width: 300, height: 120 }}
        current={2}
        autoplay={true}
        interval={10}
        previous-margin="10"
        next-margin="20"
        circular={true}
        bindchange={bindchange}
      >
        <MpxSwiperItem item-id="one" enable-var={false}>
          <Text>One</Text>
        </MpxSwiperItem>
        <MpxSwiperItem item-id="two" enable-var={false}>
          <Text>Two</Text>
        </MpxSwiperItem>
      </MpxSwiper>
    )
    act(() => {
      __flushAnimatedReactions()
    })
    expect(bindchange).toHaveBeenCalledWith(expect.objectContaining({
      detail: { current: 0, source: '' }
    }))
    act(() => {
      jest.advanceTimersByTime(20)
    })

    expect(screen.queryByText('Three')).toBeNull()
    expect(screen.getAllByText('One')).toHaveLength(3)
  })

  it('updates external gesture dependencies after rerender', () => {
    const { __getLastPanGesture } = require('react-native-gesture-handler')
    const waitFor = { current: { name: 'wait-a' } }
    const nextWaitFor = { current: { name: 'wait-b' } }
    const simultaneous = { current: { name: 'simultaneous-a' } }
    const nextSimultaneous = { current: { name: 'simultaneous-b' } }
    const { rerender } = render(
      <MpxSwiper
        testID="dep-swiper"
        style={{ width: 200, height: 100 }}
        wait-for={[waitFor] as any}
        simultaneous-handlers={[simultaneous] as any}
      >
        <MpxSwiperItem item-id="one" enable-var={false}>
          <Text>One</Text>
        </MpxSwiperItem>
        <MpxSwiperItem item-id="two" enable-var={false}>
          <Text>Two</Text>
        </MpxSwiperItem>
      </MpxSwiper>
    )
    let gesture = __getLastPanGesture()
    expect(gesture.simultaneousWithExternalGesture).toHaveBeenCalledWith(simultaneous)
    expect(gesture.requireExternalGestureToFail).toHaveBeenCalledWith(waitFor)

    rerender(
      <MpxSwiper
        testID="dep-swiper"
        style={{ width: 200, height: 100 }}
        wait-for={[nextWaitFor] as any}
        simultaneous-handlers={[nextSimultaneous] as any}
      >
        <MpxSwiperItem item-id="one" enable-var={false}>
          <Text>One</Text>
        </MpxSwiperItem>
        <MpxSwiperItem item-id="two" enable-var={false}>
          <Text>Two</Text>
        </MpxSwiperItem>
      </MpxSwiper>
    )
    gesture = __getLastPanGesture()
    expect(gesture.simultaneousWithExternalGesture).toHaveBeenCalledWith(nextSimultaneous)
    expect(gesture.requireExternalGestureToFail).toHaveBeenCalledWith(nextWaitFor)
  })

  it('wraps across both circular boundaries', () => {
    const { __getLastPanGesture } = require('react-native-gesture-handler')
    const { __flushAnimatedReactions, withTiming } = require('react-native-reanimated')
    const circularChange = jest.fn()
    render(
      <MpxSwiper
        testID="circular-edge"
        style={{ width: 200, height: 100 }}
        circular={true}
        bindchange={circularChange}
      >
        <MpxSwiperItem item-id="one" enable-var={false}>
          <Text>One</Text>
        </MpxSwiperItem>
        <MpxSwiperItem item-id="two" enable-var={false}>
          <Text>Two</Text>
        </MpxSwiperItem>
      </MpxSwiper>
    )
    fireEvent(screen.getByTestId('circular-edge'), 'layout', {
      nativeEvent: { layout: { width: 200, height: 100 } }
    })
    const gesture = __getLastPanGesture()
    withTiming.mockClear()
    act(() => {
      gesture.onBeginCallback({ absoluteX: 0, velocityX: 0 })
      gesture.onUpdateCallback({ absoluteX: 120, velocityX: 0 })
      gesture.onFinalizeCallback({ absoluteX: 120, velocityX: 0 })
      __flushAnimatedReactions()
    })
    expect(withTiming).toHaveBeenCalledWith(-0, expect.objectContaining({ duration: 500 }), expect.any(Function))
    expect(circularChange).toHaveBeenCalledWith(expect.objectContaining({
      detail: { current: 1, source: 'touch' }
    }))
    circularChange.mockClear()
    withTiming.mockClear()
    act(() => {
      gesture.onBeginCallback({ absoluteX: 0, velocityX: 0 })
      gesture.onUpdateCallback({ absoluteX: -450, velocityX: 0 })
      gesture.onFinalizeCallback({ absoluteX: -450, velocityX: 200 })
      __flushAnimatedReactions()
    })
    expect(withTiming).toHaveBeenCalledWith(-600, expect.objectContaining({ duration: 500 }), expect.any(Function))
    expect(circularChange).toHaveBeenCalledWith(expect.objectContaining({
      detail: { current: 0, source: 'touch' }
    }))
  })

  it('rolls back a circular swiper with one item', () => {
    const { __getLastPanGesture } = require('react-native-gesture-handler')
    const { withTiming } = require('react-native-reanimated')
    render(
      <MpxSwiper
        testID="circular-one"
        style={{ width: 200, height: 100 }}
        circular={true}
      >
        <MpxSwiperItem item-id="only" enable-var={false}>
          <Text>Only</Text>
        </MpxSwiperItem>
      </MpxSwiper>
    )
    fireEvent(screen.getByTestId('circular-one'), 'layout', {
      nativeEvent: { layout: { width: 200, height: 100 } }
    })
    const gesture = __getLastPanGesture()
    withTiming.mockClear()
    act(() => {
      gesture.onBeginCallback({ absoluteX: 0, velocityX: 0 })
      gesture.onUpdateCallback({ absoluteX: 80, velocityX: 0 })
      gesture.onFinalizeCallback({ absoluteX: 80, velocityX: 0 })
    })
    expect(withTiming).toHaveBeenCalledWith(0, expect.objectContaining({ duration: 500 }))
  })

  it('handles a vertical swiper without an initial size', () => {
    jest.useFakeTimers()
    const { __getLastPanGesture } = require('react-native-gesture-handler')
    const { cancelAnimation, withTiming } = require('react-native-reanimated')
    render(
      <MpxSwiper
        testID="zero-sized-swiper"
        style={{}}
        vertical={true}
        autoplay={true}
        interval={10}
        indicator-dots={true}
        indicator-color=""
        indicator-active-color=""
        indicator-margin={0}
        previous-margin="10"
        next-margin="20"
      >
        <MpxSwiperItem item-id="top" enable-var={false}>
          <Text>Top</Text>
        </MpxSwiperItem>
        <MpxSwiperItem item-id="bottom" enable-var={false}>
          <Text>Bottom</Text>
        </MpxSwiperItem>
      </MpxSwiper>
    )

    const gesture = __getLastPanGesture()
    act(() => {
      gesture.onBeginCallback({ absoluteY: 0, velocityY: 0 })
      jest.advanceTimersByTime(10)
    })
    expect(cancelAnimation).not.toHaveBeenCalled()
    expect(withTiming).not.toHaveBeenCalled()

    fireEvent(screen.getByTestId('zero-sized-swiper'), 'layout', {
      nativeEvent: { layout: { width: 200, height: 100 } }
    })
    expect(gesture.activeOffsetY).toHaveBeenCalled()
  })

  it('resumes autoplay after a slow gesture and handles non-circular boundaries', () => {
    jest.useFakeTimers()
    const { __getLastPanGesture } = require('react-native-gesture-handler')
    const { withTiming } = require('react-native-reanimated')
    const autoplayRender = render(
      <MpxSwiper
        testID="autoplay-gesture-swiper"
        style={{ width: 200, height: 100 }}
        autoplay={true}
        interval={1000}
      >
        <MpxSwiperItem item-id="one" enable-var={false}>
          <Text>One</Text>
        </MpxSwiperItem>
        <MpxSwiperItem item-id="two" enable-var={false}>
          <Text>Two</Text>
        </MpxSwiperItem>
      </MpxSwiper>
    )
    fireEvent(screen.getByTestId('autoplay-gesture-swiper'), 'layout', {
      nativeEvent: { layout: { width: 200, height: 100 } }
    })
    let gesture = __getLastPanGesture()
    withTiming.mockClear()
    act(() => {
      gesture.onBeginCallback({ absoluteX: 0, velocityX: 0 })
      gesture.onUpdateCallback({ absoluteX: -40, velocityX: 0 })
      gesture.onFinalizeCallback({ absoluteX: -40, velocityX: 0 })
    })
    expect(withTiming).toHaveBeenCalledWith(0, expect.objectContaining({ duration: 500 }), expect.any(Function))
    expect(jest.getTimerCount()).toBe(1)
    autoplayRender.unmount()

    const startBoundaryRender = render(
      <MpxSwiper testID="start-boundary-swiper" style={{ width: 200, height: 100 }}>
        <MpxSwiperItem item-id="one" enable-var={false}>
          <Text>One</Text>
        </MpxSwiperItem>
        <MpxSwiperItem item-id="two" enable-var={false}>
          <Text>Two</Text>
        </MpxSwiperItem>
      </MpxSwiper>
    )
    gesture = __getLastPanGesture()
    withTiming.mockClear()
    act(() => {
      gesture.onBeginCallback({ absoluteX: 0, velocityX: 0 })
      gesture.onFinalizeCallback({ absoluteX: 80, velocityX: 0 })
    })
    expect(withTiming).toHaveBeenCalledWith(-0, expect.objectContaining({ duration: 500 }), expect.any(Function))
    startBoundaryRender.unmount()

    render(
      <MpxSwiper testID="end-boundary-swiper" style={{ width: 200, height: 100 }} current={1}>
        <MpxSwiperItem item-id="one" enable-var={false}>
          <Text>One</Text>
        </MpxSwiperItem>
        <MpxSwiperItem item-id="two" enable-var={false}>
          <Text>Two</Text>
        </MpxSwiperItem>
      </MpxSwiper>
    )
    gesture = __getLastPanGesture()
    withTiming.mockClear()
    act(() => {
      gesture.onBeginCallback({ absoluteX: 0, velocityX: 0 })
      gesture.onUpdateCallback({ absoluteX: -80, velocityX: 0 })
      gesture.onFinalizeCallback({ absoluteX: -80, velocityX: 0 })
    })
    expect(withTiming).toHaveBeenCalledWith(-200, expect.objectContaining({ duration: 500 }), expect.any(Function))
  })

  it('handles circular upper-boundary reset and slow rollback', () => {
    const { __getLastPanGesture } = require('react-native-gesture-handler')
    const { withTiming } = require('react-native-reanimated')
    const boundaryRender = render(
      <MpxSwiper testID="circular-upper-boundary" style={{ width: 200, height: 100 }} circular={true}>
        <MpxSwiperItem item-id="one" enable-var={false}>
          <Text>One</Text>
        </MpxSwiperItem>
        <MpxSwiperItem item-id="two" enable-var={false}>
          <Text>Two</Text>
        </MpxSwiperItem>
      </MpxSwiper>
    )
    let gesture = __getLastPanGesture()
    withTiming.mockClear()
    act(() => {
      gesture.onBeginCallback({ absoluteX: 0, velocityX: 0 })
      gesture.onUpdateCallback({ absoluteX: 250, velocityX: 0 })
      gesture.onFinalizeCallback({ absoluteX: 250, velocityX: 0 })
    })
    expect(withTiming).toHaveBeenCalled()
    boundaryRender.unmount()

    render(
      <MpxSwiper testID="circular-slow-rollback" style={{ width: 200, height: 100 }} circular={true}>
        <MpxSwiperItem item-id="one" enable-var={false}>
          <Text>One</Text>
        </MpxSwiperItem>
        <MpxSwiperItem item-id="two" enable-var={false}>
          <Text>Two</Text>
        </MpxSwiperItem>
      </MpxSwiper>
    )
    gesture = __getLastPanGesture()
    withTiming.mockClear()
    act(() => {
      gesture.onBeginCallback({ absoluteX: 0, velocityX: 0 })
      gesture.onUpdateCallback({ absoluteX: -40, velocityX: 0 })
      gesture.onFinalizeCallback({ absoluteX: -40, velocityX: 0 })
    })
    expect(withTiming).toHaveBeenCalledWith(-200, expect.objectContaining({ duration: 500 }), expect.any(Function))
  })
})
