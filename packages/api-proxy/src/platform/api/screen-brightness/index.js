import { ENV_OBJ, envError } from '../../../common/js'

const setScreenBrightness = ENV_OBJ.setScreenBrightness || envError('setScreenBrightness')

const getScreenBrightness = ENV_OBJ.getScreenBrightness || envError('getScreenBrightness')

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
