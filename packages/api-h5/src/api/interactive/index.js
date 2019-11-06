import Toast from './Toast'

let toast = null

function showToast (options = {}) {
  if (!toast) { toast = new Toast() }

  toast.show(options, 'toast')
}

function hideToast (options = {}) {
  if (!toast) { return }
  toast.hide(options, 0, 'toast')
}

export {
  showToast,
  hideToast
}
