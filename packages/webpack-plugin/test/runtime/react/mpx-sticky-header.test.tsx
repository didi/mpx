/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { Animated, Text } from 'react-native'
import { resetMpxRuntimeGlobals } from './rn-component-test-utils'

const MpxStickyHeader = require('../../../lib/runtime/components/react/mpx-sticky-header').default
const { ScrollViewContext, StickyContext } = require('../../../lib/runtime/components/react/context')

beforeEach(() => {
  jest.clearAllMocks()
  resetMpxRuntimeGlobals()
})

describe('MpxStickyHeader', () => {
  it('registers sticky headers and reports stick state changes', () => {
    const bindstickontopchange = jest.fn()
    const registerStickyHeader = jest.fn()
    const unregisterStickyHeader = jest.fn()
    const scrollOffset = {
      addListener: jest.fn((listener) => {
        listener({ value: 10 })
        return 'listener-id'
      }),
      removeListener: jest.fn()
    }

    const { unmount } = render(
      <ScrollViewContext.Provider value={{ gestureRef: { current: {} }, scrollOffset: scrollOffset as any }}>
        <StickyContext.Provider value={{ registerStickyHeader, unregisterStickyHeader }}>
          <MpxStickyHeader bindstickontopchange={bindstickontopchange} offset-top={4}>
            <Text>sticky header</Text>
          </MpxStickyHeader>
        </StickyContext.Provider>
      </ScrollViewContext.Provider>
    )

    expect(registerStickyHeader).toHaveBeenCalled()
    expect(bindstickontopchange).toHaveBeenCalledWith(expect.objectContaining({
      detail: { isStickOnTop: true }
    }))
    unmount()
    expect(unregisterStickyHeader).toHaveBeenCalled()
    expect(scrollOffset.removeListener).toHaveBeenCalledWith('listener-id')
  })

  it('updates position on layout and reports invalid scroll refs', () => {
    const registerStickyHeader = jest.fn()
    const unregisterStickyHeader = jest.fn()
    ;(Animated.timing as jest.Mock).mockReturnValue({ start: jest.fn() })
    const measured = render(
      <ScrollViewContext.Provider value={{ gestureRef: { current: {} }, scrollOffset: null }}>
        <StickyContext.Provider value={{ registerStickyHeader, unregisterStickyHeader }}>
          <MpxStickyHeader testID="measured-sticky" offset-top={6}>
            <Text>measured sticky</Text>
          </MpxStickyHeader>
        </StickyContext.Provider>
      </ScrollViewContext.Provider>
    )

    fireEvent(screen.getByTestId('measured-sticky'), 'layout', {
      nativeEvent: { layout: { width: 100, height: 30 } }
    })
    expect(registerStickyHeader).toHaveBeenCalled()
    measured.unmount()

    const errorHandler = jest.fn()
    ;(global as any).mpxGlobal.__mpx.config.errorHandler = errorHandler
    render(
      <ScrollViewContext.Provider value={{ gestureRef: null, scrollOffset: null }}>
        <StickyContext.Provider value={{ registerStickyHeader, unregisterStickyHeader }}>
          <MpxStickyHeader testID="invalid-sticky">
            <Text>invalid sticky</Text>
          </MpxStickyHeader>
        </StickyContext.Provider>
      </ScrollViewContext.Provider>
    )
    fireEvent(screen.getByTestId('invalid-sticky'), 'layout', {
      nativeEvent: { layout: { width: 100, height: 30 } }
    })
    expect(errorHandler).toHaveBeenCalledWith(
      expect.stringContaining('StickyHeader measureLayout error'),
      undefined,
      expect.any(Error)
    )
  })
})
