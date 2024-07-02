import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const previewImage = ENV_OBJ.previewImage || envError('previewImage')

const compressImage = ENV_OBJ.compressImage || envError('compressImage')

export {
  previewImage,
  compressImage
}
