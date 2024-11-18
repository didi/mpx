import { ENV_OBJ, envError } from '../../../common/js'

const request = ENV_OBJ.request || envError('request')

export {
  request
}
