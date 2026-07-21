/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { Text, processColor } from 'react-native'
import { resetMpxRuntimeGlobals } from './rn-component-test-utils'

const MpxNavModule = require('../../../../lib/runtime/components/react/mpx-nav')
const MpxNav = MpxNavModule.default
const useInnerHeaderHeight = MpxNavModule.useInnerHeaderHeight

beforeEach(() => {
  jest.clearAllMocks()
  resetMpxRuntimeGlobals()
})

describe('MpxNav', () => {
  it('renders nav, updates page config and handles back actions', () => {
    const navigation = {
      goBack: jest.fn(),
      getState: jest.fn(() => ({ routes: [{}, {}] }))
    }
    render(<MpxNav pageConfig={{
      navigationBarTitleText: ' Home ',
      navigationBarTextStyle: '#000000',
      navigationBarBackgroundColor: '#eeeeee'
    } as any} navigation={navigation} />)

    expect(screen.getByText('Home')).toBeTruthy()
    fireEvent(screen.UNSAFE_getByType('TouchableWithoutFeedback'), 'press')
    expect(navigation.goBack).toHaveBeenCalled()

    act(() => {
      navigation.setPageConfig({ navigationBarTitleText: 'Next', navigationBarTextStyle: '#ffffff' })
    })
    expect(screen.getByText('Next')).toBeTruthy()

    const CustomProbe = () => <Text>{useInnerHeaderHeight({ navigationStyle: 'custom' } as any)}</Text>
    render(<CustomProbe />)
    expect(screen.getByText('0')).toBeTruthy()
  })

  it('handles custom nav, stack-top back and invalid colors', () => {
    const stackTopBack = jest.fn()
    ;(global as any).mpxGlobal.__mpx.config.rnConfig.onStackTopBack = stackTopBack
    ;(processColor as jest.Mock).mockImplementationOnce(() => {
      throw new Error('bad color')
    })
    const navigation = {
      goBack: jest.fn(),
      getState: jest.fn(() => ({ routes: [{}] }))
    }

    const customRender = render(<MpxNav pageConfig={{
      navigationStyle: 'custom',
      navigationBarTextStyle: 'bad-color'
    } as any} navigation={navigation} />)
    expect(screen.UNSAFE_getByType('StatusBar')).toBeTruthy()
    customRender.unmount()

    render(<MpxNav pageConfig={{
      navigationBarTitleText: 'Top',
      navigationBarTextStyle: 'bad-color'
    } as any} navigation={navigation} />)
    fireEvent(screen.UNSAFE_getByType('TouchableWithoutFeedback'), 'press')
    expect(stackTopBack).toHaveBeenCalled()
    expect(navigation.goBack).not.toHaveBeenCalled()
  })

  it('handles empty page config without a back affordance', () => {
    (global as any).mpxGlobal.__mpx.config.rnConfig.onStackTopBack = undefined
    const navigation = {
      goBack: jest.fn(),
      getState: jest.fn(() => ({ routes: [{}] }))
    }

    render(<MpxNav pageConfig={undefined as any} navigation={navigation} />)
    expect(screen.UNSAFE_queryByType('TouchableWithoutFeedback' as any)).toBeNull()

    const NormalProbe = () => <Text>{useInnerHeaderHeight({} as any)}</Text>
    render(<NormalProbe />)
    expect(screen.getByText('44')).toBeTruthy()
  })
})
