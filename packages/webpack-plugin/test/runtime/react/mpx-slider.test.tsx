import React, { useContext, useEffect } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import MpxForm from '../../../lib/runtime/components/react/mpx-form'
import MpxSlider from '../../../lib/runtime/components/react/mpx-slider'
import { FormContext } from '../../../lib/runtime/components/react/context'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { __getLastPanGesture } = require('react-native-gesture-handler')

describe('MpxSlider', () => {
  it('handles layout, gestures and form reset', () => {
    const bindchange = jest.fn()
    const bindchanging = jest.fn()
    let formContext: any

    const FormProbe = () => {
      const context = useContext(FormContext)
      useEffect(() => {
        formContext = context
      }, [context])
      return null
    }

    render(
      <MpxForm testID="slider-form">
        <MpxSlider
          testID="basic-slider"
          name="volume"
          min={0}
          max={100}
          step={10}
          value={20}
          activeColor="#00ff00"
          backgroundColor="#eeeeee"
          block-size={24}
          bindchange={bindchange}
          bindchanging={bindchanging}
        />
        <FormProbe />
      </MpxForm>
    )

    const slider = screen.getByTestId('basic-slider')
    const track = slider.findAll((node: any) => node.props.onLayout)[0]
    act(() => {
      fireEvent(track, 'layout', {
        nativeEvent: {
          layout: { width: 100 }
        }
      })
    })

    const panGesture = __getLastPanGesture()
    act(() => {
      panGesture.onBeginCallback()
      panGesture.onUpdateCallback({ translationX: 30 })
      panGesture.onEndCallback({ translationX: 30 })
    })

    expect(bindchanging).toHaveBeenCalledWith(expect.objectContaining({
      type: 'changing',
      detail: { value: 50 }
    }))
    expect(bindchange).toHaveBeenCalledWith(expect.objectContaining({
      type: 'change',
      detail: { value: 50 }
    }))
    expect(formContext.formValuesMap.get('volume').getValue()).toBe(50)

    act(() => {
      formContext.formValuesMap.get('volume').resetValue()
    })
    expect(formContext.formValuesMap.get('volume').getValue()).toBe(20)
  })

  it('handles defaults, string values, catch handlers and form warnings', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const catchchange = jest.fn()
    const catchchanging = jest.fn()
    let formContext: any

    const FormProbe = () => {
      const context = useContext(FormContext)
      useEffect(() => {
        formContext = context
      }, [context])
      return null
    }

    render(<MpxSlider testID="default-slider" />)
    const panGesture = __getLastPanGesture()
    act(() => {
      panGesture.onBeginCallback()
      panGesture.onUpdateCallback({ translationX: 10 })
    })

    render(
      <MpxSlider
        testID="string-slider"
        min={'10' as any}
        max={'50' as any}
        step={'7' as any}
        value={'20' as any}
        color="#222222"
        selected-color="#111111"
        block-size={'18' as any}
        catchchange={catchchange}
        catchchanging={catchchanging}
        style={{ padding: 0, margin: 0 }}
      />
    )

    const slider = screen.getByTestId('string-slider')
    const track = slider.findAll((node: any) => node.props.onLayout)[0]
    act(() => {
      fireEvent(track, 'layout', {
        nativeEvent: {
          layout: { width: 80 }
        }
      })
    })
    const stringPanGesture = __getLastPanGesture()
    act(() => {
      stringPanGesture.onBeginCallback()
      stringPanGesture.onUpdateCallback({ translationX: 40 })
      stringPanGesture.onEndCallback({ translationX: 40 })
    })
    expect(catchchanging).toHaveBeenCalled()
    expect(catchchange).toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Step 7 is not a divisor'))

    render(
      <MpxForm>
        <MpxSlider />
      </MpxForm>
    )
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('name attribute is required'))

    render(
      <MpxForm>
        <MpxSlider
          name="stringValue"
          min={'5' as any}
          max={'20' as any}
          step={'5' as any}
        />
        <FormProbe />
      </MpxForm>
    )
    act(() => {
      formContext.formValuesMap.get('stringValue').resetValue()
    })
    expect(formContext.formValuesMap.get('stringValue').getValue()).toBe(5)
    warnSpy.mockRestore()
  })
})
