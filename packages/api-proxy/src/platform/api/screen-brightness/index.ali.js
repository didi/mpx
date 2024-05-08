import { ENV_OBJ, changeOpts, handleSuccess } from '../../../common/js'

function setScreenBrightness (options = {}) {
  const opts = changeOpts(options, {
    value: 'brightness'
  })
  handleSuccess(opts, res => {
    return changeOpts(res, {}, { errMsg: 'setScreenBrightness:ok' })
  })
  return ENV_OBJ.setScreenBrightness(opts)
}

function getScreenBrightness (options = {}) {
  const opts = changeOpts(options)

  handleSuccess(opts, res => {
    return changeOpts(res, { brightness: 'value' }, { errMsg: 'getScreenBrightness:ok' })
  })

  return ENV_OBJ.getScreenBrightness(opts)
}

export {
  setScreenBrightness,
  getScreenBrightness
}
