import React, { useContext, useEffect } from 'react'
import { act, render } from '@testing-library/react-native'
import MpxForm from '../../../lib/runtime/components/react/mpx-form'
import MpxSwitch from '../../../lib/runtime/components/react/mpx-switch'
import { FormContext } from '../../../lib/runtime/components/react/context'

describe('MpxForm', () => {
  it('registers fields and submits/reset values', () => {
    let formContext: any
    const bindsubmit = jest.fn()
    const bindreset = jest.fn()

    const FormProbe = () => {
      const context = useContext(FormContext)
      useEffect(() => {
        formContext = context
      }, [context])
      return null
    }

    render(
      <MpxForm testID="basic-form" bindsubmit={bindsubmit} bindreset={bindreset}>
        <MpxSwitch testID="form-switch" name="enabled" checked={true} />
        <FormProbe />
      </MpxForm>
    )

    expect(formContext.formValuesMap.has('enabled')).toBe(true)

    act(() => {
      formContext.submit()
    })
    expect(bindsubmit).toHaveBeenCalledWith(expect.objectContaining({
      detail: {
        value: {
          enabled: true
        }
      }
    }))

    act(() => {
      formContext.reset()
    })
    expect(bindreset).toHaveBeenCalledWith(expect.objectContaining({ type: 'reset' }))
    expect(formContext.formValuesMap.get('enabled').getValue()).toBe(false)
  })
})
