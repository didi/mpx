import { ENV_OBJ, envError } from '../../../common/js'

const createAnimation = ENV_OBJ.createAnimation || envError('createAnimation')

export {
  createAnimation
}
