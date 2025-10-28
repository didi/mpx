import { noop } from '@mpxjs/utils'

const qualityValue = {
  high: 90,
  normal: 75,
  low: 50,
  original: 100
}
export default class CreateCamera {
  constructor () {
    const navigation = Object.values(global.__mpxPagesMap || {})[0]?.[1]
    this.camera = navigation?.camera || {}
  }

  setZoom (options = {}) {
    const { zoom } = options
    if (this.camera.setZoom) {
      this.camera.setZoom(zoom)
    }
  }

  takePhoto (options = {}) {
    const { success = noop, fail = noop, complete = noop } = options
    const takePhoto = this.camera.getTakePhoto?.()
    if (takePhoto) {
      takePhoto({
        quality: qualityValue[options.quality || 'normal']
      }).then((res) => {
        const result = {
          errMsg: 'takePhoto:ok',
          tempImagePath: res.path
        }
        success(result)
        complete(result)
      }).catch(() => {
        const result = {
          errMsg: 'takePhoto:fail'
        }
        fail(result)
        complete(result)
      })
    }
  }

  startRecord (options = {}) {
    let { timeout = 30, success = noop, fail = noop, complete = noop, timeoutCallback = noop } = options
    timeout = timeout > 300 ? 300 : timeout
    let recordTimer = null
    const isTimeout = false
    const startRecord = this.camera.getStartRecord?.()
    if (startRecord) {
      const result = {
        errMsg: 'startRecord:ok'
      }
      success(result)
      complete(result)
      startRecord({
        onRecordingError: (res) => {
          clearTimeout(recordTimer)
          timeoutCallback()
        },
        onRecordingFinished: (res) => {
          if (isTimeout) {
            console.log('record timeout, ignore', res)
          }
          clearTimeout(recordTimer)
          console.log('record finished', res)
        }
      })
      recordTimer = setTimeout(() => { // 超时自动停止
        if (this.camera.stopRecord) {
          this.camera.stopRecord().catch(() => {})
        }
      }, timeout * 1000)
    } else {
      const result = {
        errMsg: 'startRecord:fail to initialize the camera'
      }
      fail(result)
      complete(result)
    }
  }

  stopRecord (options = {}) {
    const { success = noop, fail = noop, complete = noop } = options
    const stopRecord = this.camera.getStopRecord?.()
    if (stopRecord) {
      stopRecord().then((res) => {
        console.log('stopRecord res', res)
        const result = {
          errMsg: 'stopRecord:ok',
          tempVideoPath: res.path,
          duration: res.duration * 1000, // 转成ms
          size: res.fileSize
        }
        success(result)
        complete(result)
      }).catch((e) => {
        console.log('stopRecord error', e)
        const result = {
          errMsg: 'stopRecord:fail'
        }
        fail(result)
        complete(result)
      })
    } else {
      const result = {
        errMsg: 'stopRecord:fail to initialize the camera'
      }
      fail(result)
      complete(result)
    }
  }
}
