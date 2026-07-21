import { act, fireEvent } from '@testing-library/react-native'

type TouchOverrides = {
  touches?: Array<Record<string, number>>
  changedTouches?: Array<Record<string, number>>
}

const touchPoint = { identifier: 1, pageX: 10, pageY: 20 }

export function createTouchEvent (overrides: TouchOverrides = {}) {
  const changedTouches = overrides.changedTouches || [touchPoint]
  return {
    nativeEvent: {
      timestamp: 1,
      pageX: 10,
      pageY: 20,
      touches: overrides.touches || changedTouches,
      changedTouches
    },
    currentTarget: {},
    target: {},
    persist: jest.fn(),
    stopPropagation: jest.fn(),
    preventDefault: jest.fn()
  }
}

export function fireTap (element: any) {
  fireEvent(element, 'touchStart', createTouchEvent())
  fireEvent(element, 'touchEnd', createTouchEvent({ touches: [] }))
}

export function getTouchableView (views: Array<any>) {
  return views.find((node) => node.props.onTouchStart && node.props.onTouchEnd)
}

export async function flushImageSize () {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}
