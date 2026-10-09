import { isBrowser, throwSSRWarning, defineUnsupportedProps } from '../../../common/js'
export const createInnerAudioContext = () => {
  if (!isBrowser) {
    throwSSRWarning('createInnerAudioContext API is running in non browser environments')
    return
  }
  // eslint-disable-next-line no-undef
  const audio = new Audio()
  const __audio = {}

  __audio.play = () => !/mpxFalse/.test(audio.src) ? audio.play() : ''

  const pendingPauses = []
  const eventCallbacks = {}

  function pauseAudio (fromStop) {
    const wasPlaying = !audio.paused
    audio.pause()
    if (wasPlaying) pendingPauses.push(fromStop)
  }

  __audio.pause = () => pauseAudio(false)

  __audio.stop = () => {
    pauseAudio(true)
    audio.currentTime = 0
    setTimeout(() => {
      eventCallbacks.stop.slice().forEach(cb => cb())
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
        if (item === 'src') pendingPauses.length = 0
      }
    })
  })
  Object.defineProperty(__audio, 'startTime', {
    value: 0
  })
  Object.defineProperty(__audio, 'obeyMuteSwitch', {
    value: true
  })
  defineUnsupportedProps(__audio, ['playbackRate', 'referrerPolicy'])
  const eventNames = [
    'Canplay',
    'Ended',
    'Pause',
    'Play',
    'Seeked',
    'Seeking',
    'TimeUpdate',
    'Waiting',
    'Stop',
    'Error'
  ]

  eventNames.forEach(eventName => {
    const nativeName = eventName.toLowerCase()
    eventCallbacks[nativeName] = []

    // stop 由 stop() 模拟，其余事件在创建实例时统一监听。
    if (nativeName !== 'stop') {
      audio.addEventListener(nativeName, (event) => {
        // 即使没有业务监听，也要消费暂停来源，避免影响后续 pause 事件。
        if (nativeName === 'pause' && pendingPauses.shift() === true) return
        eventCallbacks[nativeName].slice().forEach(cb => cb(event))
      })
    }

    Object.defineProperty(__audio, `on${eventName}`, {
      get () {
        return (cb) => {
          if (eventCallbacks[nativeName].indexOf(cb) > -1) return
          eventCallbacks[nativeName].push(cb)
        }
      }
    })

    Object.defineProperty(__audio, `off${eventName}`, {
      get () {
        return (cb) => {
          if (cb == null) {
            eventCallbacks[nativeName] = []
          } else {
            const idx = eventCallbacks[nativeName].indexOf(cb)
            if (idx > -1) {
              eventCallbacks[nativeName].splice(idx, 1)
            }
          }
        }
      }
    })
  })

  return __audio
}
