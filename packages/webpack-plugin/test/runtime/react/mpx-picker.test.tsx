/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { renderWithRoute, resetMpxRuntimeGlobals } from './rn-component-test-utils'

jest.mock('@mpxjs/api-proxy', () => ({
  getWindowInfo: jest.fn(() => ({
    screenHeight: 800,
    safeArea: { bottom: 760 }
  }))
}))

const Picker = require('../../../lib/runtime/components/react/mpx-picker').default
const PickerDate = require('../../../lib/runtime/components/react/mpx-picker/date').default
const PickerMultiSelector = require('../../../lib/runtime/components/react/mpx-picker/multiSelector').default
const PickerRegion = require('../../../lib/runtime/components/react/mpx-picker/region').default
const PickerSelector = require('../../../lib/runtime/components/react/mpx-picker/selector').default
const PickerTime = require('../../../lib/runtime/components/react/mpx-picker/time').default
const MpxPickerView = require('../../../lib/runtime/components/react/mpx-picker-view').default
const Portal = require('../../../lib/runtime/components/react/mpx-portal').default
const { FormContext, RouteContext } = require('../../../lib/runtime/components/react/context')
const { regionData } = require('../../../lib/runtime/components/react/mpx-picker/regionData')

beforeEach(() => {
  jest.clearAllMocks()
  resetMpxRuntimeGlobals()
})

