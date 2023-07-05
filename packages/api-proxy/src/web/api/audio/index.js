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

  __audio.stop = () => {
    __audio.pause()
    __audio.seek(0)
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
    'Stop',
    'Error'
  ]
  const eventListeners = [
    ['on', audio.addEventListener],
    ['off', audio.removeEventListener]
  ]
  eventNames.forEach(eventName => {
    eventListeners.forEach(([eventNameItem, listenerFn]) => {
      Object.defineProperty(__audio, `${eventNameItem}${eventName}`, {
        get () {
          return (callback = audio.cb) => {
            if (eventNameItem !== 'off') {
              audio.cb = callback
            }
            // debugger
            return listenerFn.call(audio, eventName.toLowerCase(), audio.cb)
          }
        }
      })
    })
  })
  return __audio
}
