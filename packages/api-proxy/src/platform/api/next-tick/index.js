import { ENV_OBJ, envError } from '../../../common/js'

const nextTick = ENV_OBJ.nextTick || envError('nextTick')

export {
  nextTick
}
