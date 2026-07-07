import React from 'react'
import { act, render, screen, waitFor } from '@testing-library/react-native'
import MpxRadio from '../../../lib/runtime/components/react/mpx-radio'
import { createTouchEvent } from './helpers'

jest.mock('../../../lib/runtime/components/react/mpx-portal', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mockReact = require('react')
  return ({ children }: { children: any }) => mockReact.createElement(mockReact.Fragment, null, children)
})

describe('MpxRadio', () => {
  it('renders fixed radio through portal with background warning', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    render(
      <MpxRadio
        testID="fixed-radio"
        value="fixed-radio"
        style={{ position: 'fixed', backgroundImage: 'url(https://example.com/b.png)' }}
      >
        Fixed radio
      </MpxRadio>
    )

    await waitFor(() => {
      expect(screen.getByTestId('fixed-radio')).toBeTruthy()
    })
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Radio does not support background image-related styles!'))

    warnSpy.mockRestore()
  })

  it('handles disabled and controlled checked states', () => {
    const bindtap = jest.fn()
    const ref = React.createRef<any>()
    const { rerender } = render(
      <MpxRadio
        ref={ref}
        testID="disabled-radio"
        disabled={true}
        bindtap={bindtap}
      >
        Disabled radio
      </MpxRadio>
    )

    act(() => {
      ref.current.getNodeInstance().instance.change(createTouchEvent() as any)
    })
    expect(bindtap).not.toHaveBeenCalled()

    rerender(
      <MpxRadio
        testID="controlled-radio"
        checked={true}
        color="#ff0000"
      >
        Controlled radio
      </MpxRadio>
    )
    expect(screen.getByTestId('controlled-radio')).toBeTruthy()
  })
})
