/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { resetMpxRuntimeGlobals } from './rn-component-test-utils'

const MpxPickerView = require('../../../lib/runtime/components/react/mpx-picker-view').default
const MpxPickerViewColumn = require('../../../lib/runtime/components/react/mpx-picker-view-column').default
const MpxPickerViewColumnItemLite = require('../../../lib/runtime/components/react/mpx-picker-view-column/pickerViewColumnItemLite').default

beforeEach(() => {
  jest.clearAllMocks()
  resetMpxRuntimeGlobals()
})

describe('MpxPickerView', () => {
  it('normalizes indexes and handles column scrolling variants', () => {
    const bindchange = jest.fn()
    const { rerender } = render(
      <MpxPickerView value={[99, -1]} bindchange={bindchange} style={{ height: 120 }} indicator-style={{ height: 40 }}>
        <MpxPickerViewColumn>
          <Text>A</Text>
          <Text>B</Text>
        </MpxPickerViewColumn>
        <MpxPickerViewColumn>
          <Text>1</Text>
          <Text>2</Text>
        </MpxPickerViewColumn>
      </MpxPickerView>
    )

    expect(bindchange).toHaveBeenCalledWith(expect.objectContaining({
      type: 'change',
      detail: { value: [1, 0], source: 'change' }
    }))

    rerender(
      <MpxPickerView value={[1, 0]} bindchange={bindchange} style={{ height: 120 }} indicator-style={{ height: 40 }}>
        <MpxPickerViewColumn>
          <Text>A</Text>
          <Text>B</Text>
        </MpxPickerViewColumn>
        <MpxPickerViewColumn>
          <Text>1</Text>
          <Text>2</Text>
        </MpxPickerViewColumn>
      </MpxPickerView>
    )
    bindchange.mockClear()
    const scrollView = screen.UNSAFE_getAllByType('ScrollView')[1]
    fireEvent(scrollView, 'scrollBeginDrag')
    fireEvent(scrollView, 'scroll', { nativeEvent: { contentOffset: { y: 40 } } })
    fireEvent(scrollView, 'scrollEndDrag', { nativeEvent: { contentOffset: { y: 40 } } })
    fireEvent(scrollView, 'momentumScrollBegin')
    fireEvent(scrollView, 'momentumScrollEnd', { nativeEvent: { contentOffset: { y: 40 } } })
    fireEvent(scrollView, 'touchEnd', { nativeEvent: { locationY: 100 } })
    expect((global as any).__mpx.config.rnConfig.onPickerVibrate).toHaveBeenCalled()
    expect(bindchange).toHaveBeenCalledTimes(1)
    expect(bindchange).toHaveBeenCalledWith(expect.objectContaining({
      detail: { value: [1, 1], source: 'change' }
    }))

    rerender(
      <MpxPickerView value={[0]} enable-wheel-animation={false}>
        <MpxPickerViewColumn>
          <Text>C</Text>
          <Text>D</Text>
        </MpxPickerViewColumn>
      </MpxPickerView>
    )
    expect(screen.UNSAFE_getAllByType(MpxPickerViewColumnItemLite)).toHaveLength(2)
  })
})
