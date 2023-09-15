import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

function createSelectorQuery (component, options) {
  if (!ENV_OBJ.createSelectorQuery) {
    return envError('createSelectorQuery')()
  }
  return ENV_OBJ.createSelectorQuery(component, options)
}

export {
  createSelectorQuery
}
