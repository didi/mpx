import { changeOpts, getEnvObj, handleSuccess } from '../../../common/js'

const ALI_OBJ = getEnvObj()

function setClipboardData (options = {}) {
  const opts = changeOpts(options, {
    data: 'text'
  })
  handleSuccess(opts, res => {
    return changeOpts(res, {
      success: ''
    }, {
      errMsg: 'setClipboardData:ok'
    })
  })
  ALI_OBJ.setClipboard(opts)
}

function getClipboardData (options = {}) {
  const opts = changeOpts(options)

  handleSuccess(opts, res => {
    return changeOpts(res, { text: 'data' })
  })

  ALI_OBJ.getClipboard(opts)
}

export {
  setClipboardData,
  getClipboardData
}
