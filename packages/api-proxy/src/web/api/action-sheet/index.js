import ActionSheet from './ActionSheet'

let actionSheet = null

function showActionSheet (options = { itemList: [] }) {
  if (!actionSheet) { actionSheet = new ActionSheet() }
  return actionSheet.show(options)
}

export {
  showActionSheet
}
