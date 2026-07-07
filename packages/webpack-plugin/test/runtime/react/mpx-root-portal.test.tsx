/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { renderWithPortalHost, resetMpxRuntimeGlobals } from './rn-component-test-utils'

const MpxRootPortal = require('../../../lib/runtime/components/react/mpx-root-portal').default

beforeEach(() => {
  jest.clearAllMocks()
  resetMpxRuntimeGlobals()
})

describe('MpxRootPortal', () => {
  it('renders root portal conditionally and warns for unsupported style', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    renderWithPortalHost(
      <>
        <MpxRootPortal style={{ width: 10 }}>
          <Text>root portal</Text>
        </MpxRootPortal>
        <MpxRootPortal enable={false}>
          <Text>inline portal</Text>
        </MpxRootPortal>
      </>
    )

    expect(screen.getByText('root portal')).toBeTruthy()
    expect(screen.getByText('inline portal')).toBeTruthy()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('root-portal component does not support the style prop'))
    warnSpy.mockRestore()
  })
})
