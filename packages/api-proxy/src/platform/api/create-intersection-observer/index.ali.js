import { ENV_OBJ } from '../../../common/js'

function createIntersectionObserver (component, options = {}) {
  return ENV_OBJ.createIntersectionObserver(options)
}

export {
  createIntersectionObserver
}
