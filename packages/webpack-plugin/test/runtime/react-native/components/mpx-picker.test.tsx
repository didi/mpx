/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { expectPortalHostRendered, renderWithRoute, resetMpxRuntimeGlobals } from './rn-component-test-utils'

jest.mock('@mpxjs/api-proxy', () => ({
  getWindowInfo: jest.fn(() => ({
    screenHeight: 800,
    safeArea: { bottom: 760 }
  }))
}))

const Picker = require('../../../../lib/runtime/components/react/mpx-picker').default
const PickerDate = require('../../../../lib/runtime/components/react/mpx-picker/date').default
const PickerMultiSelector = require('../../../../lib/runtime/components/react/mpx-picker/multiSelector').default
const PickerRegion = require('../../../../lib/runtime/components/react/mpx-picker/region').default
const PickerSelector = require('../../../../lib/runtime/components/react/mpx-picker/selector').default
const PickerTime = require('../../../../lib/runtime/components/react/mpx-picker/time').default
const MpxPickerView = require('../../../../lib/runtime/components/react/mpx-picker-view').default
const MpxInlineText = require('../../../../lib/runtime/components/react/mpx-inline-text').default
const Portal = require('../../../../lib/runtime/components/react/mpx-portal').default
const PopupBase = require('../../../../lib/runtime/components/react/mpx-popup/popupBase').default
const { FormContext, RouteContext } = require('../../../../lib/runtime/components/react/context')
const { daysInMonthLength } = require('../../../../lib/runtime/components/react/mpx-picker/dateData')
const { regionData } = require('../../../../lib/runtime/components/react/mpx-picker/regionData')

beforeEach(() => {
  jest.clearAllMocks()
  resetMpxRuntimeGlobals()
})

