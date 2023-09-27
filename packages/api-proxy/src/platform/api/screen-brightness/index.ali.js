import { changeOpts, handleSuccess } from '../../../common/js'

function setScreenBrightness (options = {}) {
  const opts = changeOpts(options, {
    value: 'brightness'
  })
  handleSuccess(opts, res => {
    return changeOpts(res, {}, { errMsg: 'setScreenBrightness:ok' })
  })
  my.setScreenBrightness(opts)
}

function getScreenBrightness (options = {}) {
  const opts = changeOpts(options)

  handleSuccess(opts, res => {
    return changeOpts(res, { brightness: 'value' }, { errMsg: 'getScreenBrightness:ok' })
  })

  my.getScreenBrightness(opts)
}

export {
  setScreenBrightness,
  getScreenBrightness
}
