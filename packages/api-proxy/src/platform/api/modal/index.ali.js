import { changeOpts, getEnvObj, handleSuccess } from '../../../common/js'

const ALI_OBJ = getEnvObj()

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

    ALI_OBJ.confirm(opts)
  } else {
    opts = changeOpts(options, {
      confirmText: 'buttonText'
    })

    handleSuccess(opts, res => {
      return changeOpts(res, undefined, { cancel: false, confirm: true })
    })

    ALI_OBJ.alert(opts)
  }
}

export {
  showModal
}
