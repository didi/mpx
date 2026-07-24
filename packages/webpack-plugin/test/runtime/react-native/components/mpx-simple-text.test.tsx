import React from 'react'
import { render, screen } from '@testing-library/react-native'
import MpxSimpleText from '../../../../lib/runtime/components/react/mpx-simple-text'

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

  it('passes text styles to nested text and preserves explicit font scaling', () => {
    render(
      <MpxSimpleText
        testID="parent-text"
        allowFontScaling={true}
        style={{ color: '#f00', fontSize: 20 }}
      >
        <MpxSimpleText testID="child-text">Nested child</MpxSimpleText>
      </MpxSimpleText>
    )

    expect(screen.getByTestId('parent-text').props.allowFontScaling).toBe(true)
    expect(screen.getByTestId('child-text').props.style).toEqual(expect.objectContaining({
      color: '#f00',
      fontSize: 20
    }))
  })
})
