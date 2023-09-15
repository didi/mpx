import Modal from './Modal'

let modal = null

function showModal (options = {}) {
  if (!modal) { modal = new Modal() }
  return modal.show(options)
}

export {
  showModal
}
