import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const downloadFile = ENV_OBJ.downloadFile || envError('downloadFile')

const uploadFile = ENV_OBJ.uploadFile || envError('uploadFile')

export {
  downloadFile,
  uploadFile
}
