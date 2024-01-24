import Modal from './Modal'
import { isBrowser, throwSSRWarning } from '../../../common/js'

let modal = null

function showModal (options = {}) {
  if (!isBrowser) {
    throwSSRWarning('showModal API is running in non browser environments')
    return
  }
  if (!modal) { modal = new Modal() }
  return modal.show(options)
}

export {
  showModal
}
