import { noop, getFocusedNavigation } from '@mpxjs/utils'
import { failHandle } from '../../../common/js'

export default class CameraContext {
  constructor () {
    const navigation = getFocusedNavigation() || {}
    this.camera = navigation.camera || {}
  }

  setZoom (options = {}) {
    const { zoom, success = noop, fail = noop, complete = noop } = options
    try {
      if (this.camera.setZoom) {
        this.camera.setZoom(zoom)
        const result = { errMsg: 'setZoom:ok' }
        success(result)
        complete(result)
      } else {
        const result = {
          errMsg: 'setZoom:fail camera instance not found'
        }
        fail(result)
        complete(result)
      }
    } catch (error) {
      const result = {
        errMsg: 'setZoom:fail ' + (error?.message || '')
      }
      fail(result)
      complete(result)
    }
  }

  takePhoto (options = {}) {
    if (this.camera.takePhoto) {
      this.camera.takePhoto(options)
    } else {
      failHandle({ errMsg: 'takePhoto:fail camera instance not found' }, options.fail, options.complete)
    }
  }

  startRecord (options = {}) {
    if (this.camera.startRecord) {
      this.camera.startRecord(options)
    } else {
      failHandle({ errMsg: 'startRecord:fail camera instance not found' }, options.fail, options.complete)
    }
  }

  stopRecord (options = {}) {
    if (this.camera.stopRecord) {
      this.camera.stopRecord(options)
    } else {
      failHandle({ errMsg: 'stopRecord:fail camera instance not found' }, options.fail, options.complete)
    }
  }
}
