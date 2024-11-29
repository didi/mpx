import { ENV_OBJ, envError } from '../../../common/js'

const showModal = ENV_OBJ.showModal || envError('showModal')

export {
  showModal
}
