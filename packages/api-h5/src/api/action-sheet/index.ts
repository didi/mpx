import ActionSheet from './ActionSheet'

let actionSheet: ActionSheet

function showActionSheet (options: WechatMiniprogram.ShowActionSheetOption) {
  if (!actionSheet) { actionSheet = new ActionSheet() }
  return actionSheet.show(options)
}

export {
  showActionSheet
}
