import React from 'react'
import { render, screen } from '@testing-library/react-native'
import MpxInlineText from '../../../lib/runtime/components/react/mpx-inline-text'
import { TextPassThroughContext } from '../../../lib/runtime/components/react/context'

describe('MpxInlineText', () => {
  it('merges text pass-through context with own props', () => {
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
    expect(inlineText.props.style).toEqual(expect.objectContaining({ color: 'red', fontSize: 20 }))
  })
})
