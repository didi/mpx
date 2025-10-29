import { noop } from '@mpxjs/utils'

export default class CreateCamera {
  constructor () {
    const navigation = Object.values(global.__mpxPagesMap || {})[0]?.[1]
    this.camera = navigation?.camera || {}
  }

  setZoom (options = {}) {
    const { zoom, success = noop, fail = noop, complete = noop } = options
    try {
      if (this.camera.setZoom) {
        const result = { errMsg: 'setZoom:ok' }
        success(result)
        complete(result)
        this.camera.setZoom(zoom)
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

  takePhoto (options) {
    this.camera?.takePhoto(options)
  }

  startRecord (options) {
    this.camera?.startRecord(options)
  }

  stopRecord (options) {
    this.camera?.stopRecord(options)
  }
}