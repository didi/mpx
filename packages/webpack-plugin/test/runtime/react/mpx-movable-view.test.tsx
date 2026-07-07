/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { act, fireEvent, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { renderWithRoute, resetMpxRuntimeGlobals } from './rn-component-test-utils'

const MpxMovableArea = require('../../../lib/runtime/components/react/mpx-movable-area').default
const MpxMovableView = require('../../../lib/runtime/components/react/mpx-movable-view').default
const { RouteContext } = require('../../../lib/runtime/components/react/context')

beforeEach(() => {
  jest.clearAllMocks()
  resetMpxRuntimeGlobals()
})

describe('MpxMovableView', () => {
  it('handles out-of-bounds, inertia, catch handlers and gesture coordination', () => {
    const bindchange = jest.fn()
    const catchtouchstart = jest.fn()
    const catchtouchmove = jest.fn()
    const catchtouchend = jest.fn()
    const { __getLastPanGesture } = require('react-native-gesture-handler')
    const waitFor = { current: { name: 'wait' } }
    const simultaneous = { current: { name: 'simultaneous' } }

    renderWithRoute(
      <MpxMovableArea style={{ width: 100, height: 100 }}>
        <MpxMovableView
          testID="bounded-movable"
          id="bounded"
          direction="horizontal"
          style={{ width: 50, height: 50, position: 'absolute', left: 10, top: 5 }}
          x={0}
          y={0}
          out-of-bounds={true}
          inertia={true}
          friction={0}
          damping={0.1}
          catchtouchstart={catchtouchstart}
          catchtouchmove={catchtouchmove}
          catchtouchend={catchtouchend}
          bindchange={bindchange}
          wait-for={[waitFor] as any}
          simultaneous-handlers={[simultaneous] as any}
        >
          <Text>bounded</Text>
        </MpxMovableView>
      </MpxMovableArea>,
      { layout: { top: 0 } }
    )

    fireEvent(screen.getByTestId('bounded-movable'), 'layout', {
      nativeEvent: { layout: { width: 50, height: 50 } }
    })
    const gesture = __getLastPanGesture()
    const startEvent: any = {
      changedTouches: [{ x: 0, y: 0, absoluteX: 0, absoluteY: 0 }],
      allTouches: [{ x: 0, y: 0, absoluteX: 0, absoluteY: 0 }]
    }
    act(() => {
      gesture.onTouchesDownCallback(startEvent)
      gesture.onStartCallback()
      gesture.onTouchesMoveCallback({
        changedTouches: [{ x: 80, y: 5, absoluteX: 80, absoluteY: 5 }],
        allTouches: [{ x: 80, y: 5, absoluteX: 80, absoluteY: 5 }]
      })
      gesture.onUpdateCallback({ translationX: 80, translationY: 5 })
      gesture.onTouchesUpCallback(startEvent)
      gesture.onEndCallback({ velocityX: 300, velocityY: 0 })
    })

    expect(catchtouchstart).toHaveBeenCalled()
    expect(catchtouchmove).toHaveBeenCalled()
    expect(catchtouchend).toHaveBeenCalled()
    expect(bindchange).toHaveBeenCalled()
    expect(gesture.activeOffsetX).toHaveBeenCalledWith([-5, 5])
    expect(gesture.simultaneousWithExternalGesture).toHaveBeenCalled()
    expect(gesture.requireExternalGestureToFail).toHaveBeenCalled()
  })

  it('handles vertical and disabled movable branches', () => {
    const bindvtouchmove = jest.fn()
    const { __getLastPanGesture } = require('react-native-gesture-handler')
    const { rerender } = renderWithRoute(
      <MpxMovableArea style={{ width: 100, height: 100 }}>
        <MpxMovableView
          direction="vertical"
          y={10}
          bindvtouchmove={bindvtouchmove}
          disable-event-passthrough={false}
        >
          <Text>vertical movable</Text>
        </MpxMovableView>
      </MpxMovableArea>
    )
    let gesture = __getLastPanGesture()
    act(() => {
      gesture.onTouchesDownCallback({ changedTouches: [{ x: 0, y: 0 }], allTouches: [{ absoluteX: 0, absoluteY: 0 }] })
      gesture.onStartCallback()
      gesture.onTouchesMoveCallback({ changedTouches: [{ x: 0, y: 30, absoluteX: 0, absoluteY: 30 }], allTouches: [{ absoluteX: 0, absoluteY: 30 }] })
      gesture.onUpdateCallback({ translationX: 0, translationY: 30 })
    })
    expect(bindvtouchmove).toHaveBeenCalled()
    expect(gesture.activeOffsetY).toHaveBeenCalledWith([-5, 5])

    rerender(
      <RouteContext.Provider value={{ pageId: 1, navigation: {} }}>
        <MpxMovableArea style={{ width: 100, height: 100 }}>
          <MpxMovableView direction="all" disabled={true}>
            <Text>disabled movable</Text>
          </MpxMovableView>
        </MpxMovableArea>
      </RouteContext.Provider>
    )
    gesture = __getLastPanGesture()
    act(() => {
      gesture.onStartCallback()
      gesture.onUpdateCallback({ translationX: 50, translationY: 50 })
      gesture.onEndCallback({ velocityX: 50, velocityY: 50 })
    })
    expect(screen.getByText('disabled movable')).toBeTruthy()
  })

  it('handles prop updates, percent layout and area boundary changes', () => {
    const bindchange = jest.fn()
    const onLayout = jest.fn()
    const { rerender } = renderWithRoute(
      <MpxMovableArea style={{ width: 120, height: 120 }}>
        <MpxMovableView
          testID="percent-movable"
          direction="all"
          style={{ width: '50%', height: '50%', position: 'absolute', left: 10, top: 10 }}
          x={0}
          y={0}
          bindchange={bindchange}
          onLayout={onLayout}
        >
          <Text>percent movable</Text>
        </MpxMovableView>
      </MpxMovableArea>,
      { layout: { top: 0 } }
    )

    fireEvent(screen.getByTestId('percent-movable'), 'layout', {
      nativeEvent: { layout: { width: 60, height: 60 } }
    })
    expect(onLayout).toHaveBeenCalled()

    rerender(
      <RouteContext.Provider value={{ pageId: 1, navigation: { layout: { top: 0 } } }}>
        <MpxMovableArea style={{ width: 120, height: 120 }}>
          <MpxMovableView
            testID="percent-movable"
            direction="all"
            style={{ width: '50%', height: '50%', position: 'absolute', left: 10, top: 10 }}
            x={80}
            y={90}
            bindchange={bindchange}
          >
            <Text>percent movable</Text>
          </MpxMovableView>
        </MpxMovableArea>
      </RouteContext.Provider>
    )

    rerender(
      <RouteContext.Provider value={{ pageId: 1, navigation: { layout: { top: 0 } } }}>
        <MpxMovableArea style={{ width: 120, height: 120 }}>
          <MpxMovableView
            testID="percent-movable"
            direction="all"
            style={{ width: '50%', height: '50%', position: 'absolute', left: 10, top: 10 }}
            x={40}
            y={30}
            damping={0}
            bindchange={bindchange}
          >
            <Text>percent movable</Text>
          </MpxMovableView>
        </MpxMovableArea>
      </RouteContext.Provider>
    )

    rerender(
      <RouteContext.Provider value={{ pageId: 1, navigation: { layout: { top: 0 } } }}>
        <MpxMovableArea style={{ width: 20, height: 20 }}>
          <MpxMovableView
            testID="percent-movable"
            direction="all"
            style={{ width: '50%', height: '50%', position: 'absolute', left: 10, top: 10 }}
            x={40}
            y={30}
            bindchange={bindchange}
          >
            <Text>percent movable</Text>
          </MpxMovableView>
        </MpxMovableArea>
      </RouteContext.Provider>
    )

    expect(bindchange).toHaveBeenCalledWith(expect.objectContaining({
      detail: expect.objectContaining({ source: '' })
    }))
  })

  it('handles negative drag, vertical catch movement and out-of-bounds bounce', () => {
    const bindchange = jest.fn()
    const catchvtouchmove = jest.fn()
    const catchtouchmove = jest.fn()
    const { __getLastPanGesture } = require('react-native-gesture-handler')

    const firstRender = renderWithRoute(
      <MpxMovableArea style={{ width: 100, height: 100 }}>
        <MpxMovableView
          testID="negative-movable"
          direction="all"
          style={{ width: 50, height: 50, position: 'absolute', left: 10, top: 10 }}
          changeThrottleTime={0}
          catchvtouchmove={catchvtouchmove}
          catchtouchmove={catchtouchmove}
          bindchange={bindchange}
        >
          <Text>negative movable</Text>
        </MpxMovableView>
      </MpxMovableArea>,
      { layout: { top: 0 } }
    )

    fireEvent(screen.getByTestId('negative-movable'), 'layout', {
      nativeEvent: { layout: { width: 50, height: 50 } }
    })
    let gesture = __getLastPanGesture()
    act(() => {
      gesture.onTouchesDownCallback({
        changedTouches: [{ x: 0, y: 0, absoluteX: 0, absoluteY: 0 }],
        allTouches: [{ x: 0, y: 0, absoluteX: 0, absoluteY: 0 }]
      })
      gesture.onStartCallback()
      gesture.onTouchesMoveCallback({
        changedTouches: [{ x: 1, y: 40, absoluteX: 1, absoluteY: 40 }],
        allTouches: [{ x: 1, y: 40, absoluteX: 1, absoluteY: 40 }]
      })
      gesture.onUpdateCallback({ translationX: -80, translationY: -80 })
    })
    expect(catchvtouchmove).toHaveBeenCalled()
    expect(catchtouchmove).toHaveBeenCalled()

    firstRender.unmount()
    renderWithRoute(
      <MpxMovableArea style={{ width: 100, height: 100 }}>
        <MpxMovableView
          testID="bounce-movable"
          direction="all"
          out-of-bounds={true}
          style={{ width: 50, height: 50 }}
          changeThrottleTime={0}
          bindchange={bindchange}
        >
          <Text>bounce movable</Text>
        </MpxMovableView>
      </MpxMovableArea>,
      { layout: { top: 0 } }
    )

    fireEvent(screen.getByTestId('bounce-movable'), 'layout', {
      nativeEvent: { layout: { width: 50, height: 50 } }
    })
    gesture = __getLastPanGesture()
    act(() => {
      gesture.onTouchesDownCallback({
        changedTouches: [{ x: 0, y: 0, absoluteX: 0, absoluteY: 0 }],
        allTouches: [{ x: 0, y: 0, absoluteX: 0, absoluteY: 0 }]
      })
      gesture.onStartCallback()
      gesture.onTouchesMoveCallback({
        changedTouches: [{ x: -25, y: 10, absoluteX: -25, absoluteY: 10 }],
        allTouches: [{ x: -25, y: 10, absoluteX: -25, absoluteY: 10 }]
      })
      gesture.onUpdateCallback({ translationX: -25, translationY: 10 })
      gesture.onTouchesMoveCallback({
        changedTouches: [{ x: -25, y: -25, absoluteX: -25, absoluteY: -25 }],
        allTouches: [{ x: -25, y: -25, absoluteX: -25, absoluteY: -25 }]
      })
      gesture.onUpdateCallback({ translationX: -25, translationY: -25 })
      gesture.onEndCallback({ velocityX: 0, velocityY: 0 })
    })

    expect(bindchange).toHaveBeenCalled()
  })

  it('handles vertical inertia, lower friction clamp and gesture dependency changes', () => {
    const bindchange = jest.fn()
    const { __getLastPanGesture } = require('react-native-gesture-handler')
    const waitFor = { current: { name: 'wait-a' } }
    const nextWaitFor = { current: { name: 'wait-b' } }
    const { rerender } = renderWithRoute(
      <MpxMovableArea style={{ width: 100, height: 100 }}>
        <MpxMovableView
          direction="all"
          inertia={true}
          x={10}
          y={10}
          wait-for={[waitFor] as any}
          bindchange={bindchange}
        >
          <Text>inertia movable</Text>
        </MpxMovableView>
      </MpxMovableArea>
    )

    let gesture = __getLastPanGesture()
    act(() => {
      gesture.onStartCallback()
      gesture.onEndCallback({ velocityX: 0, velocityY: -10000 })
    })
    expect(bindchange).toHaveBeenCalled()

    rerender(
      <RouteContext.Provider value={{ pageId: 1, navigation: {} }}>
        <MpxMovableArea style={{ width: 100, height: 100 }}>
          <MpxMovableView
            direction="all"
            inertia={true}
            x={10}
            y={10}
            wait-for={[nextWaitFor] as any}
            bindchange={bindchange}
          >
            <Text>inertia movable</Text>
          </MpxMovableView>
        </MpxMovableArea>
      </RouteContext.Provider>
    )
    gesture = __getLastPanGesture()
    expect(gesture.requireExternalGestureToFail).toHaveBeenCalled()
  })
})
