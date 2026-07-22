import { createInnerAudioContext } from '../../src/platform/api/audio/index.web'

describe('Web inner audio events', () => {
  let nativeAudio

  beforeEach(() => {
    global.Audio = jest.fn(function () {
      nativeAudio = this
      this.addEventListener = jest.fn()
      this.removeEventListener = jest.fn()
      this.pause = jest.fn()
    })
  })

  test('should remove the wrapper corresponding to the specified pause callback', () => {
    const audio = createInnerAudioContext()
    const callback = jest.fn()

    audio.onPause(callback)
    const wrapper = nativeAudio.addEventListener.mock.calls[0][1]
    audio.offPause(callback)

    // pause 使用包装函数屏蔽 stop 触发的事件，注销时必须移除包装函数而非原回调。
    expect(wrapper).not.toBe(callback)
    expect(nativeAudio.removeEventListener).toHaveBeenCalledWith('pause', wrapper)
  })

  test('should remove all callbacks for an event without callback', () => {
    const audio = createInnerAudioContext()
    const firstCallback = jest.fn()
    const secondCallback = jest.fn()
    audio.onPlay(firstCallback)
    audio.onPlay(secondCallback)

    // 不传回调时，应移除当前事件下注册的所有原生监听。
    audio.offPlay()

    expect(nativeAudio.removeEventListener).toHaveBeenCalledTimes(2)
    expect(nativeAudio.removeEventListener).toHaveBeenCalledWith('play', firstCallback)
    expect(nativeAudio.removeEventListener).toHaveBeenCalledWith('play', secondCallback)
  })

  test('should remove stop callbacks separately', () => {
    jest.useFakeTimers()
    const audio = createInnerAudioContext()
    const removedCallback = jest.fn()
    const retainedCallback = jest.fn()
    audio.onStop(removedCallback)
    audio.onStop(retainedCallback)

    // offStop 只管理模拟的 stop 回调，不应影响其他仍保留的 stop 监听。
    audio.offStop(removedCallback)
    audio.stop()
    jest.runAllTimers()

    expect(removedCallback).not.toHaveBeenCalled()
    expect(retainedCallback).toHaveBeenCalledTimes(1)
    jest.useRealTimers()
  })
})