describe('MpxPicker', () => {
  it('opens picker in a portal, confirms/cancels values and registers form value', () => {
    const bindchange = jest.fn()
    const bindcancel = jest.fn()
    const formValuesMap = new Map()

    renderWithRoute(
      <FormContext.Provider value={{ formValuesMap, submit: jest.fn(), reset: jest.fn() }}>
        <Portal.Host pageId={1}>
          <Picker
            testID="picker"
            name="city"
            mode="selector"
            range={['Beijing', 'Shanghai']}
            value={0}
            header-text="Choose city"
            bindchange={bindchange}
            bindcancel={bindcancel}
          >
            <Text>open picker</Text>
          </Picker>
        </Portal.Host>
      </FormContext.Provider>
    )

    expect(screen.getByText('Choose city')).toBeTruthy()
    expect(formValuesMap.has('city')).toBe(true)
    fireEvent(screen.getByText('取消').parent, 'touchEnd')
    expect(bindcancel).toHaveBeenCalled()
    fireEvent(screen.getByText('确定').parent, 'touchEnd')
    expect(bindchange).toHaveBeenCalledWith(expect.objectContaining({
      detail: { value: '0' }
    }))
  })

  it('maps selector and multi selector values', () => {
    const selectorChange = jest.fn()
    const selectorRender = render(
      <PickerSelector
        mode="selector"
        range={[{ label: 'A' }, { label: 'B' }]}
        range-key="label"
        value={0}
        bindchange={selectorChange}
      />
    )
    selectorChange.mockClear()
    fireEvent(selectorRender.UNSAFE_getAllByType('ScrollView')[0], 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { y: 45 } }
    })
    expect(selectorChange).toHaveBeenCalledWith({ detail: { value: '1' } })
    selectorRender.unmount()

    const multiChange = jest.fn()
    const columnChange = jest.fn()
    const multiRender = render(
      <PickerMultiSelector
        mode="multiSelector"
        range={[['A', 'B'], ['1', '2']]}
        value={[0, 0]}
        bindchange={multiChange}
        bindcolumnchange={columnChange}
      />
    )
    multiChange.mockClear()
    columnChange.mockClear()
    fireEvent(multiRender.UNSAFE_getAllByType('ScrollView')[1], 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { y: 45 } }
    })
    expect(multiChange).toHaveBeenCalledWith({ detail: { value: [0, 1] } })
    expect(columnChange).toHaveBeenCalledWith(1, 1)
  })

  it('calibrates time, date and region values', () => {
    const timeChange = jest.fn()
    const timeRender = render(<PickerTime mode="time" value="09:30" start="10:00" end="11:00" bindchange={timeChange} />)
    fireEvent(timeRender.UNSAFE_getAllByType('ScrollView')[1], 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { y: 30 * 36 } }
    })
    expect(timeChange).toHaveBeenCalledWith({ detail: { value: '10:00' } })
    timeRender.unmount()

    const dateChange = jest.fn()
    const dateRender = render(<PickerDate mode="date" fields="month" value="2024-02-01" start="2024-01-01" end="2024-12-31" bindchange={dateChange} />)
    dateChange.mockClear()
    fireEvent(dateRender.UNSAFE_getAllByType('ScrollView')[1], 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { y: 2 * 45 } }
    })
    expect(dateChange).toHaveBeenCalledWith({ detail: { value: '2024-03' } })
    dateRender.unmount()

    const regionChange = jest.fn()
    const regionRender = render(<PickerRegion mode="region" level="city" custom-item="全部" value={['全部']} bindchange={regionChange} />)
    regionChange.mockClear()
    fireEvent(regionRender.UNSAFE_getAllByType('ScrollView')[0], 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { y: 45 } }
    })
    expect(regionChange).toHaveBeenCalledWith({ detail: { value: expect.any(Array) } })
  })

  it('handles picker disabled, unsupported mode, no-name form warning and range updates', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const formValuesMap = new Map()
    const { queryByText, rerender } = renderWithRoute(
      <FormContext.Provider value={{ formValuesMap, submit: jest.fn(), reset: jest.fn() }}>
        <Portal.Host pageId={1}>
          <Picker mode="selector" disabled={true} range={['A']} value={0}>
            <Text>disabled picker</Text>
          </Picker>
        </Portal.Host>
      </FormContext.Provider>
    )
    expect(queryByText('确定')).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('name attribute is required'))

    rerender(
      <RouteContext.Provider value={{ pageId: 1, navigation: {} }}>
        <Portal.Host pageId={1}>
          <Picker mode={'unsupported' as any} range={['A']} value={0}>
            <Text>bad picker</Text>
          </Picker>
        </Portal.Host>
      </RouteContext.Provider>
    )
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Unsupported <picker> mode'))

    const ref = React.createRef<any>()
    const multi = render(
      <PickerMultiSelector
        ref={ref}
        mode="multiSelector"
        range={[['A'], ['1']]}
        value={[0, 0]}
      />
    )
    act(() => {
      ref.current.updateRange([['B', 'C'], ['2', '3']])
      ref.current.updateValue([])
    })
    expect(multi.getByText('B')).toBeTruthy()
    warnSpy.mockRestore()
  })

  it('resets picker form fields to mode defaults', () => {
    const formValuesMap = new Map()
    renderWithRoute(
      <FormContext.Provider value={{ formValuesMap, submit: jest.fn(), reset: jest.fn() }}>
        <Portal.Host pageId={1}>
          <Picker
            name="time"
            mode="time"
            value="10:30"
          >
            <Text>time picker</Text>
          </Picker>
        </Portal.Host>
      </FormContext.Provider>
    )

    act(() => {
      formValuesMap.get('time')!.resetValue({})
    })
    expect(formValuesMap.get('time')!.getValue()).toBe('00:00')
  })

  it('clamps date days and supports date imperative updates', () => {
    const bindchange = jest.fn()
    const ref = React.createRef<any>()
    const dateRender = render(
      <PickerDate
        ref={ref}
        mode="date"
        value="2024-01-31"
        start="2024-12-31"
        end="2024-01-01"
        bindchange={bindchange}
      />
    )

    bindchange.mockClear()
    fireEvent(dateRender.UNSAFE_getAllByType('ScrollView')[1], 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { y: 45 } }
    })
    expect(bindchange).toHaveBeenCalledWith({ detail: { value: '2024-02-29' } })

    act(() => {
      ref.current.updateValue('2025-05-20')
    })
    expect(dateRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([125, 4, 19])
    bindchange.mockClear()
    fireEvent(dateRender.UNSAFE_getAllByType('ScrollView')[2], 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { y: 20 * 45 } }
    })
    expect(bindchange).toHaveBeenCalledWith({ detail: { value: '2025-05-21' } })
    dateRender.unmount()

    const yearRender = render(<PickerDate mode="date" fields="year" value="" />)
    expect(yearRender.UNSAFE_getAllByType('ScrollView')).toHaveLength(1)
  })

  it('handles region custom item levels and imperative updates', () => {
    const bindchange = jest.fn()
    const ref = React.createRef<any>()
    const province = regionData[0].value
    const nextProvince = regionData[1].value
    const regionRender = render(
      <PickerRegion
        ref={ref}
        mode="region"
        level="province"
        custom-item="全部"
        value={['全部']}
        bindchange={bindchange}
      />
    )

    bindchange.mockClear()
    fireEvent(regionRender.UNSAFE_getAllByType('ScrollView')[0], 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { y: 45 } }
    })
    expect(bindchange).toHaveBeenCalledWith({ detail: { value: [province] } })

    act(() => {
      ref.current.updateValue([nextProvince])
    })
    expect(regionRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([2])
    regionRender.unmount()

    bindchange.mockClear()
    const cityRender = render(
      <PickerRegion
        ref={ref}
        mode="region"
        level="city"
        custom-item="全部"
        value={[province, '全部']}
        bindchange={bindchange}
      />
    )
    expect(cityRender.UNSAFE_getAllByType('ScrollView')).toHaveLength(2)
    fireEvent(cityRender.UNSAFE_getAllByType('ScrollView')[1], 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { y: 0 } }
    })
    expect(bindchange).toHaveBeenCalledWith({ detail: { value: [province, '全部'] } })
  })
})
