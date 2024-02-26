import { changeOpts, handleSuccess } from '../../../common/js'

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
  if (my.canIUse('request')) {
    return my.request(opts)
  } else {
    return my.httpRequest(opts)
  }
}

export {
  request
}
