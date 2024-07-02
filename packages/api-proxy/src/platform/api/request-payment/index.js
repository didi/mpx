import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const requestPayment = ENV_OBJ.requestPayment || envError('requestPayment')

export {
  requestPayment
}
