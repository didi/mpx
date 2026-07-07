/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useContext, useEffect } from 'react'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { resetMpxRuntimeGlobals } from './rn-component-test-utils'

const MpxStickySection = require('../../../lib/runtime/components/react/mpx-sticky-section').default
const { StickyContext } = require('../../../lib/runtime/components/react/context')

beforeEach(() => {
  jest.clearAllMocks()
  resetMpxRuntimeGlobals()
})

describe('MpxStickySection', () => {
  it('updates registered sticky headers from section layout', () => {
    const updatePosition = jest.fn()
    const unregisterPosition = jest.fn()
    const Child = () => {
      const sticky = useContext(StickyContext)
      useEffect(() => {
        sticky.registerStickyHeader({ id: 'header', updatePosition })
        sticky.registerStickyHeader({ id: 'removed', updatePosition: unregisterPosition })
        sticky.unregisterStickyHeader('removed')
      }, [])
      return <Text>section child</Text>
    }

    render(
      <MpxStickySection testID="sticky-section">
        <Child />
      </MpxStickySection>
    )

    fireEvent(screen.getByTestId('sticky-section'), 'layout', {
      nativeEvent: { layout: { width: 100, height: 50 } }
    })
    expect(updatePosition).toHaveBeenCalled()
    expect(unregisterPosition).not.toHaveBeenCalled()
  })
})
