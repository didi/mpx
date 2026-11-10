import React from 'react'
import { act, create, ReactTestRenderer } from 'react-test-renderer'
import { setFocusedNavigation } from '@mpxjs/utils'
import Portal from '../../../lib/runtime/components/react/mpx-portal'
import { PortalContext, RouteContext } from '../../../lib/runtime/components/react/context'

jest.mock('react-native', () => ({
  View: 'View',
  StyleSheet: { create: (styles: any) => styles }
}))

describe('RN Portal pending content', () => {
  const renderers: ReactTestRenderer[] = []
  const content = (label: string) => React.createElement('Overlay', { label })
  const labels = (renderer: ReactTestRenderer) => renderer.root.findAllByType('Overlay').map(node => node.props.label)

  function mountPage (pageId: number, children?: React.ReactNode) {
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(
        <RouteContext.Provider value={{ pageId, navigation: {} }}>
          <Portal.Host id={pageId}>{children}</Portal.Host>
        </RouteContext.Provider>
      )
    })
    renderers.push(renderer!)
    return renderer!
  }

  beforeEach(() => {
    global.__mpxPagesMap = {}
    setFocusedNavigation(null)
  })

  afterEach(() => {
    act(() => renderers.splice(0).forEach(renderer => renderer.unmount()))
    setFocusedNavigation(null)
    delete global.__mpxPagesMap
  })

  it('hands content without a pageId to the first host only', () => {
    const onBind = jest.fn()
    const key = Portal.add(content('startup'), null, onBind)
    expect(Portal.getPageId(key)).toBeNull()
    const first = mountPage(1)
    const second = mountPage(2)
    expect(labels(first)).toEqual(['startup'])
    expect(labels(second)).toEqual([])
    expect(Portal.getPageId(key)).toBe(1)
    expect(onBind).toHaveBeenCalledTimes(1)
    expect(onBind).toHaveBeenCalledWith(1)
  })

  it('waits for the specified page and retains updates and cancellation', () => {
    const key = Portal.add(content('old'), 2)
    const cancelled = Portal.add(content('cancelled'), 2)
    Portal.update(key, content('latest'))
    Portal.remove(cancelled)
    Portal.update(cancelled, content('must not return'))
    expect(labels(mountPage(1))).toEqual([])
    expect(labels(mountPage(2))).toEqual(['latest'])
  })

  it('can update and cancel unassigned content before a host exists', () => {
    const key = Portal.add(content('old'), null)
    const cancelled = Portal.add(content('cancelled'))
    Portal.update(key, content('latest'))
    Portal.remove(cancelled)
    expect(labels(mountPage(1))).toEqual(['latest'])
  })

  it('uses focused navigation when pageId is omitted', () => {
    const first = mountPage(1)
    const second = mountPage(2)
    setFocusedNavigation({ pageId: 2, isFocused: () => true })
    let key: number
    act(() => { key = Portal.add(content('focused')) })
    expect(labels(first)).toEqual([])
    expect(labels(second)).toEqual(['focused'])
    act(() => Portal.update(key, content('updated')))
    expect(labels(second)).toEqual(['updated'])
    act(() => Portal.remove(key))
    expect(labels(second)).toEqual([])
  })

  it('buffers requests for an available page before its host mounts', () => {
    setFocusedNavigation({ pageId: 2, isFocused: () => true })
    const key = Portal.add(content('launch'))
    expect(Portal.getPageId(key)).toBe(2)
    expect(labels(mountPage(1))).toEqual([])
    expect(labels(mountPage(2))).toEqual(['launch'])
  })

  it('uses an existing host when no navigation is available', () => {
    const first = mountPage(1)
    act(() => { Portal.add(content('available')) })
    expect(labels(first)).toEqual(['available'])
  })

  it('cleans up page content and caches new requests after all hosts unmount', () => {
    let isFocused = true
    const navigation = { pageId: 1, isFocused: () => isFocused }
    setFocusedNavigation(navigation)
    global.__mpxPagesMap = { first: [null, navigation] }
    const key = Portal.add(content('old'))
    const first = mountPage(1)
    act(() => first.unmount())
    isFocused = false
    global.__mpxPagesMap = {}
    expect(Portal.getPageId(key)).toBeUndefined()
    Portal.update(key, content('must not return'))
    Portal.add(content('next startup'))
    expect(labels(mountPage(2))).toEqual(['next startup'])
  })

  it.each([true, false])('preserves declarative Portal mounting, updates and cleanup (page context: %s)', (withPage) => {
    const renderContent = (children?: React.ReactNode) => withPage
      ? <RouteContext.Provider value={{ pageId: 1, navigation: {} }}><Portal.Host id={1}>{children}</Portal.Host></RouteContext.Provider>
      : <Portal.Host>{children}</Portal.Host>
    let renderer: ReactTestRenderer
    act(() => { renderer = create(renderContent(<Portal>{content('declarative')}</Portal>)) })
    renderers.push(renderer!)
    expect(labels(renderer!)).toEqual(['declarative'])
    act(() => renderer.update(renderContent(<Portal>{content('updated')}</Portal>)))
    expect(labels(renderer!)).toEqual(['updated'])
    act(() => renderer.update(renderContent()))
    expect(labels(renderer!)).toEqual([])
  })

  it('shares keys and cleanup between declarative and imperative portals', () => {
    const key = Portal.add(content('imperative'), 1)
    const renderer = mountPage(1, <Portal>{content('declarative')}</Portal>)
    expect(labels(renderer)).toEqual(['imperative', 'declarative'])
    act(() => Portal.update(key, content('updated imperative')))
    expect(labels(renderer)).toEqual(['updated imperative', 'declarative'])
    act(() => Portal.remove(key))
    expect(labels(renderer)).toEqual(['declarative'])
    act(() => renderer.unmount())
    expect(labels(mountPage(1))).toEqual([])
  })

  it('keeps standalone hosts from receiving pending page requests', () => {
    const onBind = jest.fn()
    const key = Portal.add(content('startup'), null, onBind)
    let standalone: ReactTestRenderer
    act(() => { standalone = create(<Portal.Host><Portal>{content('standalone')}</Portal></Portal.Host>) })
    renderers.push(standalone!)
    expect(labels(standalone!)).toEqual(['standalone'])
    expect(Portal.getPageId()).toBeNull()
    expect(Portal.getPageId(key)).toBeNull()
    expect(onBind).not.toHaveBeenCalled()
    expect(labels(mountPage(1))).toEqual(['startup'])
    expect(onBind).toHaveBeenCalledWith(1)
    expect(labels(standalone!)).toEqual(['standalone'])
  })

  it('manages declarative entries in the guard while isolating hosts on the same page', () => {
    const keys: number[] = []
    function Content ({ label }: { label: string }) {
      const manager = React.useContext(PortalContext)
      React.useLayoutEffect(() => {
        const key = manager.mount(content(label))
        keys.push(key)
        return () => manager.unmount(key)
      }, [])
      return null
    }
    function mountHost (label: string) {
      let renderer: ReactTestRenderer
      act(() => {
        renderer = create(
          <RouteContext.Provider value={{ pageId: 1, navigation: {} }}>
            <Portal.Host><Content label={label} /></Portal.Host>
          </RouteContext.Provider>
        )
      })
      renderers.push(renderer!)
      return renderer!
    }
    const first = mountHost('first')
    const second = mountHost('second')
    expect(labels(first)).toEqual(['first'])
    expect(labels(second)).toEqual(['second'])
    act(() => Portal.update(keys[0], content('updated')))
    expect(labels(first)).toEqual(['updated'])
    expect(labels(second)).toEqual(['second'])
    act(() => second.unmount())
    act(() => Portal.update(keys[1], content('must not return')))
    act(() => Portal.remove(keys[0]))
    expect(labels(first)).toEqual([])
  })

  it.each([true, false])('buffers context updates and cancellation before the host is ready (page context: %s)', (withPage) => {
    let key: number
    function Content () {
      const manager = React.useContext(PortalContext)
      React.useLayoutEffect(() => {
        key = manager.mount(content('old'))
        manager.update(key, content('latest'))
        const cancelled = manager.mount(content('cancelled'))
        manager.unmount(cancelled)
        return () => manager.unmount(key)
      }, [])
      return null
    }
    let renderer: ReactTestRenderer
    if (withPage) {
      renderer = mountPage(1, <Content />)
    } else {
      act(() => { renderer = create(<Portal.Host><Content /></Portal.Host>) })
      renderers.push(renderer!)
    }
    expect(labels(renderer!)).toEqual(['latest'])
    act(() => renderer.unmount())
  })
})
