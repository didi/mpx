import React from 'react'
import { act, render, screen } from '@testing-library/react-native'
import MpxCheckbox from '../../../lib/runtime/components/react/mpx-checkbox'
import MpxCheckboxGroup from '../../../lib/runtime/components/react/mpx-checkbox-group'
import MpxLabel from '../../../lib/runtime/components/react/mpx-label'
import MpxRadio from '../../../lib/runtime/components/react/mpx-radio'
import MpxRadioGroup from '../../../lib/runtime/components/react/mpx-radio-group'
import { fireTap } from './helpers'

describe('MpxLabel', () => {
  it('triggers child checkbox change and its own tap handler', () => {
    const bindtap = jest.fn()
    const bindchange = jest.fn()

    render(
      <MpxCheckboxGroup testID="label-group" name="labelled" bindchange={bindchange}>
        <MpxLabel testID="basic-label" bindtap={bindtap}>
          <MpxCheckbox testID="label-checkbox" value="agree">
            Agree
          </MpxCheckbox>
        </MpxLabel>
      </MpxCheckboxGroup>
    )

    act(() => {
      fireTap(screen.getByTestId('basic-label'))
    })

    expect(bindtap).toHaveBeenCalled()
    expect(bindchange).toHaveBeenCalledWith(expect.objectContaining({
      detail: { value: ['agree'] }
    }))
  })

  it('triggers child radio change', () => {
    const bindchange = jest.fn()

    render(
      <MpxRadioGroup testID="label-radio-group" name="label-radio" bindchange={bindchange}>
        <MpxLabel testID="radio-label">
          <MpxRadio testID="label-radio" value="agree">
            Agree
          </MpxRadio>
        </MpxLabel>
      </MpxRadioGroup>
    )

    act(() => {
      fireTap(screen.getByTestId('radio-label'))
    })

    expect(bindchange).toHaveBeenCalledWith(expect.objectContaining({
      detail: { value: 'agree' }
    }))
  })
})
