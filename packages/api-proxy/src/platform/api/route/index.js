import { ENV_OBJ, envError } from '../../../common/js'

const redirectTo = ENV_OBJ.redirectTo || envError('redirectTo')

const navigateTo = ENV_OBJ.navigateTo || envError('navigateTo')

const navigateBack = ENV_OBJ.navigateBack || envError('navigateBack')

const reLaunch = ENV_OBJ.reLaunch || envError('reLaunch')

const switchTab = ENV_OBJ.switchTab || envError('switchTab')

const reset = envError('reset')

export {
  redirectTo,
  navigateTo,
  navigateBack,
  reLaunch,
  switchTab,
  reset
}
