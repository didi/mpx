import { ENV_OBJ } from '../../../common/js'

function createIntersectionObserver (component, options = {}) {
  if (options.observeAll) {
    options.selectAll = options.observeAll
  }
  return ENV_OBJ.createIntersectionObserver(options)
}

export {
  createIntersectionObserver
}
