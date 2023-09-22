import { changeOpts, getEnvObj, handleSuccess } from '../../../common/js'

const ALI_OBJ = getEnvObj()

function login (options = {}) {
  const opts = changeOpts(options)

  handleSuccess(opts, res => {
    return changeOpts(res, { authCode: 'code' }, { errMsg: 'login:ok' })
  })

  ALI_OBJ.getAuthCode(opts)
}

export {
  login
}
