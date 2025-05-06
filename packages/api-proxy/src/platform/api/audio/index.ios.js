import { AudioContext } from 'react-native-audio-api'

// 默认全部缓冲完再播放,没法边缓冲边播放
// 需要视频加载完成后再设置 startTime 或 currentTime
class InnerAudioContext {
  constructor () {
    this.audioContext = new AudioContext()
    this.gainNode = this.audioContext.createGain()
    this.source = null
    this.buffer = null
    this.paused = false
    this.isPlaying = false
    this.gainNode.connect(this.audioContext.destination)

    this._src = ''
    this._startTime = 0
    this._autoplay = false
    this._loop = false
    this._volume = 1
    this._playbackRate = 1
    this._duration = 0
    this._currentTime = 0
    this._buffered = 0

    this._onCanplayListeners = []
    this._onPlayListeners = []
    this._onPauseListeners = []
    this._onStopListeners = []
    this._onEndedListeners = []
    this._onTimeUpdateListeners = []
    this._onErrorListeners = []
    this._onWaitingListeners = []
    this._onSeekingListeners = []
    this._onSeekedListeners = []
  }

  set volume (value) {
    if (value < 0 || value > 1) {
      throw new RangeError('Volume must be between 0 and 1')
    }
    this._volume = value
    this.gainNode.gain.value = value
  }

  set playbackRate (value) {
    if (value < 0.5 || value > 2.0) {
      throw new RangeError('Playback rate must be between 0.5 and 2.0')
    }
    this._playbackRate = value
    if (this.source) {
      this.source.playbackRate.value = value
    }
  }

  set autoPlay (status) {
    this._autoPlay = status
  }

  set src (url) {
    this._src = url
    this.loadAudio(url)
      .then(() => {
        this._triggerEvent('onCanplay')
        if (this._autoPlay) {
          this.play()
        }
      })
      .catch((error) => {
        this._triggerEvent('onError', { errMsg: error.message, errCode: -1 })
      })
  }

  set currentTime (value) {
    this.stop()
    this._currentTime = Math.max(0, Math.min(value, this._duration))
    this.play()
  }

  set startTime (time) {
    const newTime = Math.max(0, Math.min(time, this._duration))
    this._startTime = newTime
    this._currentTime = newTime
  }

  set loop (value) {
    this._loop = value
  }

  get loop () {
    return this._loop
  }

  get src () {
    return this._src // 返回音频时长
  }

  get volume () {
    return this._volume
  }

  get duration () {
    return this._duration // 返回音频时长
  }

  get currentTime () {
    return this._currentTime // 返回当前播放位置
  }

  get startTime () {
    return this._startTime // 返回当前播放位置
  }

  get buffered () {
    return this._buffered // 返回缓冲的时间点
  }

  get playbackRate () {
    return this._playbackRate // 返回播放速度
  }

  get autoPlay () {
    return this._autoPlay
  }

  async loadAudio (url) {
    this._triggerEvent('onWaiting')
    const response = await fetch(url)
    const audioData = await response.arrayBuffer()
    this.buffer = await this.audioContext.decodeAudioData(audioData)
    this._duration = this.buffer.duration
    this._buffered = this.buffer.duration
  }

  play () {
    if (this.buffer) {
      if (!this.source) {
        if (this.audioContext.context.state === 'suspended') {
          this.audioContext.resume()
        }
        this.source = this.audioContext.createBufferSource()
        this.source.buffer = this.buffer
        this.source.connect(this.gainNode)
        this.gainNode.connect(this.audioContext.destination)
        this.source.loop = this._loop
        this.source.playbackRate.value = this._playbackRate
        this.source.start(0, this._currentTime)
        this.isPlaying = true
        this.paused = false
        this.source.onended = () => {
          if (!this._loop && this.isPlaying) {
            this._triggerEvent('onEnded')
            this.stop()
          }
        }
        this._triggerEvent('onPlay')
      } else {
        this.audioContext.resume()
        this.isPlaying = true
        this.paused = false
        this._triggerEvent('onPlay')
      }
    }
  }

  pause () {
    this.audioContext.suspend()
    this.isPlaying = false
    this.paused = true
    this._triggerEvent('onPause')
  }

  seek (position) {
    if (position < 0 || position > this._duration) {
      throw new RangeError('Position must be between 0 and duration')
    }
    this._triggerEvent('onSeeking')
    this.stop() // 停止当前播放
    this._currentTime = Math.max(0, Math.min(position, this._duration))
    this.play() // 重新播放
    this._triggerEvent('onSeeked')
  }

