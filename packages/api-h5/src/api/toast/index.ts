import Toast from './Toast'

let toast: Toast


function showToast (options: WechatMiniprogram.ShowToastOption) {
  if (!toast) { toast = new Toast() }
  return toast.show(options, 'toast')
}

function hideToast (options: WechatMiniprogram.HideToastOption = {}) {
  if (!toast) { return }
  return toast.hide(Object.assign({ duration: 0 }, options), 'toast')
}

function showLoading (options: WechatMiniprogram.ShowLoadingOption) {
  if (!toast) { toast = new Toast() }
  return toast.show(Object.assign({
    icon: 'loading',
    duration: -1
  }, options), 'loading')
}

function hideLoading (options: WechatMiniprogram.HideLoadingOption = {}) {
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
