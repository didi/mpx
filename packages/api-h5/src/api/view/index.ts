import Toast from './Toast'
import Modal from './Modal'
import ActionSheet from './ActionSheet'

let toast: Toast
let modal: Modal
let actionSheet: ActionSheet

function showToast (options: WechatMiniprogram.ShowToastOption) {
  if (!toast) { toast = new Toast() }
  toast.show(options, 'toast')
}

function hideToast (options: WechatMiniprogram.HideToastOption = {}) {
  if (!toast) { return }
  toast.hide(Object.assign({ duration: 0 }, options), 'toast')
}

function showLoading (options: WechatMiniprogram.ShowLoadingOption) {
  if (!toast) { toast = new Toast() }
  toast.show(Object.assign({
    icon: 'loading',
    duration: -1
  }, options), 'loading')
}

function hideLoading (options: WechatMiniprogram.HideLoadingOption = {}) {
  if (!toast) { return }
  toast.hide(Object.assign({
    icon: 'loading',
    duration: 0
  }, options), 'loading')
}

function showModal (options: WechatMiniprogram.ShowModalOption = {}) {
  if (!modal) { modal = new Modal() }
  modal.show(options)
}

function showActionSheet (options: WechatMiniprogram.ShowActionSheetOption) {
  if (!actionSheet) { actionSheet = new ActionSheet() }
  actionSheet.show(options)
}

export {
  showToast,
  hideToast,
  showLoading,
  hideLoading,
  showModal,
  showActionSheet
}
