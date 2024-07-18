import { ENV_OBJ, envError } from '../../../common/js'

const createSelectorQuery = ENV_OBJ.createSelectorQuery || envError('createSelectorQuery')

export {
  createSelectorQuery
}
