/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { expectPortalHostInline, expectPortalHostRendered, renderWithPortalHost, resetMpxRuntimeGlobals } from './rn-component-test-utils'

const MpxRootPortal = require('../../../../lib/runtime/components/react/mpx-root-portal').default

beforeEach(() => {
  jest.clearAllMocks()
  resetMpxRuntimeGlobals()
})

describe('MpxRootPortal', () => {
  it('renders root portal conditionally and warns for unsupported style', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    const rootPortalRender = renderWithPortalHost(
      <>
        <MpxRootPortal style={{ width: 10 }}>
          <Text testID="root-portal">root portal</Text>
        </MpxRootPortal>
        <MpxRootPortal enable={false}>
          <Text testID="inline-portal">inline portal</Text>
        </MpxRootPortal>
      </>
    )

    expect(screen.getByText('root portal')).toBeTruthy()
    expect(screen.getByText('inline portal')).toBeTruthy()
    expectPortalHostRendered(rootPortalRender.toJSON(), 'root-portal')
    expectPortalHostInline(rootPortalRender.toJSON(), 'inline-portal')
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('root-portal component does not support the style prop'))
    warnSpy.mockRestore()
  })
})
