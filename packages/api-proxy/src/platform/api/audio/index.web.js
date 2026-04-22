import { isBrowser, throwSSRWarning } from '../../../common/js'
export const createInnerAudioContext = () => {
  if (!isBrowser) {
    throwSSRWarning('createInnerAudioContext API is running in non browser environments')
    return
  }
  // eslint-disable-next-line no-undef
  const audio = new Audio()
  const __audio = {}

  __audio.play = () => !/mpxFalse/.test(audio.src) ? audio.play() : ''

  __audio.pause = () => audio.pause()

  const _stopCbs = []

  __audio.stop = () => {
    _stopping = true // 打开屏蔽开关，后续 pause 事件的 wrapper 会看到这个标志
    audio.pause()
    audio.currentTime = 0
    setTimeout(() => {
      _stopping = false // pause 事件已经派发完，关掉开关
      _stopCbs.forEach(cb => cb())
    }, 0)
  }

  __audio.seek = value => {
    audio.currentTime = value
  }

  __audio.destroy = () => {
    audio.src = 'mpxFalse'
  }

  const parameter = ['src', 'autoplay', 'loop', 'volume', 'duration', 'currentTime', 'buffered', 'paused']
  parameter.forEach(item => {
    Object.defineProperty(__audio, item, {
      get: () => audio[item],
      set (value) {
        audio[item] = value
      }
    })
  })
  Object.defineProperty(__audio, 'startTime', {
    value: 0
  })
  Object.defineProperty(__audio, 'obeyMuteSwitch', {
    value: true
  })
  const eventNames = [
    'Canplay',
    'Ended',
    'Pause',
    'Play',
    'Seeked',
    'Seeking',
    'TimeUpdate',
    'Waiting',
    'Error'
  ]

  let _stopping = false

  const eventCallbacks = {}
  eventNames.forEach(eventName => {
    const nativeName = eventName.toLowerCase()
    eventCallbacks[nativeName] = []

    Object.defineProperty(__audio, `on${eventName}`, {
      get () {
        return (cb) => {
          const wrapper = nativeName === 'pause'
            ? (e) => { if (!_stopping) cb(e) }
            : cb
          eventCallbacks[nativeName].push({ cb, wrapper })
          audio.addEventListener(nativeName, wrapper)
        }
      }
    })

    Object.defineProperty(__audio, `off${eventName}`, {
      get () {
        return (cb) => {
          if (cb == null) {
            eventCallbacks[nativeName].forEach(({ wrapper }) => audio.removeEventListener(nativeName, wrapper))
            eventCallbacks[nativeName] = []
          } else {
            const idx = eventCallbacks[nativeName].findIndex(item => item.cb === cb)
            if (idx > -1) {
              audio.removeEventListener(nativeName, eventCallbacks[nativeName][idx].wrapper)
              eventCallbacks[nativeName].splice(idx, 1)
            }
          }
        }
      }
    })
  })

  Object.defineProperty(__audio, 'onStop', {
    get () {
      return (cb) => { _stopCbs.push(cb) }
    }
  })
  Object.defineProperty(__audio, 'offStop', {
    get () {
      return (cb) => {
        if (cb == null) {
          _stopCbs.length = 0
        } else {
          const idx = _stopCbs.indexOf(cb)
          if (idx > -1) _stopCbs.splice(idx, 1)
        }
      }
    }
  })

  return __audio
}
