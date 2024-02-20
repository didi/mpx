import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const setNavigationBarTitle = ENV_OBJ.setNavigationBarTitle || envError('setNavigationBarTitle')

const setNavigationBarColor = ENV_OBJ.setNavigationBarColor || envError('setNavigationBarColor')

export {
  setNavigationBarTitle,
  setNavigationBarColor
}
