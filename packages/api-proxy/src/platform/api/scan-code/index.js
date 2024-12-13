import { ENV_OBJ, envError } from '../../../common/js'

const scanCode = ENV_OBJ.scanCode || envError('scanCode')

export {
  scanCode
}
