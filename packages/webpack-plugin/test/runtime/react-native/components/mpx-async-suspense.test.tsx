/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { resetMpxRuntimeGlobals } from './rn-component-test-utils'

const AsyncSuspense = require('../../../../lib/runtime/components/react/mpx-async-suspense').default

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

  it('renders no component placeholder when fallback is omitted', async () => {
    const componentRender = render(
      <AsyncSuspense
        type="component"
        chunkName="empty-component-pkg"
        moduleId="async-component-without-fallback"
        innerProps={{}}
        getChildren={() => Promise.reject(Object.assign(new Error('network'), { type: 'network' }))}
      />
    )

    expect(componentRender.toJSON()).toBeNull()
    await act(async () => {
      await Promise.resolve()
    })
    expect(componentRender.toJSON()).toBeNull()
    expect((global as any).__mpxAppCbs.lazyLoad[0]).toHaveBeenCalledWith({
      type: 'subpackage',
      subpackage: ['empty-component-pkg'],
      errMsg: 'loadSubpackage: network'
    })
  })

  it('ignores resolved and rejected chunk callbacks after unmount', async () => {
    const StaleLoaded = () => <Text>stale loaded</Text>
    const LatestLoaded = () => <Text>latest loaded</Text>
    let resolveStale: (value: React.ReactNode) => void = () => undefined
    let rejectStale: (reason: Error) => void = () => undefined
    const staleResolvePromise = new Promise<React.ReactNode>((resolve) => {
      resolveStale = resolve
    })
    const staleRejectPromise = new Promise<React.ReactNode>((_resolve, reject) => {
      rejectStale = reject
    })

    const staleResolveRender = render(
      <AsyncSuspense
        type="page"
        chunkName="stale-resolve-pkg"
        moduleId="async-stale-resolve"
        innerProps={{}}
        getLoading={() => () => <Text>stale loading</Text>}
        getChildren={() => staleResolvePromise}
      />
    )
    expect(screen.getByText('stale loading')).toBeTruthy()
    staleResolveRender.unmount()
    await act(async () => {
      resolveStale(StaleLoaded)
      await staleResolvePromise
    })

    const getLatestChildren = jest.fn(() => Promise.resolve(LatestLoaded))
    render(
      <AsyncSuspense
        type="page"
        chunkName="stale-resolve-pkg"
        moduleId="async-stale-resolve"
        innerProps={{}}
        getLoading={() => () => <Text>latest loading</Text>}
        getChildren={getLatestChildren}
      />
    )
    expect(screen.getByText('latest loading')).toBeTruthy()
    await act(async () => {
      await Promise.resolve()
    })
    expect(screen.getByText('latest loaded')).toBeTruthy()
    expect(getLatestChildren).toHaveBeenCalledTimes(1)

    const pageErrorHandler = (global as any).mpxGlobal.__mpx.config.rnConfig.onLazyLoadPageError
    pageErrorHandler.mockClear()
    const staleRejectRender = render(
      <AsyncSuspense
        type="page"
        chunkName="stale-reject-pkg"
        moduleId="async-stale-reject"
        innerProps={{}}
        getLoading={() => () => <Text>reject loading</Text>}
        getChildren={() => staleRejectPromise}
      />
    )
    expect(screen.getByText('reject loading')).toBeTruthy()
    staleRejectRender.unmount()
    await act(async () => {
      rejectStale(Object.assign(new Error('late error'), { type: 'late' }))
      await staleRejectPromise.catch(() => undefined)
    })
    expect(pageErrorHandler).not.toHaveBeenCalled()
  })

  it('shows page fallback when no lazy-load error handler is configured', async () => {
    const Fallback = () => <Text>fallback without handler</Text>
    ;(global as any).mpxGlobal.__mpx.config.rnConfig.onLazyLoadPageError = undefined

    render(
      <AsyncSuspense
        type="page"
        chunkName="no-handler-pkg"
        moduleId="async-page-no-handler"
        innerProps={{}}
        getFallback={() => Fallback}
        getChildren={() => Promise.reject(Object.assign(new Error('offline'), { type: 'offline' }))}
      />
    )

    await act(async () => {
      await Promise.resolve()
    })
    expect(screen.getByText('fallback without handler')).toBeTruthy()
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
