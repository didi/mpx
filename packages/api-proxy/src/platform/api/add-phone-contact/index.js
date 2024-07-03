import { ENV_OBJ, envError } from '../../../common/js'

const addPhoneContact = ENV_OBJ.addPhoneContact || envError('addPhoneContact')

export {
  addPhoneContact
}
