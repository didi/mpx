import { ENV_OBJ, envError } from '../../../common/js'

const onError = ENV_OBJ.onError || envError('onError')

const offError = ENV_OBJ.offError || envError('offError')

const onPageNotFound = ENV_OBJ.onPageNotFound || envError('onPageNotFound')

const offPageNotFound = ENV_OBJ.offPageNotFound || envError('offPageNotFound')

const onAppShow = ENV_OBJ.onAppShow || envError('onAppShow')

const offAppShow = ENV_OBJ.offAppShow || envError('offAppShow')

const onAppHide = ENV_OBJ.onAppHide || envError('onAppHide')

const offAppHide = ENV_OBJ.offAppHide || envError('offAppHide')

export {
  onAppShow,
  onAppHide,
  offAppShow,
  offAppHide,
  onError,
  offError,
  onPageNotFound,
  offPageNotFound
}
