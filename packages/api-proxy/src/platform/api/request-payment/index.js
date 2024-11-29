import { ENV_OBJ, envError } from '../../../common/js'

const requestPayment = ENV_OBJ.requestPayment || envError('requestPayment')

export {
  requestPayment
}
