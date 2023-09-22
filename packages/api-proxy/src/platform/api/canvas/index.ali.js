import { changeOpts, getEnvObj, handleSuccess } from '../../../common/js'

const ALI_OBJ = getEnvObj()

function canvasToTempFilePath (options = {}) {
  handleSuccess(options, res => {
    return changeOpts(
      res,
      { errMsg: 'canvasToTempFilePath:ok' }
    )
  })

  ALI_OBJ.canvasToTempFilePath(options)
}

export {
  canvasToTempFilePath
}
