import { ENV_OBJ, changeOpts, handleSuccess } from '../../../common/js'

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
  if (ENV_OBJ.canIUse('request')) {
    return ENV_OBJ.request(opts)
  } else {
    return ENV_OBJ.httpRequest(opts)
  }
}

export {
  request
}
