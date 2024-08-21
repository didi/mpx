import { ENV_OBJ, envError } from '../../../common/js'

const pageScrollTo = ENV_OBJ.pageScrollTo || envError('pageScrollTo')

export {
  pageScrollTo
}
