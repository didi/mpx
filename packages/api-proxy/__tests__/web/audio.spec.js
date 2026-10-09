import { createInnerAudioContext } from '../../src/platform/api/audio/index.web'

describe('Web inner audio events', () => {
  const NativeAudio = global.Audio
  let nativeAudio
  let pauseEvents

  function flushPauseEvents () {
    pauseEvents.splice(0).forEach(event => nativeAudio.dispatchEvent(event))
  }

  beforeEach(() => {
    jest.useFakeTimers()
    pauseEvents = []
    global.Audio = jest.fn(function () {
      nativeAudio = this
      const target = document.createElement('audio')
      this.addEventListener = jest.fn(target.addEventListener.bind(target))
      this.removeEventListener = jest.fn(target.removeEventListener.bind(target))
      this.dispatchEvent = target.dispatchEvent.bind(target)
      this.paused = true
      this.play = jest.fn(() => { this.paused = false })
      this.pause = jest.fn(() => {
        if (!this.paused) {
          this.paused = true
          // 暂停状态同步更新，原生事件稍后按顺序派发。
          pauseEvents.push(new Event('pause'))
        }
      })
    })
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    global.Audio = NativeAudio
  })

  test('should only remove the specified pause callback', () => {
    const audio = createInnerAudioContext()
    const removedCallback = jest.fn()
    const retainedCallback = jest.fn()

    audio.onPause(removedCallback)
    audio.onPause(retainedCallback)
    audio.offPause(removedCallback)
    audio.play()
    audio.pause()
    flushPauseEvents()

    expect(removedCallback).not.toHaveBeenCalled()
    expect(retainedCallback).toHaveBeenCalledTimes(1)
  })

  test('should preserve a pause queued before stop for all callbacks', () => {
    const audio = createInnerAudioContext()
    const callbacks = [jest.fn(), jest.fn()]
    callbacks.forEach(cb => audio.onPause(cb))

    audio.play()
    audio.pause()
    audio.stop()
    flushPauseEvents()

    callbacks.forEach(cb => expect(cb).toHaveBeenCalledTimes(1))
  })

  test.each([true, false])('should suppress stop pause with timers flushed first: %s', (timersFirst) => {
    const audio = createInnerAudioContext()
    const callbacks = [jest.fn(), jest.fn()]
    const onStop = jest.fn()
    callbacks.forEach(cb => audio.onPause(cb))
    audio.onStop(onStop)

    audio.play()
    audio.stop()
    if (timersFirst) jest.runAllTimers()
    flushPauseEvents()
    if (!timersFirst) jest.runAllTimers()

    callbacks.forEach(cb => expect(cb).not.toHaveBeenCalled())
    expect(onStop).toHaveBeenCalledTimes(1)
  })

  test('should preserve a pause queued after stop and play', () => {
    const audio = createInnerAudioContext()
    const callbacks = [jest.fn(), jest.fn()]
    callbacks.forEach(cb => audio.onPause(cb))

    audio.play()
    audio.stop()
    audio.play()
    audio.pause()
    const pauseEvent = pauseEvents[1]
    flushPauseEvents()

    callbacks.forEach(cb => {
      expect(cb).toHaveBeenCalledTimes(1)
      expect(cb).toHaveBeenCalledWith(pauseEvent)
    })
  })

  test('should not suppress a later pause when stop is called while paused', () => {
    const audio = createInnerAudioContext()
    const callback = jest.fn()
    audio.onPause(callback)

    audio.stop()
    audio.play()
    audio.pause()
    flushPauseEvents()

    expect(callback).toHaveBeenCalledTimes(1)
  })

  test('should remove all pause callbacks and consume events without listeners', () => {
    const audio = createInnerAudioContext()
    const callbacks = [jest.fn(), jest.fn()]
    callbacks.forEach(cb => audio.onPause(cb))
    audio.offPause()

    audio.play()
    audio.pause()
    flushPauseEvents()
    callbacks.forEach(cb => expect(cb).not.toHaveBeenCalled())

    audio.play()
    audio.stop()
    flushPauseEvents()

    audio.onPause(callbacks[0])
    audio.play()
    audio.pause()
    flushPauseEvents()

    expect(callbacks[0]).toHaveBeenCalledTimes(1)
    expect(callbacks[1]).not.toHaveBeenCalled()
  })

  test.each([
    'Canplay', 'Ended', 'Play', 'Seeked', 'Seeking', 'TimeUpdate', 'Waiting', 'Error'
  ])('should dispatch %s through one pre-registered native listener', (eventName) => {
    const audio = createInnerAudioContext()
    const nativeName = eventName.toLowerCase()
    const event = new Event(nativeName)
    const firstCallback = jest.fn()
    const secondCallback = jest.fn()

    expect(nativeAudio.addEventListener.mock.calls.filter(([name]) => name === nativeName)).toHaveLength(1)
    nativeAudio.addEventListener.mockClear()

    audio[`on${eventName}`](firstCallback)
    audio[`on${eventName}`](firstCallback)
    audio[`on${eventName}`](secondCallback)
    nativeAudio.dispatchEvent(event)

    expect(firstCallback).toHaveBeenCalledTimes(1)
    expect(firstCallback).toHaveBeenCalledWith(event)
    expect(secondCallback).toHaveBeenCalledTimes(1)
    expect(secondCallback).toHaveBeenCalledWith(event)

    audio[`off${eventName}`](firstCallback)
    nativeAudio.dispatchEvent(event)
    expect(firstCallback).toHaveBeenCalledTimes(1)
    expect(secondCallback).toHaveBeenCalledTimes(2)

    audio[`off${eventName}`]()
    nativeAudio.dispatchEvent(event)
    expect(secondCallback).toHaveBeenCalledTimes(2)

    audio[`on${eventName}`](firstCallback)
    nativeAudio.dispatchEvent(event)
    expect(firstCallback).toHaveBeenCalledTimes(2)
    expect(secondCallback).toHaveBeenCalledTimes(2)
    expect(nativeAudio.addEventListener).not.toHaveBeenCalled()
    expect(nativeAudio.removeEventListener).not.toHaveBeenCalled()
  })

  test('should remove stop callbacks separately', () => {
    const audio = createInnerAudioContext()
    const removedCallback = jest.fn()
    const retainedCallback = jest.fn()
    audio.onStop(removedCallback)
    audio.onStop(removedCallback)
    audio.onStop(retainedCallback)

    // offStop 只管理模拟的 stop 回调，不应影响其他仍保留的 stop 监听。
    audio.offStop(removedCallback)
    audio.stop()
    jest.runAllTimers()

    expect(removedCallback).not.toHaveBeenCalled()
    expect(retainedCallback).toHaveBeenCalledTimes(1)
  })
})
