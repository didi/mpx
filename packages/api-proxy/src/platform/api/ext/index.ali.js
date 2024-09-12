import { changeOpts, ENV_OBJ, envError } from '../../../common/js'

const getExtConfig = function (options = {}) {
  const cacheSuc = options.success
  options.success = function (res) {
    const sucRes = changeOpts(res, {
      data: 'extConfig'
    })
    cacheSuc.call(this, sucRes)
  }
  if (ENV_OBJ.getExtConfig) {
    ENV_OBJ.getExtConfig(options)
  } else {
    envError('getExtConfig')
  }
}

const getExtConfigSync = ENV_OBJ.getExtConfigSync || envError('getExtConfigSync')

export {
  getExtConfig,
  getExtConfigSync
}
