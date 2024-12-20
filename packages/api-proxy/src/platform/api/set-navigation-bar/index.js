import { ENV_OBJ, envError } from '../../../common/js'

const setNavigationBarTitle = ENV_OBJ.setNavigationBarTitle || envError('setNavigationBarTitle')

const setNavigationBarColor = ENV_OBJ.setNavigationBarColor || envError('setNavigationBarColor')

const hideHomeButton = ENV_OBJ.hideHomeButton || envError('hideHomeButton')

export {
  setNavigationBarTitle,
  setNavigationBarColor,
  hideHomeButton
}
