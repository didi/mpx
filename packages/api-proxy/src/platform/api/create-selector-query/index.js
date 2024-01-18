import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const createSelectorQuery = ENV_OBJ.createSelectorQuery || envError('createSelectorQuery')

export {
  createSelectorQuery
}
