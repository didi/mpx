import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const addPhoneContact = ENV_OBJ.addPhoneContact || envError('addPhoneContact')

export {
  addPhoneContact
}
