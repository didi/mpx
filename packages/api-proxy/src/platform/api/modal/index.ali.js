import { ENV_OBJ, changeOpts, handleSuccess } from '../../../common/js'

function showModal (options = {}) {
  let opts

  if (options.showCancel === undefined || options.showCancel) {
    opts = changeOpts(options, {
      confirmText: 'confirmButtonText',
      cancelText: 'cancelButtonText'
    })

    handleSuccess(opts, res => {
      return changeOpts(res, undefined, { cancel: !res.confirm })
    })

    return ENV_OBJ.confirm(opts)
  } else {
    opts = changeOpts(options, {
      confirmText: 'buttonText'
    })

    handleSuccess(opts, res => {
      return changeOpts(res, undefined, { cancel: false, confirm: true })
    })

    return ENV_OBJ.alert(opts)
  }
}

export {
  showModal
}
