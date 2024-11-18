import { ENV_OBJ, envError } from '../../../common/js'

const downloadFile = ENV_OBJ.downloadFile || envError('downloadFile')

const uploadFile = ENV_OBJ.uploadFile || envError('uploadFile')

export {
  downloadFile,
  uploadFile
}
