import { ENV_OBJ, envError } from '../../../common/js'

const makePhoneCall = ENV_OBJ.makePhoneCall || envError('makePhoneCall')

export {
  makePhoneCall
}
