/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { act, fireEvent, render } from '@testing-library/react-native'
import { Keyboard, Text } from 'react-native'
import { getViews, resetMpxRuntimeGlobals } from './rn-component-test-utils'

const MpxKeyboardAvoidingView = require('../../../lib/runtime/components/react/mpx-keyboard-avoiding-view').default
const { KeyboardAvoidContext } = require('../../../lib/runtime/components/react/context')

beforeEach(() => {
  jest.clearAllMocks()
  resetMpxRuntimeGlobals()
})

describe('MpxKeyboardAvoidingView', () => {
  it('animates keyboard avoidance and dismisses keyboard on outside touch', () => {
    jest.useFakeTimers()
    const measure = jest.fn((callback) => {
      // eslint-disable-next-line node/no-callback-literal
      callback(0, 0, 100, 40, 0, 620)
    })
    const blur = jest.fn()
    const inputRef = {
      current: {
        measure,
        isFocused: () => true,
        blur
      }
    }
    const keyboardAvoid = {
      current: {
        cursorSpacing: 20,
        ref: inputRef,
        adjustPosition: true,
        onKeyboardShow: jest.fn()
      }
    }

    render(
      <KeyboardAvoidContext.Provider value={keyboardAvoid as any}>
        <MpxKeyboardAvoidingView>
          <Text>keyboard body</Text>
        </MpxKeyboardAvoidingView>
      </KeyboardAvoidContext.Provider>
    )

    const show = (Keyboard.addListener as jest.Mock).mock.calls.find(([type]) => type === 'keyboardWillShow')[1]
    const hide = (Keyboard.addListener as jest.Mock).mock.calls.find(([type]) => type === 'keyboardWillHide')[1]
    act(() => {
      show({ endCoordinates: { height: 300, screenY: 500 } })
      jest.advanceTimersByTime(40)
    })
    expect(keyboardAvoid.current.onKeyboardShow).toHaveBeenCalled()
    act(() => {
      hide()
    })

    ;(Keyboard.isVisible as jest.Mock).mockReturnValueOnce(true)
    fireEvent(getViews()[0], 'touchEnd', { nativeEvent: {} })
    expect(Keyboard.dismiss).toHaveBeenCalled()
    jest.useRealTimers()
  })

  it('keeps keyboard for input-origin and hold-keyboard touches, then resets focused input', () => {
    jest.useFakeTimers()
    const blur = jest.fn()
    const keyboardAvoid = {
      current: {
        cursorSpacing: 0,
        holdKeyboard: true,
        ref: {
          current: {
            measure: jest.fn((callback) => {
              // eslint-disable-next-line node/no-callback-literal
              callback(0, 0, 100, 40, 0, 620)
            }),
            isFocused: () => true,
            blur
          }
        },
        adjustPosition: true,
        onKeyboardShow: jest.fn()
      }
    }

    render(
      <KeyboardAvoidContext.Provider value={keyboardAvoid as any}>
        <MpxKeyboardAvoidingView>
          <Text>keyboard hold body</Text>
        </MpxKeyboardAvoidingView>
      </KeyboardAvoidContext.Provider>
    )

    ;(Keyboard.isVisible as jest.Mock).mockReturnValue(true)
    fireEvent(getViews()[0], 'touchEnd', { nativeEvent: { origin: 'input' } })
    fireEvent(getViews()[0], 'touchMove', { nativeEvent: {} })
    expect(Keyboard.dismiss).not.toHaveBeenCalled()

    keyboardAvoid.current.holdKeyboard = false
    const show = (Keyboard.addListener as jest.Mock).mock.calls.find(([type]) => type === 'keyboardWillShow')[1]
    const hide = (Keyboard.addListener as jest.Mock).mock.calls.find(([type]) => type === 'keyboardWillHide')[1]
    act(() => {
      show({ endCoordinates: { height: 200, screenY: 500 } })
      jest.advanceTimersByTime(40)
    })
    delete keyboardAvoid.current.onKeyboardShow
    act(() => {
      hide()
    })
    expect(blur).toHaveBeenCalled()
    expect(keyboardAvoid.current).toBeNull()
    jest.useRealTimers()
  })

  it('handles keyboard hide before show, readyToShow and missing current guards', () => {
    jest.useFakeTimers()
    const keyboardAvoid: any = {
      current: {
        readyToShow: true,
        ref: {
          current: {
            measure: jest.fn((callback) => {
              // eslint-disable-next-line node/no-callback-literal
              callback(0, 0, 100, 40, 0, 620)
            }),
            isFocused: () => false,
            blur: jest.fn()
          }
        },
        adjustPosition: false,
        onKeyboardShow: jest.fn()
      }
    }

    render(
      <KeyboardAvoidContext.Provider value={keyboardAvoid}>
        <MpxKeyboardAvoidingView>
          <Text>keyboard guard body</Text>
        </MpxKeyboardAvoidingView>
      </KeyboardAvoidContext.Provider>
    )

    const show = (Keyboard.addListener as jest.Mock).mock.calls.find(([type]) => type === 'keyboardWillShow')[1]
    const hide = (Keyboard.addListener as jest.Mock).mock.calls.find(([type]) => type === 'keyboardWillHide')[1]
    act(() => {
      hide()
      show({ endCoordinates: { height: 100, screenY: 700 } })
      show({ endCoordinates: { height: 120, screenY: 680 } })
      jest.advanceTimersByTime(40)
    })
    expect(keyboardAvoid.current.readyToShow).toBe(false)

    keyboardAvoid.current = null
    act(() => {
      show({ endCoordinates: { height: 100, screenY: 700 } })
      jest.advanceTimersByTime(40)
    })
    jest.useRealTimers()
  })
})
