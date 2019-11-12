import ActionSheet from './ActionSheet'

let actionSheet: ActionSheet

function showActionSheet (options: WechatMiniprogram.ShowActionSheetOption) {
  if (!actionSheet) { actionSheet = new ActionSheet() }
  actionSheet.show(options)
}

export {
  showActionSheet
}
