import { ENV_OBJ, changeOpts, handleSuccess, envError } from '../../../common/js'

function setScreenBrightness (options = {}) {
  const opts = changeOpts(options, {
    value: 'brightness'
  })
  handleSuccess(opts, res => {
    return changeOpts(res, {}, { errMsg: 'setScreenBrightness:ok' })
  })
  return ENV_OBJ.setScreenBrightness(opts)
}

function getScreenBrightness (options = {}) {
  const opts = changeOpts(options)

  handleSuccess(opts, res => {
    return changeOpts(res, { brightness: 'value' }, { errMsg: 'getScreenBrightness:ok' })
  })

  return ENV_OBJ.getScreenBrightness(opts)
}

const setVisualEffectOnCapture = ENV_OBJ.setVisualEffectOnCapture || envError('setVisualEffectOnCapture')

const onUserCaptureScreen = ENV_OBJ.onUserCaptureScreen || envError('onUserCaptureScreen')

const offUserCaptureScreen = ENV_OBJ.offUserCaptureScreen || envError('offUserCaptureScreen')

export {
  setScreenBrightness,
  getScreenBrightness,
  setVisualEffectOnCapture,
  onUserCaptureScreen,
  offUserCaptureScreen
}
