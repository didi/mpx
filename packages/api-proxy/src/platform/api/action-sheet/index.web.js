import ActionSheet from './ActionSheet'
import { isBrowser, throwSSRWarning } from '../../../common/js'

let actionSheet = null

function showActionSheet (options = { itemList: [] }) {
  if (!isBrowser) {
    throwSSRWarning('showActionSheet API is running in non browser environments')
    return
  }
  if (!actionSheet) { actionSheet = new ActionSheet() }
  return actionSheet.show(options)
}

export {
  showActionSheet
}
