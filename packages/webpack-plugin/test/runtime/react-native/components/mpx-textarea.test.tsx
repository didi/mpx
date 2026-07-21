import React from 'react'
import { render, screen } from '@testing-library/react-native'
import MpxTextarea from '../../../../lib/runtime/components/react/mpx-textarea'

describe('MpxTextarea', () => {
  it('renders through input defaults', () => {
    render(
      <MpxTextarea
        testID="basic-textarea"
        value="hello"
        style={{ height: 200 }}
        cursor={2}
      />
    )

    const textarea = screen.getByTestId('basic-textarea')
    expect(textarea.props.multiline).toBe(true)
    expect(textarea.props.enterKeyHint).toBeUndefined()
    expect(textarea.props.selection).toEqual({ start: 2, end: 2 })
    expect(textarea.props.style).toEqual(expect.objectContaining({
      width: 300,
      height: 200
    }))
  })

  it('uses textarea dimensions when style is omitted', () => {
    render(<MpxTextarea testID="default-textarea" />)

    expect(screen.getByTestId('default-textarea').props.style).toEqual(expect.objectContaining({
      width: 300,
      height: 150
    }))
  })
})
