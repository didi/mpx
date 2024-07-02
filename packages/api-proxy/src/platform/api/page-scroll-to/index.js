import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const pageScrollTo = ENV_OBJ.pageScrollTo || envError('pageScrollTo')

export {
  pageScrollTo
}
