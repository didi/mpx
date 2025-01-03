import { ENV_OBJ, envError } from '../../../common/js'

const getSetting = ENV_OBJ.getSetting || envError('getSetting')

const openSetting = ENV_OBJ.openSetting || envError('openSetting')

const enableAlertBeforeUnload = ENV_OBJ.enableAlertBeforeUnload || envError('enableAlertBeforeUnload')

const disableAlertBeforeUnload = ENV_OBJ.disableAlertBeforeUnload || envError('disableAlertBeforeUnload')

const getMenuButtonBoundingClientRect = ENV_OBJ.getMenuButtonBoundingClientRect || envError('getMenuButtonBoundingClientRect')

export {
  getSetting,
  openSetting,
  enableAlertBeforeUnload,
  disableAlertBeforeUnload,
  getMenuButtonBoundingClientRect
}
