/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { act, render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { renderWithPortalHost, resetMpxRuntimeGlobals } from './rn-component-test-utils'

const Portal = require('../../../lib/runtime/components/react/mpx-portal').default
const { ProviderContext, RouteContext, TextPassThroughContext } = require('../../../lib/runtime/components/react/context')

beforeEach(() => {
  jest.clearAllMocks()
  resetMpxRuntimeGlobals()
})

describe('MpxPortal', () => {
  it('mounts, updates and removes portal children', () => {
    const { rerender, queryByText } = renderWithPortalHost(
      <Portal>
        <Text>portal one</Text>
      </Portal>
    )

    expect(screen.getByText('portal one')).toBeTruthy()

    rerender(
      <RouteContext.Provider value={{ pageId: 1, navigation: {} }}>
        <Portal.Host pageId={1}>
          <Portal>
            <Text>portal two</Text>
          </Portal>
        </Portal.Host>
      </RouteContext.Provider>
    )
    expect(screen.getByText('portal two')).toBeTruthy()

    let key = 0
    act(() => {
      key = Portal.add(<Text>static portal</Text>, 1)
    })
    expect(screen.getByText('static portal')).toBeTruthy()

    act(() => {
      Portal.update(key, <Text>static updated</Text>)
    })
    expect(screen.getByText('static updated')).toBeTruthy()

    act(() => {
      Portal.remove(key)
    })
    expect(queryByText('static updated')).toBeNull()
  })

  it('preserves provider and text pass-through contexts in portal children', () => {
    const Probe = () => (
      <ProviderContext.Consumer>
        {(provides: any) => (
          <TextPassThroughContext.Consumer>
            {(textPassThrough: any) => (
              <Text>{`${provides.theme}-${textPassThrough.textStyle.color}`}</Text>
            )}
          </TextPassThroughContext.Consumer>
        )}
      </ProviderContext.Consumer>
    )

    renderWithPortalHost(
      <ProviderContext.Provider value={{ theme: 'dark' }}>
        <TextPassThroughContext.Provider value={{ textStyle: { color: 'red' } }}>
          <Portal>
            <Probe />
          </Portal>
        </TextPassThroughContext.Provider>
      </ProviderContext.Provider>
    )

    expect(screen.getByText('dark-red')).toBeTruthy()
  })
})
