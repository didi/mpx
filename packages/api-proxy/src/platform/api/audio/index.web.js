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
    __audio.pause()
    __audio.seek(0)
    _stopCbs.forEach(cb => cb())
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

  const eventCallbacks = {}
  eventNames.forEach(eventName => {
    const nativeName = eventName.toLowerCase()
    eventCallbacks[nativeName] = []

    Object.defineProperty(__audio, `on${eventName}`, {
      get () {
        return (cb) => {
          eventCallbacks[nativeName].push(cb)
          audio.addEventListener(nativeName, cb)
        }
      }
    })

    Object.defineProperty(__audio, `off${eventName}`, {
      get () {
        return (cb) => {
          if (cb == null) {
            eventCallbacks[nativeName].forEach(fn => audio.removeEventListener(nativeName, fn))
            eventCallbacks[nativeName] = []
          } else {
            const idx = eventCallbacks[nativeName].indexOf(cb)
            if (idx > -1) {
              eventCallbacks[nativeName].splice(idx, 1)
              audio.removeEventListener(nativeName, cb)
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
