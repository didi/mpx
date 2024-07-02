import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const createAnimation = ENV_OBJ.createAnimation || envError('createAnimation')

export {
  createAnimation
}
