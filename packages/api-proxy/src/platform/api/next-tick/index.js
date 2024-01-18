import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const nextTick = ENV_OBJ.nextTick || envError('nextTick')

export {
  nextTick
}