  stop () {
    if (this.source) {
      this.source.stop()
      this.source = ''
      this.paused = true
      this.isPlaying = false
      this._currentTime = 0
      this._triggerEvent('onStop')
    }
  }

  destroy () {
    this.stop()
    this.audioContext.close()
    this._onCanplayListeners = []
    this._onPlayListeners = []
    this._onPauseListeners = []
    this._onStopListeners = []
    this._onEndedListeners = []
    this._onTimeUpdateListeners = []
    this._onErrorListeners = []
    this._onWaitingListeners = []
    this._onSeekingListeners = []
    this._onSeekedListeners = []
  }

  _triggerEvent (eventName, data) {
    let listeners = []
    switch (eventName) {
      case 'onCanplay':
        listeners = this._onCanplayListeners
        break
      case 'onPlay':
        listeners = this._onPlayListeners
        break
      case 'onPause':
        listeners = this._onPauseListeners
        break
      case 'onStop':
        listeners = this._onStopListeners
        break
      case 'onEnded':
        listeners = this._onEndedListeners
        break
      case 'onError':
        listeners = this._onErrorListeners
        break
      case 'onSeeking':
        listeners = this._onSeekingListeners
        break
      case 'onSeeked':
        listeners = this._onSeekedListeners
        break
      case 'onTimeUpdate':
        listeners = this._onTimeUpdateListeners
        break
      case 'onWaiting':
        listeners = this._onWaitingListeners
        break
    }
    listeners.forEach((listener) => listener(data))
  }

  onCanplay (listener) {
    if (typeof listener === 'function') {
      this._onCanplayListeners.push(listener)
    }
  }

  offCanplay (listener) {
    this._onCanplayListeners = listener
      ? this._onCanplayListeners.filter((item) => item !== listener)
      : []
  }

  onPlay (listener) {
    if (typeof listener === 'function') {
      this._onPlayListeners.push(listener)
    }
  }

  offPlay (listener) {
    this._onPlayListeners = listener
      ? this._onPlayListeners.filter((item) => item !== listener)
      : []
  }

  onPause (listener) {
    if (typeof listener === 'function') {
      this._onPauseListeners.push(listener)
    }
  }

  offPause (listener) {
    this._onPauseListeners = listener
      ? this._onPauseListeners.filter((item) => item !== listener)
      : []
  }

  onStop (listener) {
    if (typeof listener === 'function') {
      this._onStopListeners.push(listener)
    }
  }

  offStop (listener) {
    this._onStopListeners = listener
      ? this._onStopListeners.filter((item) => item !== listener)
      : []
  }

  onEnded (listener) {
    if (typeof listener === 'function') {
      this._onEndedListeners.push(listener)
    }
  }

  offEnded (listener) {
    this._onEndedListeners = listener
      ? this._onEndedListeners.filter((item) => item !== listener)
      : []
  }

  onTimeUpdate (listener) {
    if (typeof listener === 'function') {
      this._onTimeUpdateListeners.push(listener)
    }
  }

  offTimeUpdate (listener) {
    this._onTimeUpdateListeners = listener
      ? this._onTimeUpdateListeners.filter((item) => item !== listener)
      : []
  }

  onError (listener) {
    if (typeof listener === 'function') {
      this._onErrorListeners.push(listener)
    }
  }

  offError (listener) {
    this._onErrorListeners = listener
      ? this._onErrorListeners.filter((item) => item !== listener)
      : []
  }

  onWaiting (listener) {
    if (typeof listener === 'function') {
      this._onWaitingListeners.push(listener)
    }
  }

  offWaiting (listener) {
    this._onWaitingListeners = listener
      ? this._onWaitingListeners.filter((item) => item !== listener)
      : []
  }

  onSeeking (listener) {
    if (typeof listener === 'function') {
      this._onSeekingListeners.push(listener)
    }
  }

  offSeeking (listener) {
    this._onSeekingListeners = listener
      ? this._onSeekingListeners.filter((item) => item !== listener)
      : []
  }

  onSeeked (listener) {
    if (typeof listener === 'function') {
      this._onSeekedListeners.push(listener)
    }
  }

  offSeeked (listener) {
    this._onSeekedListeners = listener
      ? this._onSeekedListeners.filter((item) => item !== listener)
      : []
  }
}

const createInnerAudioContext = new InnerAudioContext()

export default createInnerAudioContext
