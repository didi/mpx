import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const request = ENV_OBJ.request || envError('request')

export {
  request
}
