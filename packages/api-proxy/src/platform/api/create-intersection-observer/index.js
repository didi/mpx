import { ENV_OBJ, envError } from '../../../common/js'

const createIntersectionObserver = ENV_OBJ.createIntersectionObserver || envError('createIntersectionObserver')

export {
  createIntersectionObserver
}
