import React from 'react'
import { render, screen } from '@testing-library/react-native'
import MpxSimpleText from '../../../lib/runtime/components/react/mpx-simple-text'

describe('MpxSimpleText', () => {
  it('renders text with default font scaling and normalized styles', () => {
    render(
      <MpxSimpleText testID="simple-text" style={{ paddingLeft: 4 }}>
        Simple child
      </MpxSimpleText>
    )

    const text = screen.getByTestId('simple-text')
    expect(text.props.allowFontScaling).toBe(false)
    expect(text.props.style).toEqual(expect.objectContaining({ paddingLeft: 4, boxSizing: 'content-box' }))
  })
})
