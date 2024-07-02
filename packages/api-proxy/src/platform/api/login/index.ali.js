import { changeOpts, handleSuccess } from '../../../common/js'

function login (options = {}) {
  const opts = changeOpts(options)

  handleSuccess(opts, res => {
    return changeOpts(res, { authCode: 'code' }, { errMsg: 'login:ok' })
  })

  my.getAuthCode(opts)
}

export {
  login
}
