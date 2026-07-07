/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { renderWithPortalHost, resetMpxRuntimeGlobals } from './rn-component-test-utils'

const MpxSwiper = require('../../../lib/runtime/components/react/mpx-swiper').default
const MpxSwiperItem = require('../../../lib/runtime/components/react/mpx-swiper-item').default

beforeEach(() => {
  jest.clearAllMocks()
  resetMpxRuntimeGlobals()
})

describe('MpxSwiper', () => {
  it('renders swiper items, pagination and gesture configuration', () => {
    jest.useFakeTimers()
    const bindchange = jest.fn()
    const { __getLastPanGesture } = require('react-native-gesture-handler')
    render(
      <MpxSwiper
        testID="swiper"
        style={{ width: 300, height: 120 }}
        indicator-dots={true}
        autoplay={true}
        interval={10}
        circular={true}
        previous-margin="10"
        next-margin="10"
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
    const gesture = __getLastPanGesture()
    act(() => {
      gesture.onBeginCallback({ absoluteX: 0, velocityX: 0 })
      gesture.onUpdateCallback({ absoluteX: -180, velocityX: 0 })
      gesture.onFinalizeCallback({ absoluteX: -180, velocityX: 20 })
      jest.advanceTimersByTime(20)
    })
    expect(gesture.activeOffsetX).toHaveBeenCalled()
    jest.useRealTimers()
  })

  it('updates from props, autoplay and boundary gestures', () => {
    jest.useFakeTimers()
    const bindchange = jest.fn()
    const { __getLastPanGesture } = require('react-native-gesture-handler')
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
    act(() => {
      jest.advanceTimersByTime(20)
    })
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
    })

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
    gesture = __getLastPanGesture()
    act(() => {
      gesture.onBeginCallback({ absoluteX: 0, velocityX: 0 })
      gesture.onUpdateCallback({ absoluteX: -520, velocityX: 0 })
      gesture.onFinalizeCallback({ absoluteX: -520, velocityX: 150 })
    })
    expect(bindchange).toHaveBeenCalled()
    jest.useRealTimers()
  })

  it('covers vertical, single-item, no-gesture and fixed-position branches', () => {
    const { __getLastPanGesture } = require('react-native-gesture-handler')
    const { rerender } = render(
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
    let gesture = __getLastPanGesture()
    act(() => {
      gesture.onBeginCallback({ absoluteY: 0, velocityY: 0 })
      gesture.onUpdateCallback({ absoluteY: 60, velocityY: 0 })
      gesture.onFinalizeCallback({ absoluteY: 60, velocityY: 0 })
    })
    expect(gesture.activeOffsetY).toHaveBeenCalled()

    rerender(
      <MpxSwiper
        testID="plain-swiper"
        style={{ width: 200, height: 100 }}
        current={1}
        previous-margin="10"
        next-margin="20"
        enable-offset={true}
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
    fireEvent(screen.getByTestId('plain-swiper'), 'layout', {
      nativeEvent: { layout: { width: 240, height: 100 } }
    })
    expect(screen.queryByTestId('gesture-detector')).toBeNull()

    renderWithPortalHost(
      <MpxSwiper
        style={{ width: 200, height: 100, position: 'fixed' }}
        circular={true}
        current={1}
      >
        <MpxSwiperItem item-id="x" enable-var={false}>
          <Text>X</Text>
        </MpxSwiperItem>
        <MpxSwiperItem item-id="y" enable-var={false}>
          <Text>Y</Text>
        </MpxSwiperItem>
      </MpxSwiper>
    )
    gesture = __getLastPanGesture()
    act(() => {
      gesture.onBeginCallback({ absoluteX: 0, velocityX: 0 })
      gesture.onUpdateCallback({ absoluteX: -260, velocityX: 0 })
      gesture.onFinalizeCallback({ absoluteX: -260, velocityX: 200 })
    })
    expect(screen.getAllByText('X').length).toBeGreaterThan(0)
  })

  it('handles autoplay terminal page and circular rollover', () => {
    jest.useFakeTimers()
    const firstRender = render(
      <MpxSwiper
        testID="autoplay-last"
        style={{ width: 200, height: 100 }}
        current={1}
        autoplay={true}
        interval={10}
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
    act(() => {
      jest.advanceTimersByTime(20)
    })
    firstRender.unmount()

    render(
      <MpxSwiper
        testID="autoplay-circular"
        style={{ width: 200, height: 100 }}
        current={1}
        autoplay={true}
        circular={true}
        interval={10}
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
    act(() => {
      jest.advanceTimersByTime(20)
    })

    expect(screen.getAllByText('A').length).toBeGreaterThan(0)
    jest.useRealTimers()
  })

  it('handles margin, circular and children length updates', () => {
    jest.useFakeTimers()
    const { rerender } = render(
      <MpxSwiper
        testID="updating-swiper"
        style={{ width: 300, height: 120 }}
        current={2}
        autoplay={true}
        interval={10}
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
      jest.advanceTimersByTime(20)
    })

    expect(screen.getAllByText('One').length).toBeGreaterThan(0)
    jest.useRealTimers()
  })

  it('handles gesture dependencies and edge gesture paths', () => {
    const { __getLastPanGesture } = require('react-native-gesture-handler')
    const waitFor = { current: { name: 'wait-a' } }
    const nextWaitFor = { current: { name: 'wait-b' } }
    const simultaneous = { current: { name: 'simultaneous-a' } }
    const nextSimultaneous = { current: { name: 'simultaneous-b' } }
    const { rerender, unmount } = render(
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
    expect(gesture.simultaneousWithExternalGesture).toHaveBeenCalled()
    expect(gesture.requireExternalGestureToFail).toHaveBeenCalled()

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
    expect(gesture.simultaneousWithExternalGesture).toHaveBeenCalled()
    unmount()

    render(
      <MpxSwiper
        testID="circular-edge"
        style={{ width: 200, height: 100 }}
        circular={true}
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
    gesture = __getLastPanGesture()
    act(() => {
      gesture.onBeginCallback({ absoluteX: 0, velocityX: 0 })
      gesture.onUpdateCallback({ absoluteX: 120, velocityX: 0 })
      gesture.onFinalizeCallback({ absoluteX: 120, velocityX: 0 })
    })
    act(() => {
      gesture.onBeginCallback({ absoluteX: 0, velocityX: 0 })
      gesture.onUpdateCallback({ absoluteX: -1000, velocityX: 0 })
      gesture.onFinalizeCallback({ absoluteX: -1000, velocityX: 200 })
    })

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
    gesture = __getLastPanGesture()
    act(() => {
      gesture.onBeginCallback({ absoluteX: 0, velocityX: 0 })
      gesture.onUpdateCallback({ absoluteX: 80, velocityX: 0 })
      gesture.onFinalizeCallback({ absoluteX: 80, velocityX: 0 })
    })

    render(
      <MpxSwiper
        testID="boundary-swiper"
        style={{ width: 200, height: 100 }}
        current={1}
      >
        <MpxSwiperItem item-id="one" enable-var={false}>
          <Text>One</Text>
        </MpxSwiperItem>
        <MpxSwiperItem item-id="two" enable-var={false}>
          <Text>Two</Text>
        </MpxSwiperItem>
      </MpxSwiper>
    )
    fireEvent(screen.getByTestId('boundary-swiper'), 'layout', {
      nativeEvent: { layout: { width: 200, height: 100 } }
    })
    gesture = __getLastPanGesture()
    act(() => {
      gesture.onBeginCallback({ absoluteX: 0, velocityX: 0 })
      gesture.onFinalizeCallback({ absoluteX: -80, velocityX: 0 })
    })

    expect(screen.getAllByText('Two').length).toBeGreaterThan(0)
  })
})
