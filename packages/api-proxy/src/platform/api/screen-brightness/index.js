import { ENV_OBJ, envError } from '../../../common/js'

const setScreenBrightness = ENV_OBJ.setScreenBrightness || envError('setScreenBrightness')

const getScreenBrightness = ENV_OBJ.getScreenBrightness || envError('getScreenBrightness')

export {
  setScreenBrightness,
  getScreenBrightness
}
