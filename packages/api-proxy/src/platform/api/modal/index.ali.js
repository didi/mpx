import { changeOpts, handleSuccess } from '../../../common/js'

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

    my.confirm(opts)
  } else {
    opts = changeOpts(options, {
      confirmText: 'buttonText'
    })

    handleSuccess(opts, res => {
      return changeOpts(res, undefined, { cancel: false, confirm: true })
    })

    my.alert(opts)
  }
}

export {
  showModal
}
