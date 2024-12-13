import { ENV_OBJ, envError } from '../../../common/js'

const showActionSheet = ENV_OBJ.showActionSheet || envError('showActionSheet')

export {
  showActionSheet
}
