/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { resetMpxRuntimeGlobals } from './rn-component-test-utils'

jest.mock('@mpxjs/api-proxy', () => ({
  getWindowInfo: jest.fn(() => ({
    screenHeight: 800,
    safeArea: { bottom: 760 }
  }))
}))

jest.mock('../../../lib/runtime/components/react/mpx-picker/multiSelector', () => {
  const mockReact = require('react')
  const { Text: MockText } = require('react-native')
  const MockMultiSelector = mockReact.forwardRef((props: any, ref: any) => {
    mockReact.useImperativeHandle(ref, () => ({
      updateRange: jest.fn(),
      updateValue: jest.fn()
    }))
    return mockReact.createElement(
      MockText,
      {
        testID: 'mock-multi-selector',
        onPress: () => props.bindcolumnchange(1, 1)
      },
      'mock multi selector'
    )
  })
  return {
    __esModule: true,
    default: MockMultiSelector
  }
})

const Picker = require('../../../lib/runtime/components/react/mpx-picker').default
const Portal = require('../../../lib/runtime/components/react/mpx-portal').default
const { RouteContext } = require('../../../lib/runtime/components/react/context')

beforeEach(() => {
  jest.clearAllMocks()
  resetMpxRuntimeGlobals()
})

describe('MpxPicker wrapper', () => {
  it('emits columnchange from picker multiSelector wrapper', () => {
    const bindcolumnchange = jest.fn()

    render(
      <RouteContext.Provider value={{ pageId: 1, navigation: {} }}>
        <Portal.Host pageId={1}>
          <Picker
            mode="multiSelector"
            range={[['A', 'B'], ['1', '2']]}
            value={[0, 0]}
            bindcolumnchange={bindcolumnchange}
          >
            <Text>open multi picker</Text>
          </Picker>
        </Portal.Host>
      </RouteContext.Provider>
    )

    fireEvent.press(screen.getByTestId('mock-multi-selector'))
    expect(bindcolumnchange).toHaveBeenCalledWith(expect.objectContaining({
      detail: { column: 1, value: 1 }
    }))
  })
})
