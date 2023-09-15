import { getEnvObj, handleSuccess } from '../../../common/js'

const ALI_OBJ = getEnvObj()

function setNavigationBarTitle (options = {}) {
  handleSuccess(opts, res => {
    return changeOpts(res, {}, { errMsg: 'setScreenBrightness:ok' })
  })
  if (ALI_OBJ.canIUse('setNavigationBarTitle')) {
    ALI_OBJ.setNavigationBarTitle(options)
    return
  }
  ALI_OBJ.setNavigationBar(options)
}

function setNavigationBarColor (options = {}) {
  if (ALI_OBJ.canIUse('setNavigationBarColor')) {
    ALI_OBJ.setNavigationBarColor(options)
    return
  }
  ALI_OBJ.setNavigationBar(options)
}

export {
  setNavigationBarTitle,
  setNavigationBarColor
}
