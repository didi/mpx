import React, { useContext, useEffect } from 'react'
import { act, render, screen } from '@testing-library/react-native'
import MpxCheckbox from '../../../lib/runtime/components/react/mpx-checkbox'
import MpxCheckboxGroup from '../../../lib/runtime/components/react/mpx-checkbox-group'
import MpxForm from '../../../lib/runtime/components/react/mpx-form'
import { FormContext } from '../../../lib/runtime/components/react/context'
import { fireTap } from './helpers'
import { expectPortalHostRendered, renderWithPortalHost } from './rn-component-test-utils'

describe('MpxCheckboxGroup', () => {
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
      <MpxForm testID="checkbox-form" bindsubmit={bindsubmit}>
        <MpxCheckboxGroup testID="form-checkbox-group" name="checks">
          <MpxCheckbox testID="form-checkbox-a" value="a" checked={true}>
            A
          </MpxCheckbox>
          <MpxCheckbox testID="form-checkbox-b" value="b">
            B
          </MpxCheckbox>
        </MpxCheckboxGroup>
        <FormProbe />
      </MpxForm>
    )

    act(() => {
      formContext.submit()
    })
    expect(bindsubmit).toHaveBeenCalledWith(expect.objectContaining({
      detail: {
        value: {
          checks: ['a']
        }
      }
    }))

    act(() => {
      formContext.reset()
    })
    expect(formContext.formValuesMap.get('checks').getValue()).toEqual([])

    unmount()
    expect(formContext.formValuesMap.has('checks')).toBe(false)
  })

  it('notifies changes', () => {
    const bindchange = jest.fn()

    render(
      <MpxCheckboxGroup testID="checkbox-group" name="fruits" bindchange={bindchange}>
        <MpxCheckbox testID="checkbox-apple" value="apple">
          Apple
        </MpxCheckbox>
        <MpxCheckbox testID="checkbox-banana" value="banana" checked={true}>
          Banana
        </MpxCheckbox>
      </MpxCheckboxGroup>
    )

    act(() => {
      fireTap(screen.getByTestId('checkbox-apple'))
    })
    expect(bindchange).toHaveBeenCalledWith(expect.objectContaining({
      type: 'change',
      detail: {
        value: expect.arrayContaining(['apple', 'banana'])
      }
    }))
  })

  it('syncs controlled checked state into form group', () => {
    let formContext: any

    const FormProbe = () => {
      const context = useContext(FormContext)
      useEffect(() => {
        formContext = context
      }, [context])
      return null
    }

    const { rerender } = render(
      <MpxForm testID="controlled-form">
        <MpxCheckboxGroup testID="controlled-checkbox-group" name="checks">
          <MpxCheckbox testID="controlled-checkbox" value="sync" checked={false}>
            Check
          </MpxCheckbox>
        </MpxCheckboxGroup>
        <FormProbe />
      </MpxForm>
    )

    expect(formContext.formValuesMap.get('checks').getValue()).toEqual([])

    rerender(
      <MpxForm testID="controlled-form">
        <MpxCheckboxGroup testID="controlled-checkbox-group" name="checks">
          <MpxCheckbox testID="controlled-checkbox" value="sync" checked={true}>
            Check
          </MpxCheckbox>
        </MpxCheckboxGroup>
        <FormProbe />
      </MpxForm>
    )

    expect(formContext.formValuesMap.get('checks').getValue()).toEqual(['sync'])
  })

  it('renders fixed groups in portal', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(jest.fn())
    const fixedRender = renderWithPortalHost(
      <MpxCheckboxGroup testID="fixed-checkbox-group" style={{ position: 'fixed' }}>
        <MpxCheckbox value="fixed">Fixed</MpxCheckbox>
      </MpxCheckboxGroup>
    )

    expectPortalHostRendered(fixedRender.toJSON(), 'fixed-checkbox-group')

    render(
      <MpxForm>
        <MpxCheckboxGroup testID="unnamed-checkbox-group">
          <MpxCheckbox value="unnamed">Unnamed</MpxCheckbox>
        </MpxCheckboxGroup>
      </MpxForm>
    )
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('name attribute is required'))
  })
})