describe('MpxPicker', () => {
  it('calculates Gregorian month lengths at century boundaries', () => {
    expect(daysInMonthLength(2000, 2)).toBe(29)
    expect(daysInMonthLength(1900, 2)).toBe(28)
    expect(daysInMonthLength(2023, 4)).toBe(30)
    expect(daysInMonthLength(2023, 1)).toBe(31)
  })

  it('handles century leap years when changing from January to February', () => {
    [
      { value: '1900-01-31', expected: '1900-02-28' },
      { value: '2000-01-31', expected: '2000-02-29' }
    ].forEach(({ value, expected }) => {
      const bindchange = jest.fn()
      const dateRender = render(<PickerDate mode="date" value={value} bindchange={bindchange} />)

      fireEvent(dateRender.UNSAFE_getAllByType('ScrollView')[1], 'momentumScrollEnd', {
        nativeEvent: { contentOffset: { y: 45 } }
      })

      expect(bindchange).toHaveBeenCalledWith({ detail: { value: expected } })
      dateRender.unmount()
    })
  })

  it('opens picker in a portal, cancels and registers form value', () => {
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
            bindcancel={bindcancel}
          >
            <Text>open picker</Text>
          </Picker>
        </Portal.Host>
      </FormContext.Provider>
    )

    expect(screen.getByText('Choose city')).toBeTruthy()
    expect(formValuesMap.has('city')).toBe(true)
    expect(screen.UNSAFE_getByType(PopupBase).props.visible).toBe(false)
    fireEvent.press(screen.getByTestId('picker').parent)
    expect(screen.UNSAFE_getByType(PopupBase).props.visible).toBe(true)
    fireEvent(screen.getByText('取消').parent, 'touchEnd')
    expect(bindcancel).toHaveBeenCalledWith(expect.objectContaining({ type: 'cancel' }))
    expect(screen.UNSAFE_getByType(PopupBase).props.visible).toBe(false)
  })

  it('opens picker in a portal and confirms value', () => {
    const bindchange = jest.fn()

    renderWithRoute(
      <Portal.Host pageId={1}>
        <Picker
          testID="picker"
          mode="selector"
          range={['Beijing', 'Shanghai']}
          value={0}
          bindchange={bindchange}
        >
          <Text>open picker</Text>
        </Picker>
      </Portal.Host>
    )

    fireEvent.press(screen.getByTestId('picker').parent)
    fireEvent(screen.getByText('确定').parent, 'touchEnd')
    expect(bindchange).toHaveBeenCalledWith(expect.objectContaining({
      type: 'change',
      detail: { value: '0' }
    }))
    expect(screen.UNSAFE_getByType(PopupBase).props.visible).toBe(false)
  })

  it('passes mode props only to picker content', () => {
    const range = [{ name: 'Beijing' }, { name: 'Shanghai' }]
    const selectorRender = renderWithRoute(
      <Portal.Host pageId={1}>
        <Picker
          testID="selector-picker"
          mode="selector"
          value={1}
          range={range}
          range-key="name"
          style={{ width: 100 }}
        />
      </Portal.Host>
    )
    const selector = selectorRender.UNSAFE_getByType(PickerSelector)
    const selectorTrigger = selectorRender.getByTestId('selector-picker')
    expect(selector.props.range).toBe(range)
    expect(selector.props['range-key']).toBe('name')
    expect(selector.props.style).toBeUndefined()
    expect(selector.props.children).toBeUndefined()
    expect(selectorTrigger.props.range).toBeUndefined()
    expect(selectorTrigger.props['range-key']).toBeUndefined()
    selectorRender.unmount()

    const cases = [
      { mode: 'time', component: PickerTime, specificProps: { start: '00:00', end: '23:59' } },
      { mode: 'date', component: PickerDate, specificProps: { fields: 'day' } },
      { mode: 'region', component: PickerRegion, specificProps: { level: 'city', 'custom-item': 'All' } }
    ]
    cases.forEach(({ mode, component, specificProps }) => {
      const pickerRender = renderWithRoute(
        <Portal.Host pageId={1}>
          <Picker testID={`${mode}-picker`} mode={mode as any} {...specificProps} />
        </Portal.Host>
      )
      const modal = pickerRender.UNSAFE_getByType(component)
      const trigger = pickerRender.getByTestId(`${mode}-picker`)
      Object.keys(specificProps).forEach((key) => {
        expect(modal.props[key]).toBe((specificProps as any)[key])
        expect(trigger.props[key]).toBeUndefined()
      })
      pickerRender.unmount()
    })
  })

  it('refreshes popup content and height with the latest props before showing', () => {
    const pickerRender = renderWithRoute(
      <Portal.Host pageId={1}>
        <Picker testID="latest-picker" mode="selector" value={0} range={[]} />
      </Portal.Host>
    )
    expect(pickerRender.UNSAFE_getByType(PopupBase).props.contentHeight).toBe(310)

    pickerRender.rerender(
      <RouteContext.Provider value={{ pageId: 1, navigation: {} }}>
        <Portal.Host pageId={1}>
          <Picker
            testID="latest-picker"
            mode="selector"
            value={0}
            range={['Beijing', 'Shanghai']}
            header-text="City"
          />
        </Portal.Host>
      </RouteContext.Provider>
    )
    expect(pickerRender.queryByText('Beijing')).toBeNull()
    fireEvent.press(pickerRender.getByTestId('latest-picker').parent)
    expect(pickerRender.getByText('Beijing')).toBeTruthy()
    expect(pickerRender.UNSAFE_getByType(PopupBase).props.contentHeight).toBe(350)
  })

  it('updates multi-selector content with the latest keyed range', () => {
    const pickerRender = renderWithRoute(
      <Portal.Host pageId={1}>
        <Picker
          mode="multiSelector"
          value={[0]}
          range={[{ name: ['Old'] }]}
          range-key="name"
        />
      </Portal.Host>
    )
    expect(pickerRender.getByText('Old')).toBeTruthy()

    pickerRender.rerender(
      <RouteContext.Provider value={{ pageId: 1, navigation: {} }}>
        <Portal.Host pageId={1}>
          <Picker
            mode="multiSelector"
            value={[0]}
            range={[{ label: ['New'] }]}
            range-key="label"
          />
        </Portal.Host>
      </RouteContext.Provider>
    )
    expect(pickerRender.getByText('New')).toBeTruthy()
  })

  it('defaults selector range and passes text styles to trigger children', () => {
    const pickerRender = renderWithRoute(
      <Portal.Host pageId={1}>
        <Picker
          testID="styled-picker"
          mode="selector"
          value={0}
          style={{ width: 100, color: 'red', fontSize: 20 }}
        >
          <MpxInlineText testID="picker-text">Select</MpxInlineText>
        </Picker>
      </Portal.Host>
    )

    expect(pickerRender.UNSAFE_getByType(PickerSelector).props.range).toEqual([])
    expect(pickerRender.getByTestId('styled-picker').props.style).toEqual({ width: 100 })
    expect(pickerRender.getByTestId('picker-text').props.style).toEqual({
      color: 'red',
      fontSize: 20
    })
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

  it('handles picker defaults, English actions, fixed layout and form cleanup', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const formValuesMap = new Map()
    global.__mpx.i18n.locale = 'en-US'

    const pickerRender = renderWithRoute(
      <FormContext.Provider value={{ formValuesMap, submit: jest.fn(), reset: jest.fn() }}>
        <Portal.Host pageId={1}>
          <Picker
            testID="default-picker"
            name="default"
            range={['A']}
            style={{ position: 'fixed', backgroundImage: 'linear-gradient(red, blue)' }}
          >
            <Text>default picker</Text>
          </Picker>
        </Portal.Host>
      </FormContext.Provider>
    )

    expect(screen.getByText('Cancel')).toBeTruthy()
    expect(screen.getByText('Confirm')).toBeTruthy()
    expectPortalHostRendered(pickerRender.toJSON(), 'default-picker')
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('background image-related styles'))
    act(() => {
      formValuesMap.get('default')!.resetValue({})
    })
    expect(formValuesMap.get('default')!.getValue()).toBe('0')
    pickerRender.unmount()
    expect(formValuesMap.has('default')).toBe(false)
    warnSpy.mockRestore()
  })

  it('resets multi-selector, date and region form values to mode defaults', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2025, 5, 15))
    const defaultRegion = [
      regionData[0].value,
      regionData[0].children[0].value,
      regionData[0].children[0].children[0].value
    ]
    const initialRegion = [
      regionData[1].value,
      regionData[1].children[0].value,
      regionData[1].children[0].children[0].value
    ]
    const cases = [
      { mode: 'multiSelector', name: 'multi', value: [1], range: [['A', 'B']], initial: [1], expected: [0] },
      { mode: 'date', name: 'date', value: '2024-01-01', initial: '2024-01-01', expected: '2025-06-15' },
      { mode: 'region', name: 'region', value: [regionData[1].value], initial: initialRegion, expected: defaultRegion }
    ]

    try {
      cases.forEach(({ mode, name, value, range, initial, expected }) => {
        const formValuesMap = new Map()
        const pickerRender = renderWithRoute(
          <FormContext.Provider value={{ formValuesMap, submit: jest.fn(), reset: jest.fn() }}>
            <Portal.Host pageId={1}>
              <Picker name={name} mode={mode as any} value={value} range={range as any} />
            </Portal.Host>
          </FormContext.Provider>
        )

        expect(formValuesMap.get(name)!.getValue()).toEqual(initial)
        act(() => {
          formValuesMap.get(name)!.resetValue({})
        })
        expect(formValuesMap.get(name)!.getValue()).toEqual(expected)
        pickerRender.unmount()
      })
    } finally {
      jest.useRealTimers()
    }
  })

  it('handles selector and multi-selector imperative defaults and keyed range updates', () => {
    const selectorRef = React.createRef<any>()
    const selectorRender = render(
      <PickerSelector
        ref={selectorRef}
        mode="selector"
        range={['A', 'B']}
        value={[1] as any}
      />
    )
    expect(selectorRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([1])
    act(() => {
      selectorRef.current.updateValue()
    })
    expect(selectorRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([0])
    selectorRender.unmount()

    const columnChange = jest.fn()
    const multiRef = React.createRef<any>()
    const multiRender = render(
      <PickerMultiSelector
        ref={multiRef}
        mode="multiSelector"
        range={[{ name: ['A', 'B'] }, { name: ['1'] }] as any}
        range-key="name"
        value={[1, 0]}
        bindcolumnchange={columnChange}
      />
    )
    expect(multiRender.getByText('B')).toBeTruthy()
    columnChange.mockClear()
    act(() => {
      multiRef.current.updateValue([])
    })
    expect(multiRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([0, 0])
    expect(columnChange).toHaveBeenCalledWith(0, 0)
    act(() => {
      multiRef.current.updateRange([{ label: ['C', 'D'] }, { label: ['2'] }], 'label')
    })
    expect(multiRender.getByText('C')).toBeTruthy()
    multiRender.unmount()

    const numericMultiRender = render(
      <PickerMultiSelector mode="multiSelector" range={[['A', 'B']]} value={1 as any} />
    )
    expect(numericMultiRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([1])
    numericMultiRender.unmount()
  })

  it('handles time invalid inputs, limits, controlled updates and timer cleanup', () => {
    jest.useFakeTimers()
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const bindchange = jest.fn()
    const ref = React.createRef<any>()
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout')
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

    try {
      const timeRender = render(
        <PickerTime
          ref={ref}
          mode="time"
          value="09:00"
          start={10 as any}
          end={11 as any}
          bindchange={bindchange}
        />
      )
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('time must be a string'))
      expect(timeRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([9, 0])

      timeRender.rerender(<PickerTime ref={ref} mode="time" value="09:00" start="10:00" end="11:00" bindchange={bindchange} />)
      act(() => {
        ref.current.updateValue('12:00')
      })
      expect(timeRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([11, 0])

      bindchange.mockClear()
      fireEvent(timeRender.UNSAFE_getAllByType('ScrollView')[1], 'momentumScrollEnd', {
        nativeEvent: { contentOffset: { y: 30 * 45 } }
      })
      expect(bindchange).toHaveBeenCalledTimes(1)
      expect(bindchange).toHaveBeenCalledWith({ detail: { value: '11:00' } })
      act(() => {
        jest.runOnlyPendingTimers()
      })
      expect(timeRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([11, 0])
      timeRender.rerender(<PickerTime ref={ref} mode="time" value="08:00" start="10:00" end="11:00" />)
      expect(timeRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([10, 0])
      const initialTimeoutCallCount = setTimeoutSpy.mock.calls.length
      act(() => {
        timeRender.UNSAFE_getByType(MpxPickerView).props.bindchange({ detail: { value: [12, 0] } })
      })
      const cleanupTimerIndex = setTimeoutSpy.mock.calls.findIndex((args, index) => {
        return index >= initialTimeoutCallCount && args.length === 1
      })
      expect(cleanupTimerIndex).toBeGreaterThanOrEqual(initialTimeoutCallCount)
      const cleanupTimer = setTimeoutSpy.mock.results[cleanupTimerIndex].value
      timeRender.unmount()
      expect(clearTimeoutSpy).toHaveBeenCalledWith(cleanupTimer)
    } finally {
      warnSpy.mockRestore()
      setTimeoutSpy.mockRestore()
      clearTimeoutSpy.mockRestore()
      jest.useRealTimers()
    }
  })

  it('parses incomplete time and cancels stale boundary corrections', () => {
    jest.useFakeTimers()
    const bindchange = jest.fn()
    const ref = React.createRef<any>()
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout')
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

    try {
      const incompleteRender = render(<PickerTime mode="time" value="12" />)
      expect(incompleteRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([12, 0])
      incompleteRender.unmount()

      const timeRender = render(
        <PickerTime
          ref={ref}
          mode="time"
          value="10:30"
          start="10:00"
          end="11:00"
          bindchange={bindchange}
        />
      )
      bindchange.mockClear()
      const initialTimeoutCallCount = setTimeoutSpy.mock.calls.length
      act(() => {
        timeRender.UNSAFE_getByType(MpxPickerView).props.bindchange({ detail: { value: [12, 0] } })
      })
      const correctionTimerIndex = setTimeoutSpy.mock.calls.findIndex((args, index) => {
        return index >= initialTimeoutCallCount && args.length === 1
      })
      expect(correctionTimerIndex).toBeGreaterThanOrEqual(initialTimeoutCallCount)
      const staleCorrectionTimer = setTimeoutSpy.mock.results[correctionTimerIndex].value
      act(() => {
        timeRender.UNSAFE_getByType(MpxPickerView).props.bindchange({ detail: { value: [9, 30] } })
      })
      expect(clearTimeoutSpy).toHaveBeenCalledWith(staleCorrectionTimer)
      const reportedValues = bindchange.mock.calls.map(([event]) => event.detail.value)
      expect(reportedValues).toEqual(expect.arrayContaining(['11:00', '10:00']))
      expect(reportedValues[reportedValues.length - 1]).toBe('10:00')
      act(() => {
        jest.runOnlyPendingTimers()
      })
      expect(timeRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([10, 0])

      act(() => {
        ref.current.updateValue('11:00')
      })
      expect(timeRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([11, 0])
      act(() => {
        ref.current.updateValue()
      })
      expect(timeRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([10, 0])
    } finally {
      setTimeoutSpy.mockRestore()
      clearTimeoutSpy.mockRestore()
      jest.useRealTimers()
    }
  })

  it('handles date defaults, incomplete bounds, controlled updates and unchanged values', () => {
    jest.useFakeTimers()
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const bindchange = jest.fn()
    const ref = React.createRef<any>()

    try {
      const dateRender = render(
        <PickerDate
          ref={ref}
          mode="date"
          value="1800"
          start="1800"
          end="1801"
          bindchange={bindchange}
        />
      )
      expect(dateRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([0, 0, 0])
      expect(bindchange).toHaveBeenCalledWith({ detail: { value: '1900-01-01' } })

      dateRender.rerender(
        <PickerDate ref={ref} mode="date" value="1900-01-01" start="1900-01-01" end="1901-12-31" bindchange={bindchange} />
      )
      act(() => {
        ref.current.updateValue('1900-02-03')
      })
      expect(dateRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([0, 1, 2])

      bindchange.mockClear()
      fireEvent(dateRender.UNSAFE_getAllByType('ScrollView')[2], 'momentumScrollEnd', {
        nativeEvent: { contentOffset: { y: 3 * 45 } }
      })
      expect(bindchange).toHaveBeenCalledWith({ detail: { value: '1900-02-04' } })
      expect(dateRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([0, 1, 3])
      dateRender.rerender(
        <PickerDate ref={ref} mode="date" fields="month" value="2024-02" start="2024-02" end="2024-02" />
      )
      expect(dateRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([124, 1])
      dateRender.unmount()
    } finally {
      errorSpy.mockRestore()
      jest.useRealTimers()
    }
  })

  it('uses the current date, clamps lower bounds and cancels stale corrections', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2025, 6, 15))
    const ref = React.createRef<any>()
    const bindchange = jest.fn()
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout')
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

    try {
      const defaultRender = render(<PickerDate ref={ref} mode="date" />)
      expect(defaultRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([125, 6, 14])
      act(() => {
        ref.current.updateValue('2024-02-03')
      })
      expect(defaultRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([124, 1, 2])
      act(() => {
        ref.current.updateValue()
      })
      expect(defaultRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([125, 6, 14])
      defaultRender.unmount()

      const lowerBoundRender = render(
        <PickerDate mode="date" value="2020-01-01" start="2024-01-01" end="2025-12-31" />
      )
      expect(lowerBoundRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([124, 0, 0])
      lowerBoundRender.unmount()

      const dateRender = render(
        <PickerDate
          mode="date"
          value="2024-03-15"
          start="2024-03-10"
          end="2024-03-20"
          bindchange={bindchange}
        />
      )
      bindchange.mockClear()
      const initialTimeoutCallCount = setTimeoutSpy.mock.calls.length
      act(() => {
        dateRender.UNSAFE_getByType(MpxPickerView).props.bindchange({ detail: { value: [124, 2, 24] } })
      })
      const correctionTimerIndex = setTimeoutSpy.mock.calls.findIndex((args, index) => {
        return index >= initialTimeoutCallCount && args.length === 1
      })
      expect(correctionTimerIndex).toBeGreaterThanOrEqual(initialTimeoutCallCount)
      const staleCorrectionTimer = setTimeoutSpy.mock.results[correctionTimerIndex].value
      act(() => {
        dateRender.UNSAFE_getByType(MpxPickerView).props.bindchange({ detail: { value: [124, 2, 4] } })
      })
      expect(clearTimeoutSpy).toHaveBeenCalledWith(staleCorrectionTimer)
      const reportedValues = bindchange.mock.calls.map(([event]) => event.detail.value)
      expect(reportedValues).toEqual(expect.arrayContaining(['2024-03-25', '2024-03-05']))
      expect(reportedValues[reportedValues.length - 1]).toBe('2024-03-05')
      act(() => {
        jest.runOnlyPendingTimers()
      })
      expect(dateRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([124, 2, 9])
    } finally {
      setTimeoutSpy.mockRestore()
      clearTimeoutSpy.mockRestore()
      jest.useRealTimers()
    }
  })

  it('handles full region defaults, custom short-circuit and controlled value updates', () => {
    const bindchange = jest.fn()
    const province = regionData[1]
    const ref = React.createRef<any>()
    const regionRender = render(
      <PickerRegion
        ref={ref}
        mode="region"
        value={[]}
        bindchange={bindchange}
      />
    )
    expect(regionRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([0, 0, 0])
    act(() => {
      ref.current.updateValue([province.value, province.children[0].value, province.children[0].children[1].value])
    })
    expect(regionRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([1, 0, 1])

    bindchange.mockClear()
    fireEvent(regionRender.UNSAFE_getAllByType('ScrollView')[2], 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { y: 2 * 45 } }
    })
    expect(bindchange).toHaveBeenCalledWith({
      detail: { value: [province.value, province.children[0].value, province.children[0].children[2].value] }
    })
    expect(regionRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([1, 0, 2])

    regionRender.rerender(
      <PickerRegion
        ref={ref}
        mode="region"
        custom-item="全部"
        value={['全部']}
      />
    )
    expect(regionRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([0, 0, 0])
  })

  it('uses the default locale when runtime context is missing', () => {
    const previousMpx = global.__mpx
    try {
      global.__mpx = undefined as any
      renderWithRoute(
        <Portal.Host pageId={1}>
          <Picker mode="selector" range={['Beijing']}>
            <Text>fallback locale picker</Text>
          </Picker>
        </Portal.Host>
      )
      expect(screen.getByText('取消')).toBeTruthy()
      expect(screen.getByText('确定')).toBeTruthy()
    } finally {
      global.__mpx = previousMpx
    }
  })

  it('handles disabled presses and picker mode prop defaults', () => {
    const disabledRender = renderWithRoute(
      <Portal.Host pageId={1}>
        <Picker testID="disabled-picker" disabled={true}>
          <Text>disabled picker</Text>
        </Picker>
      </Portal.Host>
    )
    fireEvent.press(disabledRender.getByTestId('disabled-picker').parent)
    expect(disabledRender.UNSAFE_queryByType(PopupBase)).toBeNull()
    disabledRender.unmount()

    const selectorRender = render(<PickerSelector mode="selector" />)
    expect(selectorRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([0])
    selectorRender.unmount()

    const multiRender = render(<PickerMultiSelector mode="multiSelector" />)
    expect(multiRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([])
    multiRender.unmount()

    const timeRender = render(<PickerTime mode="time" />)
    expect(timeRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([0, 0])
    timeRender.unmount()

    const regionRender = render(<PickerRegion mode="region" />)
    expect(regionRender.UNSAFE_getByType(MpxPickerView).props.value).toEqual([0, 0, 0])
  })
})
