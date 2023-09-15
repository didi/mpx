import { changeOpts, getEnvObj, handleSuccess } from '../../../common/js'

const ALI_OBJ = getEnvObj()

function setScreenBrightness (options = {}) {
  const opts = changeOpts(options, {
    value: 'brightness'
  })
  handleSuccess(opts, res => {
    return changeOpts(res, {}, { errMsg: 'setScreenBrightness:ok' })
  })
  ALI_OBJ.setScreenBrightness(opts)
}

function getScreenBrightness (options = {}) {
  const opts = changeOpts(options)

  handleSuccess(opts, res => {
    return changeOpts(res, { brightness: 'value' }, { errMsg: 'getScreenBrightness:ok' })
  })

  ALI_OBJ.getScreenBrightness(opts)
}

export {
  setScreenBrightness,
  getScreenBrightness
}
