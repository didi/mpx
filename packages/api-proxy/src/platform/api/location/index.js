import { ENV_OBJ, envError } from '../../../common/js'

const getLocation = ENV_OBJ.getLocation || envError('getLocation')

const openLocation = ENV_OBJ.openLocation || envError('openLocation')

const chooseLocation = ENV_OBJ.chooseLocation || envError('chooseLocation')

export {
  getLocation,
  openLocation,
  chooseLocation
}
