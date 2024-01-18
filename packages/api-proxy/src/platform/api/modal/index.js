import { getEnvObj, envError } from '../../../common/js'

const ENV_OBJ = getEnvObj()

const showModal = ENV_OBJ.showModal || envError('showModal')

export {
  showModal
}
