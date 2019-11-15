import Modal from './Modal'

let modal: Modal

function showModal (options: WechatMiniprogram.ShowModalOption = {}) {
  if (!modal) { modal = new Modal() }
  return modal.show(options)
}

export {
  showModal
}
