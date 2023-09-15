import { changeOpts, handleSuccess, getEnvObj } from '../../../common/js'

const ALI_OBJ = getEnvObj()

function request (options = {}) {
  const opts = changeOpts(options, {
    header: 'headers'
  })

  handleSuccess(opts, res => {
    return changeOpts(res, {
      headers: 'header',
      status: 'statusCode'
    })
  })

  // request 在 1.11.0 以上版本才支持
  // httpRequest 即将被废弃，钉钉端仍需要使用
  if (ALI_OBJ.canIUse('request')) {
    return ALI_OBJ.request(opts)
  } else {
    return ALI_OBJ.httpRequest(opts)
  }
}

export {
  request
}
