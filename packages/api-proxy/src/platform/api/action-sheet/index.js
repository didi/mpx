import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const showActionSheet = ENV_OBJ.showActionSheet || envError('showActionSheet')

export {
  showActionSheet
}
