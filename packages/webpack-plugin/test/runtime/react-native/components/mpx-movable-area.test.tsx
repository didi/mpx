/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { expectPortalHostRendered, renderWithPortalHost, renderWithRoute, resetMpxRuntimeGlobals } from './rn-component-test-utils'

const MpxMovableArea = require('../../../../lib/runtime/components/react/mpx-movable-area').default
const MpxMovableView = require('../../../../lib/runtime/components/react/mpx-movable-view').default

beforeEach(() => {
  jest.clearAllMocks()
  resetMpxRuntimeGlobals()
})

describe('MpxMovableArea', () => {
  it('uses default dimensions when style is omitted', () => {
    render(
      <MpxMovableArea testID="unstyled-area">
        <Text>unstyled area</Text>
      </MpxMovableArea>
    )

    expect(screen.getByTestId('unstyled-area').props.style).toEqual(expect.objectContaining({
      width: 10,
      height: 10
    }))
  })

  it('provides movable area context and dispatches movable view gesture events', () => {
    const bindchange = jest.fn()
    const bindtouchstart = jest.fn()
    const bindtouchmove = jest.fn()
    const bindtouchend = jest.fn()
    const { __getLastPanGesture } = require('react-native-gesture-handler')

    renderWithRoute(
      <MpxMovableArea style={{ width: 300, height: 200 }}>
        <MpxMovableView
          testID="area-movable"
          id="mv"
          direction="all"
          style={{ width: 50, height: 50 }}
          x={10}
          y={20}
          changeThrottleTime={0}
          bindchange={bindchange}
          bindtouchstart={bindtouchstart}
          bindtouchmove={bindtouchmove}
          bindtouchend={bindtouchend}
        >
          <Text>move me</Text>
        </MpxMovableView>
      </MpxMovableArea>,
      { layout: { top: 5 } }
    )

    fireEvent(screen.getByTestId('area-movable'), 'layout', {
      nativeEvent: { layout: { width: 50, height: 50 } }
    })

    const gesture = __getLastPanGesture()
    const touchEvent: any = {
      changedTouches: [{ x: 0, y: 0, absoluteX: 0, absoluteY: 10 }],
      allTouches: [{ x: 0, y: 0, absoluteX: 0, absoluteY: 10 }]
    }
    act(() => {
      gesture.onTouchesDownCallback(touchEvent)
      gesture.onStartCallback()
      gesture.onTouchesMoveCallback({
        changedTouches: [{ x: 400, y: 300, absoluteX: 400, absoluteY: 310 }],
        allTouches: [{ x: 400, y: 300, absoluteX: 400, absoluteY: 310 }]
      })
      gesture.onUpdateCallback({ translationX: 400, translationY: 300 })
      gesture.onTouchesUpCallback(touchEvent)
      gesture.onEndCallback({ velocityX: 100, velocityY: 60 })
    })

    expect(bindtouchstart).toHaveBeenCalledWith(expect.objectContaining({
      currentTarget: expect.objectContaining({ id: 'mv' })
    }))
    expect(bindtouchmove).toHaveBeenCalledWith(expect.objectContaining({
      changedTouches: [expect.objectContaining({ pageX: 400, pageY: 305 })]
    }))
    expect(bindtouchend).toHaveBeenCalledWith(expect.objectContaining({
      touches: [],
      changedTouches: [expect.objectContaining({ pageX: 0, pageY: 5 })]
    }))
    expect(bindchange).toHaveBeenCalledWith(expect.objectContaining({
      type: 'change',
      detail: { x: 250, y: 150, source: 'touch' },
      target: expect.objectContaining({ id: 'mv' })
    }))
  })

  it('uses default dimensions and renders fixed areas in portal', () => {
    const fixedRender = renderWithPortalHost(
      <MpxMovableArea testID="default-area" style={{ position: 'fixed' }}>
        <Text>fixed area</Text>
      </MpxMovableArea>
    )

    expectPortalHostRendered(fixedRender.toJSON(), 'default-area')
    expect(screen.getByTestId('default-area').props.style).toEqual(expect.objectContaining({
      width: 10,
      height: 10,
      position: 'absolute'
    }))
    expect(screen.getByText('fixed area')).toBeTruthy()
  })
})
