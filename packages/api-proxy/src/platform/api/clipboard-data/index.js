import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const setClipboardData = ENV_OBJ.setClipboardData || envError('setClipboardData')

const getClipboardData = ENV_OBJ.getClipboardData || envError('getClipboardData')

export {
  setClipboardData,
  getClipboardData
}
