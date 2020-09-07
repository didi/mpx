export const createInnerAudioContext = () => {
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
  const simpleEvents = [
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
  const simpleListenerTuples = [
    ['on', audio.addEventListener],
    ['off', audio.removeEventListener]
  ]
  simpleEvents.forEach(eventName => {
    simpleListenerTuples.forEach(([eventNamePrefix, listenerFunc]) => {
      Object.defineProperty(__audio, `${eventNamePrefix}${eventName}`, {
        get () {
          return callback => listenerFunc.call(audio, eventName.toLowerCase(), callback)
        }
      })
    })
  })
  return __audio
}
