import React from 'react'
import { act, render, screen } from '@testing-library/react-native'
import { View } from 'react-native'
import useInnerProps, { getCustomEvent } from '../../../lib/runtime/components/react/getInnerListeners'
import { createTouchEvent } from './helpers'

function EventProbe ({ eventProps, rawConfig }: { eventProps?: Record<string, any>, rawConfig?: Record<string, any> }) {
  const innerProps = useInnerProps(eventProps, ['removed'], rawConfig)
  return React.createElement(View, Object.assign({ testID: 'event-probe' }, innerProps))
}

function DefaultProbe () {
  return React.createElement(View, Object.assign({ testID: 'default-probe' }, useInnerProps()))
}

describe('getInnerListeners', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('builds custom events with defaults, dataset and layout offsets', () => {
    const persist = jest.fn()
    expect(getCustomEvent(undefined, undefined, {})).toEqual(expect.objectContaining({
      type: '',
      detail: {},
      target: expect.objectContaining({ id: '', offsetLeft: 0, offsetTop: 0 })
    }))

    expect(getCustomEvent('change', { target: { nativeID: 'native' }, persist }, {
      detail: { value: 1 },
      layoutRef: { current: { offsetLeft: 3, offsetTop: 4 } }
    }, {
      id: 'picker',
      'data-kind': 'city'
    })).toEqual(expect.objectContaining({
      type: 'change',
      detail: { value: 1 },
      persist,
      target: expect.objectContaining({
        id: 'picker',
        dataset: { kind: 'city' },
        offsetLeft: 3,
        offsetTop: 4
      })
    }))
  })

  it('handles catch, capture, longpress, movement, cancel and disabled tap branches', () => {
    jest.useFakeTimers()
    const handlers = {
      catchtap: jest.fn(),
      catchlongpress: jest.fn(),
      catchtouchstart: jest.fn(),
      catchtouchmove: jest.fn(),
      catchtouchend: jest.fn(),
      catchtouchcancel: jest.fn(),
      'capture-catchtap': jest.fn(),
      'capture-catchlongpress': jest.fn(),
      'capture-catchtouchstart': jest.fn(),
      'capture-catchtouchmove': jest.fn(),
      'capture-catchtouchend': jest.fn(),
      'capture-catchtouchcancel': jest.fn()
    }
    const { rerender } = render(
      <EventProbe
        eventProps={Object.assign({
          id: 'root',
          'data-role': 'button',
          removed: true,
          children: 'removed child'
        }, handlers)}
        rawConfig={{
          navigation: { layout: { top: 5 } },
          layoutRef: { current: { offsetLeft: 7, offsetTop: 8 } }
        }}
      />
    )
    let probe = screen.getByTestId('event-probe')
    expect(probe.props.removed).toBeUndefined()
    expect(probe.props.children).toBeUndefined()

    const longpressEvent: any = createTouchEvent()
    longpressEvent._targetInst = { pendingProps: { parentId: 'child', 'data-child': 'yes' } }
    probe.props.onTouchStart(longpressEvent)
    act(() => {
      jest.advanceTimersByTime(350)
    })
    expect(longpressEvent.persist).toHaveBeenCalled()
    expect(longpressEvent.stopPropagation).toHaveBeenCalled()
    expect(handlers.catchtouchstart).toHaveBeenCalledWith(expect.objectContaining({ type: 'touchstart' }))
    expect(handlers.catchlongpress).toHaveBeenCalledWith(expect.objectContaining({
      type: 'longpress',
      detail: { x: 10, y: 15 },
      currentTarget: expect.objectContaining({ id: 'root', offsetLeft: 7, offsetTop: 8 }),
      target: expect.objectContaining({ id: 'child', dataset: { child: 'yes' } })
    }))

    probe.props.onTouchEnd(createTouchEvent({ touches: [] }))
    expect(handlers.catchtap).not.toHaveBeenCalled()

    const stoppedLongpressEvent: any = createTouchEvent()
    stoppedLongpressEvent._stoppedEventTypes = new Set(['longpress'])
    probe.props.onTouchStart(stoppedLongpressEvent)
    act(() => {
      jest.advanceTimersByTime(350)
    })
    expect(handlers.catchlongpress).toHaveBeenCalledTimes(1)
    probe.props.onTouchCancel(createTouchEvent({ touches: [] }))

    const tapStart: any = createTouchEvent()
    const tapEnd: any = createTouchEvent({ touches: [] })
    probe.props.onTouchStart(tapStart)
    probe.props.onTouchEnd(tapEnd)
    expect(tapEnd.stopPropagation).toHaveBeenCalled()
    expect(handlers.catchtouchend).toHaveBeenCalledWith(expect.objectContaining({ type: 'touchend' }))
    expect(handlers.catchtap).toHaveBeenCalledTimes(1)

    const captureStart: any = createTouchEvent({
      changedTouches: [{ identifier: 2, pageX: 10, pageY: 20 }]
    })
    const captureEnd: any = createTouchEvent({
      touches: [],
      changedTouches: [{ identifier: 2, pageX: 10, pageY: 20 }]
    })
    probe.props.onTouchStartCapture(captureStart)
    probe.props.onTouchEndCapture(captureEnd)
    probe.props.onTouchEnd(captureEnd)
    expect(captureStart.stopPropagation).toHaveBeenCalled()
    expect(captureEnd.stopPropagation).toHaveBeenCalled()
    expect(handlers['capture-catchtouchstart']).toHaveBeenCalledWith(expect.objectContaining({ type: 'touchstart' }))
    expect(handlers['capture-catchtouchend']).toHaveBeenCalledWith(expect.objectContaining({ type: 'touchend' }))
    expect(handlers['capture-catchtap']).toHaveBeenCalledTimes(1)
    expect(handlers.catchtap).toHaveBeenCalledTimes(1)

    const moveStart: any = createTouchEvent({
      changedTouches: [{ identifier: 3, pageX: 10, pageY: 20 }]
    })
    probe.props.onTouchStart(moveStart)
    probe.props.onTouchMove(createTouchEvent({
      changedTouches: [{ identifier: 3, pageX: 20, pageY: 30 }]
    }))
    probe.props.onTouchEnd(createTouchEvent({
      touches: [],
      changedTouches: [{ identifier: 3, pageX: 20, pageY: 30 }]
    }))
    expect(handlers.catchtouchmove).toHaveBeenCalled()

    probe.props.onTouchStart(createTouchEvent({
      touches: [
        { identifier: 4, pageX: 10, pageY: 20 },
        { identifier: 5, pageX: 30, pageY: 40 }
      ]
    }))
    probe.props.onTouchCancel(createTouchEvent({ touches: [] }))
    probe.props.onTouchStartCapture(createTouchEvent())
    probe.props.onTouchMoveCapture(createTouchEvent())
    probe.props.onTouchCancelCapture(createTouchEvent({ touches: [] }))
    expect(handlers.catchtouchcancel).toHaveBeenCalled()
    expect(handlers['capture-catchtouchmove']).toHaveBeenCalled()
    expect(handlers['capture-catchtouchcancel']).toHaveBeenCalled()

    const bindtap = jest.fn()
    rerender(<EventProbe eventProps={{ bindtap }} rawConfig={{ disableTap: true }} />)
    probe = screen.getByTestId('event-probe')
    probe.props.onTouchStart(createTouchEvent())
    probe.props.onTouchEnd(createTouchEvent({ touches: [] }))
    expect(bindtap).not.toHaveBeenCalled()
  })

  it('returns only regular props when no event handlers are registered', () => {
    render(<DefaultProbe />)
    expect(screen.getByTestId('default-probe').props).toEqual({ testID: 'default-probe' })
  })

  it('uses zero current-target offsets when touch layout is unavailable', () => {
    const bindtap = jest.fn()
    render(<EventProbe eventProps={{ bindtap }} />)
    const probe = screen.getByTestId('event-probe')

    probe.props.onTouchStart(createTouchEvent())
    probe.props.onTouchEnd(createTouchEvent({ touches: [] }))

    expect(bindtap).toHaveBeenCalledWith(expect.objectContaining({
      currentTarget: expect.objectContaining({ offsetLeft: 0, offsetTop: 0 })
    }))
  })
})
