import { ENV_OBJ, envError } from '../../../common/js'

const previewImage = ENV_OBJ.previewImage || envError('previewImage')

const compressImage = ENV_OBJ.compressImage || envError('compressImage')

const getImageInfo = ENV_OBJ.getImageInfo || envError('getImageInfo')

const chooseMedia = ENV_OBJ.chooseMedia || envError('chooseMedia')

export {
  previewImage,
  compressImage,
  getImageInfo,
  chooseMedia
}
