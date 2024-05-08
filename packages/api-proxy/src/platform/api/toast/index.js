import { ENV_OBJ, envError } from '../../../common/js'

const showToast = ENV_OBJ.showToast || envError('showToast')

const hideToast = ENV_OBJ.hideToast || envError('hideToast')

const showLoading = ENV_OBJ.showLoading || envError('showLoading')

const hideLoading = ENV_OBJ.hideLoading || envError('hideLoading')

export {
  showToast,
  hideToast,
  showLoading,
  hideLoading
}
