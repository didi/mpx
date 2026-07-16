import React from 'react'
import { render, screen } from '@testing-library/react-native'
import MpxInlineText from '../../../lib/runtime/components/react/mpx-inline-text'
import { TextPassThroughContext } from '../../../lib/runtime/components/react/context'

describe('MpxInlineText', () => {
  it('uses inherited text style and ignores local style', () => {
    render(
      <TextPassThroughContext.Provider
        value={{
          textStyle: { color: 'red', fontSize: 16 },
          pendingTextProps: { numberOfLines: 1 }
        }}
      >
        <MpxInlineText testID="context-inline" style={{ fontSize: 20 }}>
          Context child
        </MpxInlineText>
      </TextPassThroughContext.Provider>
    )

    const inlineText = screen.getByTestId('context-inline')
    expect(inlineText.props.numberOfLines).toBe(1)
    expect(inlineText.props.style).toEqual(expect.objectContaining({ color: 'red', fontSize: 16 }))
  })

  it('renders without inherited text props', () => {
    render(
      <MpxInlineText testID="plain-inline" allowFontScaling={false}>
        Plain child
      </MpxInlineText>
    )

    const inlineText = screen.getByTestId('plain-inline')
    expect(inlineText.props.allowFontScaling).toBe(false)
    expect(inlineText.props.style).toBeUndefined()
  })
})
