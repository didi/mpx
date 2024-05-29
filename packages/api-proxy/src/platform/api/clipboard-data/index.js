import { ENV_OBJ, envError } from '../../../common/js'

const setClipboardData = ENV_OBJ.setClipboardData || envError('setClipboardData')

const getClipboardData = ENV_OBJ.getClipboardData || envError('getClipboardData')

export {
  setClipboardData,
  getClipboardData
}
