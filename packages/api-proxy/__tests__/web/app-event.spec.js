import {
  offAppHide,
  offAppShow,
  offError,
  offPageNotFound,
  offUnhandledRejection,
  onAppHide,
  onAppShow,
  onError,
  onPageNotFound,
  onUnhandledRejection
} from '../../src/platform/api/app/index.web'
import install from '../../src/install'

jest.mock('../../src/platform', () => require('../../src/platform/api/app/index.web'))

describe('Web app events', () => {
  const eventApis = [
    ['show', onAppShow, offAppShow],
    ['hide', onAppHide, offAppHide],
    ['error', onError, offError],
    ['pageNotFound', onPageNotFound, offPageNotFound],
    ['rejection', onUnhandledRejection, offUnhandledRejection]
  ]

  afterEach(() => {
    // 每个用例后清空模块级回调，避免测试之间互相影响。
    eventApis.forEach(([, , offEvent]) => offEvent())
  })

  test.each(eventApis)('%s event should only remove the specified callback', (eventName, onEvent, offEvent) => {
    const firstCallback = jest.fn()
    const secondCallback = jest.fn()
    onEvent(firstCallback)
    onEvent(secondCallback)

    // 传入具体回调时，只注销目标回调，保留其他监听。
    offEvent(firstCallback)

    expect(global.__mpxAppCbs[eventName]).toEqual([secondCallback])
  })

  test.each(eventApis)('%s event should remove all callbacks without callback', (eventName, onEvent, offEvent) => {
    onEvent(jest.fn())
    onEvent(jest.fn())

    // 不传回调时，清空当前事件的全部监听。
    offEvent()

    expect(global.__mpxAppCbs[eventName]).toHaveLength(0)
  })

  test.each([false, true])('installs synchronous page-not-found APIs with usePromise=%s', (usePromise) => {
    const mpx = {}
    install(mpx, { usePromise })
    const listener = jest.fn()
    expect(mpx.onPageNotFound(listener)).toBeUndefined()
    expect(global.__mpxAppCbs.pageNotFound).toEqual([listener])
    expect(mpx.offPageNotFound(listener)).toBeUndefined()
    expect(global.__mpxAppCbs.pageNotFound).toEqual([])
  })
})
