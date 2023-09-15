import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

function createIntersectionObserver (component, options) {
  if (!ENV_OBJ.createIntersectionObserver) {
    return envError('createIntersectionObserver')()
  }
  return ENV_OBJ.createIntersectionObserver(component, options)
}

export {
  createIntersectionObserver
}
