/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useContext } from 'react'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { resetMpxRuntimeGlobals } from './rn-component-test-utils'

const MpxPickerViewColumn = require('../../../lib/runtime/components/react/mpx-picker-view-column').default
const { calcHeightOffsets, calcPickerHeight, createFaces, degToRad } = require('../../../lib/runtime/components/react/mpx-picker-view-column/pickerViewFaces')
const {
  PickerViewColumnAnimationContext,
  PickerViewStyleContext
} = require('../../../lib/runtime/components/react/mpx-picker-view/pickerVIewContext')

beforeEach(() => {
  jest.clearAllMocks()
  resetMpxRuntimeGlobals()
})

describe('MpxPickerViewColumn', () => {
  it('handles column layout, timers, vibration and click-to-scroll', () => {
    jest.useFakeTimers()
    const onSelectChange = jest.fn()
    const { rerender, unmount } = render(
      <MpxPickerViewColumn
        columnIndex={0}
        columnData={[<Text key="0">Zero</Text>, <Text key="1">One</Text>, <Text key="2">Two</Text>]}
        initialIndex={0}
        onSelectChange={onSelectChange}
        style={{}}
        wrapperStyle={{ height: 180, itemHeight: 40 }}
        pickerMaskStyle={{}}
        pickerIndicatorStyle={{}}
        enableWheelAnimation={true}
      />
    )

    const scrollView = screen.UNSAFE_getByType('ScrollView')
    fireEvent(screen.getByText('Zero'), 'layout', {
      nativeEvent: { layout: { height: 50 } }
    })
    fireEvent(scrollView, 'scrollBeginDrag')
    fireEvent(scrollView, 'scroll', { nativeEvent: { contentOffset: { y: 55 } } })
    expect((global as any).__mpx.config.rnConfig.onPickerVibrate).toHaveBeenCalled()
    fireEvent(scrollView, 'scrollEndDrag', { nativeEvent: { contentOffset: { y: 55 } } })
    jest.advanceTimersByTime(20)
    fireEvent(scrollView, 'momentumScrollEnd', { nativeEvent: { contentOffset: { y: 50 } } })
    expect(onSelectChange).toHaveBeenCalledWith(1)

    fireEvent(scrollView, 'touchEnd', { nativeEvent: { locationY: 140 } })
    fireEvent(scrollView, 'momentumScrollEnd', { nativeEvent: { contentOffset: { y: 100 } } })
    expect(onSelectChange).toHaveBeenCalledWith(2)

    rerender(
      <MpxPickerViewColumn
        columnIndex={0}
        columnData={[<Text key="0">Zero</Text>, <Text key="1">One</Text>, <Text key="2">Two</Text>]}
        initialIndex={0}
        onSelectChange={onSelectChange}
        style={{}}
        wrapperStyle={{ height: 180, itemHeight: 50 }}
        pickerMaskStyle={{}}
        pickerIndicatorStyle={{}}
        enableWheelAnimation={true}
      />
    )
    jest.advanceTimersByTime(1)
    unmount()
    jest.useRealTimers()
  })

  it('handles click offset branches and scroll reset guards', () => {
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
        enableWheelAnimation={true}
      />
    )

    const scrollView = screen.UNSAFE_getByType('ScrollView')
    delete (global as any).__mpx.config.rnConfig.onPickerVibrate
    fireEvent(scrollView, 'scrollBeginDrag')
    fireEvent(scrollView, 'scroll', { nativeEvent: { contentOffset: { y: 85 } } })
    fireEvent(scrollView, 'scrollEndDrag', { nativeEvent: { contentOffset: { y: 85 } } })
    fireEvent(scrollView, 'momentumScrollBegin')
    jest.advanceTimersByTime(20)

    fireEvent(scrollView, 'momentumScrollEnd', { nativeEvent: { contentOffset: { y: 40 } } })
    fireEvent(scrollView, 'touchEnd', { nativeEvent: { locationY: 165 } })
    fireEvent(scrollView, 'momentumScrollEnd', { nativeEvent: { contentOffset: { y: 80 } } })
    expect(onSelectChange).toHaveBeenCalledWith(2)

    fireEvent(scrollView, 'touchEnd', { nativeEvent: { locationY: 15 } })
    expect(onSelectChange).toHaveBeenCalledTimes(1)
    jest.useRealTimers()
  })

  it('covers picker faces and context helpers', () => {
    const faces = createFaces(40, 5)
    expect(degToRad(180)).toBe(Math.PI)
    expect(calcPickerHeight(faces, 40)).toBeGreaterThan(0)
    expect(calcPickerHeight(faces.slice(0, 3), 40)).toBeGreaterThan(0)
    expect(calcHeightOffsets(40)).toEqual(expect.arrayContaining([20]))

    const Probe = () => {
      const style = useContext(PickerViewStyleContext)
      const offset = useContext(PickerViewColumnAnimationContext)
      return <Text>{`${style!.color}-${offset!.value}`}</Text>
    }
    render(
      <PickerViewStyleContext.Provider value={{ color: 'red' }}>
        <PickerViewColumnAnimationContext.Provider value={{ value: 3 }}>
          <Probe />
        </PickerViewColumnAnimationContext.Provider>
      </PickerViewStyleContext.Provider>
    )
    expect(screen.getByText('red-3')).toBeTruthy()
  })
})
