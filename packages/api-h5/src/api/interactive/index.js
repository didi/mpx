import Toast from './Toast'

let toast = null

function showToast (options = {}) {
  if (!toast) { toast = new Toast() }
  toast.show(options, 'toast')
}

function hideToast (options = {}) {
  if (!toast) { return }
  toast.hide(Object.assign({ duration: 0 }, options), 'toast')
}

function showLoading (options = {}) {
  if (!toast) { toast = new Toast() }
  toast.show(Object.assign({
    icon: 'loading',
    duration: -1
  }, options), 'loading')
}

function hideLoading (options = {}) {
  if (!toast) { return }
  toast.hide(Object.assign({
    icon: 'loading',
    duration: 0
  }, options), 'loading')
}

export {
  showToast,
  hideToast,
  showLoading,
  hideLoading
}
