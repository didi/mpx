/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'

;(global as any).__mpx_mode__ = 'android'

const MpxPickerViewColumn = require('../../../lib/runtime/components/react/mpx-picker-view-column').default

beforeEach(() => {
  jest.clearAllMocks()
  ;(global as any).__mpx_mode__ = 'android'
  ;(global as any).__mpx = {
    config: {
      rnConfig: {
        onPickerVibrate: jest.fn()
      }
    }
  }
})

afterAll(() => {
  (global as any).__mpx_mode__ = 'ios'
})

describe('MpxPickerViewColumn android', () => {
  it('manually finalizes click scrolling on android', () => {
    jest.useFakeTimers()
    const onSelectChange = jest.fn()

    render(
      <MpxPickerViewColumn
        columnIndex={0}
        columnData={[<Text key="0">Zero</Text>, <Text key="1">One</Text>, <Text key="2">Two</Text>]}
        initialIndex={1}
        onSelectChange={onSelectChange}
        style={{}}
        wrapperStyle={{ height: 180, itemHeight: 40 }}
        pickerMaskStyle={{}}
        pickerIndicatorStyle={{}}
      />
    )

    const scrollView = screen.UNSAFE_getByType('ScrollView')
    fireEvent(scrollView, 'touchEnd', { nativeEvent: { locationY: 180 } })
    act(() => {
      jest.advanceTimersByTime(250)
    })
    expect(onSelectChange).toHaveBeenCalledWith(2)

    jest.useRealTimers()
  })
})
