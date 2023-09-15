import { changeOpts, getEnvObj, noop } from '../../../common/js'
const ALI_OBJ = getEnvObj()

function createIntersectionObserver (component, options = {}) {
  return ALI_OBJ.createIntersectionObserver(options)
}

export {
  createIntersectionObserver
}
