import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const makePhoneCall = ENV_OBJ.makePhoneCall || envError('makePhoneCall')

export {
  makePhoneCall
}
