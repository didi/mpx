import React from 'react'
import { act, render } from '@testing-library/react-native'
import { View } from 'react-native'
import MpxNavigator from '../../../lib/runtime/components/react/mpx-navigator'
import { fireTap, getTouchableView } from './helpers'

jest.mock('@mpxjs/api-proxy', () => ({
  navigateTo: jest.fn(),
  redirectTo: jest.fn(),
  navigateBack: jest.fn(),
  reLaunch: jest.fn(),
  switchTab: jest.fn()
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockNavFns = require('@mpxjs/api-proxy')

describe('MpxNavigator', () => {
  beforeEach(() => {
    Object.keys(mockNavFns).forEach((key) => {
      mockNavFns[key as keyof typeof mockNavFns].mockClear()
    })
  })

  it('dispatches actions by open type', () => {
    const cases = [
      { openType: 'navigate', fn: mockNavFns.navigateTo, args: { url: '/pages/a' } },
      { openType: 'redirect', fn: mockNavFns.redirectTo, args: { url: '/pages/b' } },
      { openType: 'switchTab', fn: mockNavFns.switchTab, args: { url: '/pages/tab' } },
      { openType: 'reLaunch', fn: mockNavFns.reLaunch, args: { url: '/pages/home' } },
      { openType: 'navigateBack', fn: mockNavFns.navigateBack, args: { delta: 2 } }
    ]

    cases.forEach(({ openType, fn, args }) => {
      const { UNSAFE_getAllByType, unmount } = render(
        <MpxNavigator open-type={openType as any} url={(args as any).url} delta={(args as any).delta}>
          Go
        </MpxNavigator>
      )
      const touchable = getTouchableView(UNSAFE_getAllByType(View))
      expect(touchable).toBeTruthy()

      act(() => {
        fireTap(touchable)
      })
      expect(fn).toHaveBeenCalledWith(args)
      unmount()
    })
  })
})
