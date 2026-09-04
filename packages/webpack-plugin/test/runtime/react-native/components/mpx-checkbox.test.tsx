import React from 'react'
import { act, render, screen, waitFor } from '@testing-library/react-native'
import MpxCheckbox from '../../../../lib/runtime/components/react/mpx-checkbox'
import { createTouchEvent } from './helpers'

const mockPortal = jest.fn()

jest.mock('../../../../lib/runtime/components/react/mpx-portal', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mockReact = require('react')
  return ({ children }: { children: any }) => {
    mockPortal(children)
    return mockReact.createElement(mockReact.Fragment, null, children)
  }
})

describe('MpxCheckbox', () => {
  beforeEach(() => {
    mockPortal.mockClear()
  })

  it('renders fixed checkbox through portal with background warning', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    render(
      <MpxCheckbox
        testID="fixed-checkbox"
        value="fixed-checkbox"
        style={{ position: 'fixed', backgroundImage: 'url(https://example.com/a.png)' }}
      >
        Fixed check
      </MpxCheckbox>
    )

    await waitFor(() => {
      expect(screen.getByTestId('fixed-checkbox')).toBeTruthy()
    })
    expect(mockPortal).toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Checkbox does not support background image-related styles!'))

    warnSpy.mockRestore()
  })

  it('handles disabled and controlled checked states', () => {
    const bindtap = jest.fn()
    const onChange = jest.fn()
    const ref = React.createRef<any>()
    const { rerender } = render(
      <MpxCheckbox
        ref={ref}
        testID="disabled-checkbox"
        disabled={true}
        bindtap={bindtap}
        _onChange={onChange}
      >
        Disabled check
      </MpxCheckbox>
    )

    act(() => {
      ref.current.getNodeInstance().instance.change(createTouchEvent() as any)
    })
    expect(bindtap).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()

    rerender(
      <MpxCheckbox
        testID="controlled-checkbox"
        checked={true}
        color="#ff0000"
      >
        Controlled check
      </MpxCheckbox>
    )
    const controlledCheckbox = screen.getByTestId('controlled-checkbox')
    const checkedIcon = controlledCheckbox.findAll((node: any) => node.type === 'Image')[0]
    expect(checkedIcon.props.style).toEqual(expect.objectContaining({
      opacity: 1,
      tintColor: '#ff0000'
    }))
  })
})
