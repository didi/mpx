import {
  offWindowResize,
  onWindowResize
} from '../../src/platform/api/window/index.web'

describe('Web window resize', () => {
  afterEach(() => {
    offWindowResize()
  })

  test('should remove the specified callback', () => {
    const removedCallback = jest.fn()
    const retainedCallback = jest.fn()
    onWindowResize(removedCallback)
    onWindowResize(retainedCallback)

    // 传入具体回调时，只移除对应监听。
    offWindowResize(removedCallback)
    window.dispatchEvent(new Event('resize'))

    expect(removedCallback).not.toHaveBeenCalled()
    expect(retainedCallback).toHaveBeenCalledTimes(1)
  })

  test('should remove all callbacks without callback', () => {
    const firstCallback = jest.fn()
    const secondCallback = jest.fn()
    onWindowResize(firstCallback)
    onWindowResize(secondCallback)

    // 不传回调时，后续 resize 不应再通知任何已注册回调。
    offWindowResize()
    window.dispatchEvent(new Event('resize'))

    expect(firstCallback).not.toHaveBeenCalled()
    expect(secondCallback).not.toHaveBeenCalled()
  })
})
