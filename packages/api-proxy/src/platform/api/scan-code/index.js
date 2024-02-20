import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const scanCode = ENV_OBJ.scanCode || envError('scanCode')

export {
  scanCode
}
