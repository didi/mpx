import React from 'react'
import { act, create } from 'react-test-renderer'
import MpxNav from '../../../lib/runtime/components/react/mpx-nav'

jest.mock('react-native', () => ({
  StatusBar: 'StatusBar',
  TouchableWithoutFeedback: 'TouchableWithoutFeedback',
  Image: 'Image',
  View: 'View',
  Text: 'Text',
  StyleSheet: { create: (styles: any) => styles },
  processColor: (color: string) => color ? parseInt(color.slice(1), 16) : null
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 20 })
}))

jest.mock('@react-navigation/native', () => {
  const React = jest.requireActual('react')
  const NavigationContext = React.createContext(null)
  return {
    NavigationContext,
    useRoute: () => React.useContext(NavigationContext).route,
    useNavigationState: (selector: (state: any) => boolean) => {
      const { navigation } = React.useContext(NavigationContext)
      return React.useSyncExternalStore(
        React.useCallback((callback: () => void) => navigation.addListener('state', callback), [navigation]),
        () => selector(navigation.getState())
      )
    }
  }
}, { virtual: true })

const { NavigationContext } = jest.requireMock('@react-navigation/native')
const renderNav = (navigation: any, pageConfig = {}, routeKey = 'home') => React.createElement(
  NavigationContext.Provider, { value: { navigation, route: { key: routeKey } } },
  React.createElement(MpxNav, { pageConfig, navigation })
)

describe('RN built-in navigation bar', () => {
  const createNavigation = (routeKeys = ['home']) => {
    let state = { routes: routeKeys.map(key => ({ key })) }
    const listeners = new Set<() => void>()
    return {
      getState: () => state,
      goBack: jest.fn(),
      addListener: jest.fn((event: string, callback: () => void) => {
        expect(event).toBe('state')
        listeners.add(callback)
        return () => listeners.delete(callback)
      }),
      setRoutes: (keys: string[], notify = true) => {
        state = { routes: keys.map(key => ({ key })) }
        if (notify) listeners.forEach(callback => callback())
      },
      listeners
    }
  }

  afterEach(() => {
    delete (global as any).__mpx.config.rnConfig
  })

  test('merges consecutive title and color updates in the same batch', () => {
    const navigation: any = createNavigation()
    let renderer: any
    act(() => {
      renderer = create(renderNav(navigation, { navigationBarTitleText: 'Initial' }))
    })
    act(() => {
      navigation.setPageConfig({ navigationBarTitleText: 'Updated' })
      navigation.setPageConfig({ navigationBarTextStyle: '#000000', navigationBarBackgroundColor: '#123456' })
    })

    expect(renderer.root.findByType('Text').props.children).toBe('Updated')
    expect(renderer.root.findByType('Text').props.style[1].color).toBe('#000000')
    expect(renderer.root.findAllByType('View')[0].props.style[1].backgroundColor).toBe('#123456')
    expect(renderer.root.findByType('StatusBar').props.barStyle).toBe('dark-content')
    act(() => renderer.unmount())
  })

  test('keeps the home page identity while a detail page is open and after returning', () => {
    const onStackTopBack = jest.fn()
    ;(global as any).__mpx.config.rnConfig = { onStackTopBack }
    const navigation = createNavigation(['home', 'detail'])
    let renderer: any
    act(() => {
      renderer = create(renderNav(navigation))
    })
    renderer.root.findByType('TouchableWithoutFeedback').props.onPress()
    expect(onStackTopBack).toHaveBeenCalledTimes(1)
    expect(navigation.goBack).not.toHaveBeenCalled()

    act(() => renderer.update(renderNav(navigation, {}, 'detail')))
    renderer.root.findByType('TouchableWithoutFeedback').props.onPress()
    expect(navigation.goBack).toHaveBeenCalledTimes(1)

    // 模拟后台首页重渲染后，栈已回退但导航栏尚未重渲染。
    act(() => renderer.update(renderNav(navigation)))
    const onPress = renderer.root.findByType('TouchableWithoutFeedback').props.onPress
    navigation.setRoutes(['home'], false)
    onPress()
    expect(onStackTopBack).toHaveBeenCalledTimes(2)
    expect(navigation.goBack).toHaveBeenCalledTimes(1)
    act(() => renderer.unmount())
  })

  test('updates back button visibility on state changes and cleans up subscriptions', () => {
    const navigation = createNavigation()
    let renderer: any
    act(() => {
      renderer = create(renderNav(navigation))
    })
    expect(renderer.root.findAllByType('TouchableWithoutFeedback')).toHaveLength(0)
    act(() => navigation.setRoutes(['home', 'detail']))
    expect(renderer.root.findAllByType('TouchableWithoutFeedback')).toHaveLength(0)
    act(() => navigation.setRoutes(['detail', 'home']))
    expect(renderer.root.findAllByType('TouchableWithoutFeedback')).toHaveLength(1)
    act(() => navigation.setRoutes(['home']))
    expect(renderer.root.findAllByType('TouchableWithoutFeedback')).toHaveLength(0)

    const nextNavigation = createNavigation(['detail', 'home'])
    act(() => {
      renderer.update(renderNav(nextNavigation))
    })
    expect(navigation.listeners.size).toBe(0)
    expect(nextNavigation.listeners.size).toBe(1)
    act(() => renderer.root.findByType('TouchableWithoutFeedback').props.onPress())
    expect(nextNavigation.goBack).toHaveBeenCalledTimes(1)
    expect(navigation.goBack).not.toHaveBeenCalled()
    act(() => renderer.unmount())
    expect(nextNavigation.listeners.size).toBe(0)
  })
})
