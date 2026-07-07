/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { resetMpxRuntimeGlobals } from './rn-component-test-utils'

const AsyncSuspense = require('../../../lib/runtime/components/react/mpx-async-suspense').default

beforeEach(() => {
  jest.clearAllMocks()
  resetMpxRuntimeGlobals()
})

describe('MpxAsyncSuspense', () => {
  it('loads a page chunk, caches it and renders fallback on errors', async () => {
    const Loaded = (props: { title: string }) => <Text>{props.title}</Text>
    const Loading = () => <Text>loading page</Text>
    const Fallback = ({ onReload }: { onReload: () => void }) => (
      <Text onPress={onReload}>fallback page</Text>
    )

    render(
      <AsyncSuspense
        type="page"
        chunkName="pkg-a"
        moduleId="async-page-ok"
        innerProps={{ title: 'loaded page' }}
        getLoading={() => Loading}
        getFallback={() => Fallback}
        getChildren={() => Promise.resolve(Loaded)}
      />
    )

    expect(screen.getByText('loading page')).toBeTruthy()
    await act(async () => {
      await Promise.resolve()
    })
    expect(screen.getByText('loaded page')).toBeTruthy()

    const { unmount } = render(
      <AsyncSuspense
        type="page"
        chunkName="pkg-a"
        moduleId="async-page-ok"
        innerProps={{ title: 'cached page' }}
        getChildren={() => Promise.reject(new Error('unused'))}
      />
    )
    expect(screen.getByText('cached page')).toBeTruthy()
    unmount()

    render(
      <AsyncSuspense
        type="page"
        chunkName="pkg-error"
        moduleId="async-page-error"
        innerProps={{}}
        getFallback={() => Fallback}
        getChildren={() => Promise.reject(Object.assign(new Error('timeout'), { type: 'timeout' }))}
      />
    )
    await act(async () => {
      await Promise.resolve()
    })
    expect(screen.getByText('fallback page')).toBeTruthy()
    expect((global as any).mpxGlobal.__mpx.config.rnConfig.onLazyLoadPageError).toHaveBeenCalledWith({
      subpackage: 'pkg-error',
      errType: 'timeout'
    })
  })

  it('notifies lazyLoad callbacks for component chunks', async () => {
    const ComponentFallback = () => <Text>component fallback</Text>

    render(
      <AsyncSuspense
        type="component"
        chunkName="component-pkg"
        moduleId="async-component-error"
        innerProps={{}}
        getFallback={() => ComponentFallback}
        getChildren={() => Promise.reject(Object.assign(new Error('network'), { type: 'network' }))}
      />
    )

    expect(screen.getByText('component fallback')).toBeTruthy()
    await act(async () => {
      await Promise.resolve()
    })
    expect((global as any).__mpxAppCbs.lazyLoad[0]).toHaveBeenCalledWith({
      type: 'subpackage',
      subpackage: ['component-pkg'],
      errMsg: 'loadSubpackage: network'
    })
  })

  it('renders default loading and retries from default fallback', async () => {
    const Loaded = () => <Text>default loaded</Text>
    const getChildren = jest
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('offline'), { type: 'offline' }))
      .mockResolvedValueOnce(Loaded)

    render(
      <AsyncSuspense
        type="page"
        chunkName="default-pkg"
        moduleId="async-default-retry"
        innerProps={{}}
        getChildren={getChildren}
      />
    )

    expect(screen.getByTestId('fast-image')).toBeTruthy()
    await act(async () => {
      await Promise.resolve()
    })
    expect(screen.getByText('网络出了点问题，请查看网络环境')).toBeTruthy()

    fireEvent(screen.getByText('点击重试').parent, 'press')
    await act(async () => {
      await Promise.resolve()
    })
    expect(screen.getByText('default loaded')).toBeTruthy()
  })
})
