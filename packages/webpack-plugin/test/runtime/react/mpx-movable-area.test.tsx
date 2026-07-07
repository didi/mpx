/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { act } from '@testing-library/react-native'
import { Text } from 'react-native'
import { renderWithRoute, resetMpxRuntimeGlobals } from './rn-component-test-utils'

const MpxMovableArea = require('../../../lib/runtime/components/react/mpx-movable-area').default
const MpxMovableView = require('../../../lib/runtime/components/react/mpx-movable-view').default

beforeEach(() => {
  jest.clearAllMocks()
  resetMpxRuntimeGlobals()
})

describe('MpxMovableArea', () => {
  it('provides movable area context and dispatches movable view gesture events', () => {
    const bindchange = jest.fn()
    const bindtouchstart = jest.fn()
    const bindtouchmove = jest.fn()
    const bindtouchend = jest.fn()
    const { __getLastPanGesture } = require('react-native-gesture-handler')

    renderWithRoute(
      <MpxMovableArea style={{ width: 300, height: 200 }}>
        <MpxMovableView
          id="mv"
          direction="all"
          x={10}
          y={20}
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

    const gesture = __getLastPanGesture()
    const touchEvent: any = {
      changedTouches: [{ x: 0, y: 0, absoluteX: 0, absoluteY: 10 }],
      allTouches: [{ x: 0, y: 0, absoluteX: 0, absoluteY: 10 }]
    }
    act(() => {
      gesture.onTouchesDownCallback(touchEvent)
      gesture.onStartCallback()
      gesture.onTouchesMoveCallback({
        changedTouches: [{ x: 40, y: 10, absoluteX: 40, absoluteY: 20 }],
        allTouches: [{ x: 40, y: 10, absoluteX: 40, absoluteY: 20 }]
      })
      gesture.onUpdateCallback({ translationX: 40, translationY: 10 })
      gesture.onTouchesUpCallback(touchEvent)
      gesture.onEndCallback({ velocityX: 100, velocityY: 60 })
    })

    expect(bindtouchstart).toHaveBeenCalled()
    expect(bindtouchmove).toHaveBeenCalled()
    expect(bindtouchend).toHaveBeenCalled()
    expect(bindchange).toHaveBeenCalled()
  })
})
