import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const createIntersectionObserver = ENV_OBJ.createIntersectionObserver || envError('createIntersectionObserver')

export {
  createIntersectionObserver
}
