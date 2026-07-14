import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import MpxSwitch from '../../../lib/runtime/components/react/mpx-switch'
import MpxForm from '../../../lib/runtime/components/react/mpx-form'
import { fireTap } from './helpers'
import { expectPortalHostRendered, renderWithPortalHost } from './rn-component-test-utils'

describe('MpxSwitch', () => {
  it('handles value changes and checkbox mode changes', () => {
    const bindchange = jest.fn()
    const checkboxChange = jest.fn()

    const { unmount } = render(
      <MpxSwitch
        testID="basic-switch"
        checked={false}
        color="#0f0"
        bindchange={bindchange}
      />
    )

    fireEvent(screen.getByTestId('basic-switch'), 'valueChange', true)
    expect(bindchange).toHaveBeenCalledWith(expect.objectContaining({
      detail: { value: true }
    }))
    expect(screen.getByTestId('basic-switch').props.value).toBe(true)

    unmount()

    render(
      <MpxSwitch
        testID="checkbox-switch"
        type="checkbox"
        checked={false}
        color="#00f"
        bindchange={checkboxChange}
      />
    )

    act(() => {
      fireTap(screen.getByTestId('checkbox-switch'))
    })
    expect(checkboxChange).toHaveBeenCalledWith(expect.objectContaining({
      detail: { value: true }
    }))
  })

  it('renders fixed switches in portal', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(jest.fn())
    const fixedRender = renderWithPortalHost(
      <MpxSwitch testID="fixed-switch" style={{ position: 'fixed' }} />
    )

    expectPortalHostRendered(fixedRender.toJSON(), 'fixed-switch')

    render(
      <MpxForm>
        <MpxSwitch testID="unnamed-switch" />
      </MpxForm>
    )
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('name attribute is required'))
  })
})
