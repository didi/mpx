import { ENV_OBJ, changeOpts, handleSuccess } from '../../../common/js'

function login (options = {}) {
  const opts = changeOpts(options)

  handleSuccess(opts, res => {
    return changeOpts(res, { authCode: 'code' }, { errMsg: 'login:ok' })
  })

  return ENV_OBJ.getAuthCode(opts)
}

export {
  login
}
