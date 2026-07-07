import React, { useContext, useEffect } from 'react'
import { act, render, screen } from '@testing-library/react-native'
import MpxForm from '../../../lib/runtime/components/react/mpx-form'
import MpxRadio from '../../../lib/runtime/components/react/mpx-radio'
import MpxRadioGroup from '../../../lib/runtime/components/react/mpx-radio-group'
import { FormContext } from '../../../lib/runtime/components/react/context'
import { fireTap } from './helpers'

describe('MpxRadioGroup', () => {
  it('registers with form submit, reset and cleanup', () => {
    let formContext: any
    const bindsubmit = jest.fn()

    const FormProbe = () => {
      const context = useContext(FormContext)
      useEffect(() => {
        formContext = context
      }, [context])
      return null
    }

    const { unmount } = render(
      <MpxForm testID="radio-form" bindsubmit={bindsubmit}>
        <MpxRadioGroup testID="form-radio-group" name="radio">
          <MpxRadio testID="form-radio-a" value="a" checked={true}>
            A
          </MpxRadio>
          <MpxRadio testID="form-radio-b" value="b">
            B
          </MpxRadio>
        </MpxRadioGroup>
        <FormProbe />
      </MpxForm>
    )

    act(() => {
      formContext.submit()
    })
    expect(bindsubmit).toHaveBeenCalledWith(expect.objectContaining({
      detail: {
        value: {
          radio: 'a'
        }
      }
    }))

    act(() => {
      formContext.reset()
    })
    expect(formContext.formValuesMap.get('radio').getValue()).toBeUndefined()

    unmount()
    expect(formContext.formValuesMap.has('radio')).toBe(false)
  })

  it('notifies changes, ignores checked taps and syncs controlled state', () => {
    let formContext: any
    const bindchange = jest.fn()

    const FormProbe = () => {
      const context = useContext(FormContext)
      useEffect(() => {
        formContext = context
      }, [context])
      return null
    }

    const { rerender } = render(
      <MpxForm testID="controlled-form">
        <MpxRadioGroup testID="radio-group" name="radio" bindchange={bindchange}>
          <MpxRadio testID="radio-a" value="a" checked={true}>
            City A
          </MpxRadio>
          <MpxRadio testID="radio-b" value="b">
            City B
          </MpxRadio>
        </MpxRadioGroup>
        <FormProbe />
      </MpxForm>
    )

    act(() => {
      fireTap(screen.getByTestId('radio-a'))
    })
    expect(bindchange).not.toHaveBeenCalled()

    act(() => {
      fireTap(screen.getByTestId('radio-b'))
    })
    expect(bindchange).toHaveBeenCalledWith(expect.objectContaining({
      detail: { value: 'b' }
    }))

    rerender(
      <MpxForm testID="controlled-form">
        <MpxRadioGroup testID="radio-group" name="radio" bindchange={bindchange}>
          <MpxRadio testID="radio-a" value="a" checked={false}>
            City A
          </MpxRadio>
          <MpxRadio testID="radio-b" value="b" checked={true}>
            City B
          </MpxRadio>
        </MpxRadioGroup>
        <FormProbe />
      </MpxForm>
    )
    expect(formContext.formValuesMap.get('radio').getValue()).toBe('b')
  })
})
