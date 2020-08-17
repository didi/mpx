/* eslint-disable no-undef */
/* eslint-disable new-parens */
const audio = new Audio

audio.stop = function () {
  this.currentTime = 0
  this.pause()
}

audio.seek = function (value) {
  this.currentTime = value
}

audio.destroy = function () {
  // audio = null //  Error in v-on handler: "Error: "audio" is read-only"
  this.src = ''
}

let onCanplay = true
audio.onCanplay = function (callback) {
  this.addEventListener('play', function (event) {
    if (event.type === 'play') {
      this.addEventListener('canplay', function (e) {
        if (onCanplay) {
          callback(e)
        }
      })
    }
  }, { once: true })
}

audio.offCanplay = function (callback) {
  onCanplay = false
  if (callback) {
    callback()
  }
}

audio.onPlay = function (callback) {
  this.addEventListener('play', function (e) {
    callback(e)
  })
}

let onPause = true
audio.onPause = function (callback) {
  this.addEventListener('pause', function (e) {
    if (onPause) {
      callback(e)
    }
  })
}

audio.offPause = function (callback) {
  onPause = false
  if (callback) {
    callback()
  }
}

let onStop = true
audio.onStop = function (callback) {
  this.addEventListener('pause', function (e) {
    if (audio.currentTime === 0 && e.type === 'pause' && onStop) {
      callback(e)
    }
  })
}

audio.offStop = function (callback) {
  onStop = false
  if (callback) {
    callback()
  }
}

let onEnded = true
audio.onEnded = function (callback) {
  this.addEventListener('timeupdate', function () {
    // 监听播放完成，ended 事件不准确
    if (audio.currentTime >= audio.duration) {
      if (onEnded) {
        callback()
      }
    }
  })
}

audio.offEnded = function (callback) {
  onEnded = false
  if (callback) {
    callback()
  }
}

let onTimeUpdate = true
audio.onTimeUpdate = function (callback) {
  audio.addEventListener('play', function (e) {
    if (e.type === 'play') {
      audio.addEventListener('timeupdate', () => {
        if (onTimeUpdate) {
          callback()
        }
      })
    }
  }, { once: true })
}

audio.offTimeUpdate = function (callback) {
  onTimeUpdate = false
  if (callback) {
    callback()
  }
}

let onError = true
audio.onError = function (callback) {
  this.addEventListener('error', function (e) {
    if (onError) {
      callback(e)
    }
  })
}

audio.offError = function (callback) {
  onError = false
  if (callback) {
    callback()
  }
}

let onWaiting = true
audio.onWaiting = function (callback) {
  this.addEventListener('waiting', function (e) {
    if (onWaiting) {
      callback(e)
    }
  })
}

audio.offWaiting = function (callback) {
  onWaiting = false
  if (callback) {
    callback()
  }
}

let onSeeking = true
audio.onSeeking = function (callback) {
  this.addEventListener('seeking', function (e) {
    if (onSeeking) {
      callback(e)
    }
  })
}

audio.offSeeking = function (callback) {
  onSeeking = false
  if (callback) {
    callback()
  }
}

let onSeeked = true
audio.onSeeked = function (callback) {
  this.addEventListener('seeked', function (e) {
    if (onSeeked) {
      callback(e)
    }
  })
}

audio.offSeeked = function (callback) {
  onSeeked = false
  if (callback) {
    callback()
  }
}

export function createInnerAudioContext () {
  return audio
}
