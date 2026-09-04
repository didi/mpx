/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { act, render } from '@testing-library/react-native'
import { Keyboard, Text } from 'react-native'
import { withTiming } from 'react-native-reanimated'

;(global as any).__mpx_mode__ = 'android'

const MpxKeyboardAvoidingView = require('../../../../lib/runtime/components/react/mpx-keyboard-avoiding-view').default
const { KeyboardAvoidContext } = require('../../../../lib/runtime/components/react/context')

beforeEach(() => {
  jest.clearAllMocks()
  ;(global as any).__mpx_mode__ = 'android'
  ;(global as any).mpxGlobal = {
    __mpx: {
      config: {
        rnConfig: {
          enableNativeKeyboardAvoiding: true
        }
      }
    }
  }
})

afterAll(() => {
  (global as any).__mpx_mode__ = 'ios'
})

describe('MpxKeyboardAvoidingView android', () => {
  it('uses android keyboard listeners and native avoiding offsets', () => {
    const keyboardAvoid = {
      current: {
        cursorSpacing: 20,
        ref: {
          current: {
            measure: jest.fn((callback) => {
              // eslint-disable-next-line node/no-callback-literal
              callback(0, 0, 100, 40, 0, 620)
            }),
            isFocused: () => true,
            blur: jest.fn()
          }
        },
        adjustPosition: true,
        onKeyboardShow: jest.fn()
      }
    }

    render(
      <KeyboardAvoidContext.Provider value={keyboardAvoid as any}>
        <MpxKeyboardAvoidingView>
          <Text>android keyboard body</Text>
        </MpxKeyboardAvoidingView>
      </KeyboardAvoidContext.Provider>
    )

    const show = (Keyboard.addListener as jest.Mock).mock.calls.find(([type]) => type === 'keyboardDidShow')[1]
    const hide = (Keyboard.addListener as jest.Mock).mock.calls.find(([type]) => type === 'keyboardDidHide')[1]
    act(() => {
      show({ endCoordinates: { height: 300, screenY: 500 } })
      hide()
    })
    expect(keyboardAvoid.current.onKeyboardShow).toHaveBeenCalled()
    expect(keyboardAvoid.current.ref.current.measure).toHaveBeenCalled()
    expect(withTiming).toHaveBeenNthCalledWith(1, 20, expect.objectContaining({ duration: 300 }), expect.any(Function))
    expect(withTiming).toHaveBeenNthCalledWith(2, 0, expect.objectContaining({ duration: 300 }))
    expect(keyboardAvoid.current.ref.current.blur).toHaveBeenCalled()
  })

  it('falls back to manual offsets when native android avoiding is disabled', () => {
    (global as any).mpxGlobal.__mpx.config.rnConfig.enableNativeKeyboardAvoiding = false
    const keyboardAvoid = {
      current: {
        cursorSpacing: 20,
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
        adjustPosition: true,
        onKeyboardShow: jest.fn()
      }
    }

    render(
      <KeyboardAvoidContext.Provider value={keyboardAvoid as any}>
        <MpxKeyboardAvoidingView>
          <Text>manual keyboard body</Text>
        </MpxKeyboardAvoidingView>
      </KeyboardAvoidContext.Provider>
    )

    const show = (Keyboard.addListener as jest.Mock).mock.calls.find(([type]) => type === 'keyboardDidShow')[1]
    act(() => {
      show({ endCoordinates: { height: 260, screenY: 500 } })
    })
    expect(keyboardAvoid.current.onKeyboardShow).toHaveBeenCalled()
    expect(keyboardAvoid.current.ref.current.measure).toHaveBeenCalled()
    expect(withTiming).toHaveBeenCalledWith(180, expect.objectContaining({ duration: 300 }), expect.any(Function))
  })
})
