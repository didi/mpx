import React from 'react'
import { act, render, screen } from '@testing-library/react-native'
import MpxCheckbox from '../../../lib/runtime/components/react/mpx-checkbox'
import MpxCheckboxGroup from '../../../lib/runtime/components/react/mpx-checkbox-group'
import MpxLabel from '../../../lib/runtime/components/react/mpx-label'
import MpxRadio from '../../../lib/runtime/components/react/mpx-radio'
import MpxRadioGroup from '../../../lib/runtime/components/react/mpx-radio-group'
import { fireTap } from './helpers'
import { expectPortalHostRendered, renderWithPortalHost } from './rn-component-test-utils'

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

  it('warns for background images and renders fixed labels in portal', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(jest.fn())

    const fixedRender = renderWithPortalHost(
      <MpxLabel
        testID="fixed-label"
        style={{ position: 'fixed', backgroundImage: 'url(label.png)' }}
      >
        Fixed label
      </MpxLabel>
    )

    expectPortalHostRendered(fixedRender.toJSON(), 'fixed-label')
    expect(screen.getByTestId('fixed-label').props.children.props.children).toBe('Fixed label')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('does not support background image'))
  })
})
