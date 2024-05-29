import { ENV_OBJ, changeOpts, handleSuccess } from '../../../common/js'

function setNavigationBarTitle (options = {}) {
  handleSuccess(options, res => {
    return changeOpts(res, {}, { errMsg: 'setScreenBrightness:ok' })
  })
  if (ENV_OBJ.canIUse('setNavigationBarTitle')) {
    return ENV_OBJ.setNavigationBarTitle(options)
  }
  return ENV_OBJ.setNavigationBar(options)
}

function setNavigationBarColor (options = {}) {
  if (ENV_OBJ.canIUse('setNavigationBarColor')) {
    return ENV_OBJ.setNavigationBarColor(options)
  }
  return ENV_OBJ.setNavigationBar(options)
}

export {
  setNavigationBarTitle,
  setNavigationBarColor
}
