import React from 'react'
import { render, screen } from '@testing-library/react-native'
import MpxInlineText from '../../../../lib/runtime/components/react/mpx-inline-text'
import MpxSimpleText from '../../../../lib/runtime/components/react/mpx-simple-text'
import MpxSimpleView from '../../../../lib/runtime/components/react/mpx-simple-view'

describe('MpxSimpleView', () => {
  it('passes text props through to children', () => {
    render(
      <MpxSimpleView
        testID="simple-view"
        enable-text-pass-through={true}
        style={{ padding: 8, color: '#f00', fontSize: 18 }}
        numberOfLines={2}
      >
        <MpxSimpleText testID="simple-text" style={{ paddingLeft: 4 }}>
          <MpxInlineText testID="inline-text">Inline child</MpxInlineText>
        </MpxSimpleText>
      </MpxSimpleView>
    )

    const view = screen.getByTestId('simple-view')
    expect(view.props.style).toEqual(expect.objectContaining({ padding: 8, boxSizing: 'content-box' }))

    const inlineText = screen.getByTestId('inline-text')
    expect(inlineText.props.numberOfLines).toBe(2)
    expect(inlineText.props.style).toEqual(expect.objectContaining({ color: '#f00', fontSize: 18 }))
  })

  it('records perf scopes when perf is enabled', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const perf = require('@mpxjs/perf')
    perf.scopeStart.mockClear()
    perf.scopeEnd.mockClear()
    ;(global as any).__mpx_perf_framework__ = true

    render(
      <MpxSimpleView testID="perf-view" style={{ padding: 1 }}>
        <MpxSimpleText testID="perf-text">Perf text</MpxSimpleText>
      </MpxSimpleView>
    )

    expect(perf.scopeStart).toHaveBeenCalledWith('simple-view:render:total')
    expect(perf.scopeStart).toHaveBeenCalledWith('simple-text:render:total')
    expect(perf.scopeEnd).toHaveBeenCalled()
    ;(global as any).__mpx_perf_framework__ = false
  })
})
