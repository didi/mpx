import Toast from './Toast'
import { isBrowser, throwSSRWarning } from '../../../common/js'

let toast = null

function showToast (options = { title: '' }) {
  if (!isBrowser) {
    throwSSRWarning('showToast API is running in non browser environments')
    return
  }
  if (!toast) { toast = new Toast() }
  return toast.show(options, 'toast')
}

function hideToast (options = {}) {
  if (!toast) { return }
  return toast.hide(Object.assign({ duration: 0 }, options), 'toast')
}

function showLoading (options = { title: '' }) {
  if (!isBrowser) {
    throwSSRWarning('showLoading API is running in non browser environments')
    return
  }
  if (!toast) { toast = new Toast() }
  return toast.show(Object.assign({
    icon: 'loading',
    duration: -1
  }, options), 'loading')
}

function hideLoading (options = {}) {
  if (!toast) { return }
  return toast.hide(Object.assign({
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
