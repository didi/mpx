import { setFocusedNavigation } from '@mpxjs/utils'
import { preload, navigateTo, redirectTo } from '../../src/platform/api/route/index.ios'
import promisify from '../../src/common/js/promisify'
import pageRouteMixin from '../../../core/src/platform/builtInMixins/pageRouteMixin.ios'
import { BEFORECREATE, ONSHOW } from '../../../core/src/core/innerLifecycle'

describe('RN page preload', () => {
  let navigation
  beforeEach(() => {
    jest.useFakeTimers()
    navigation = {
      isFocused: () => true,
      getState: () => ({ type: 'stack', index: 0, routes: [{ name: 'pages/home' }], preloadedRoutes: [] }),
      preload: jest.fn(),
      push: jest.fn(),
      replace: jest.fn()
    }
    global.__mpxPagesMap = { background: [null, { isFocused: () => false }], home: [null, navigation] }
    global.__navigationHelper = {}
  })

  afterEach(() => {
    setFocusedNavigation(undefined)
    delete global.__mpxPagesMap
    delete global.__navigationHelper
    delete global.__mpxEventChannel
    jest.useRealTimers()
  })

  test('preloads relative to the focused page without locking or promisifying the call', () => {
    expect(promisify({ preload }).preload({ url: './detail?id=1' })).toBeUndefined()
    expect(navigation.preload).toHaveBeenCalledWith('pages/detail', { id: '1' })
    expect(global.__navigationHelper).toEqual({})
    redirectTo({ url: './detail?id=2' })
    expect(navigation.replace).toHaveBeenCalledWith('pages/detail', { id: '2' })
  })

  test('claims the navigateTo channel only on the first show of a preloaded page', () => {
    const route = { key: 'detail-key', name: 'pages/detail' }
    const detail = { route: route.name, __props: { route, navigation: { getState: () => ({ preloadedRoutes: [route] }) } } }
    const mixin = pageRouteMixin('page')
    mixin[BEFORECREATE].call(detail)
    expect(mixin.methods.getOpenerEventChannel.call(detail)).toBeUndefined()
    navigateTo({ url: './detail' })
    const channel = global.__mpxEventChannel.eventChannel
    expect(navigation.push).toHaveBeenCalledWith('pages/detail', {})
    mixin[ONSHOW].call(detail)
    expect(mixin.methods.getOpenerEventChannel.call(detail)).toBe(channel)
    expect(global.__mpxEventChannel).toBeUndefined()
    mixin[ONSHOW].call(detail)
    expect(mixin.methods.getOpenerEventChannel.call(detail)).toBe(channel)
  })
})
