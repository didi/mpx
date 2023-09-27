import { changeOpts, handleSuccess } from '../../../common/js'

function canvasToTempFilePath (options = {}) {
  handleSuccess(options, res => {
    return changeOpts(
      res,
      { errMsg: 'canvasToTempFilePath:ok' }
    )
  })

  my.canvasToTempFilePath(options)
}

export {
  canvasToTempFilePath
}
