import {
  offAppHide,
  offAppShow,
  offError,
  offUnhandledRejection,
  onAppHide,
  onAppShow,
  onError,
  onUnhandledRejection
} from '../../src/platform/api/app/index.web'

describe('Web app events', () => {
  const eventApis = [
    ['show', onAppShow, offAppShow],
    ['hide', onAppHide, offAppHide],
    ['error', onError, offError],
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
})
