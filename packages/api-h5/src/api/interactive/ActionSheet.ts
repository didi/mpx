import '../../common/stylus/ActionSheet.styl'

export default class ActionSheet {
  defaultOpts = {
    itemList: [],
    itemColor: '#000000',
    success: (...args) => {},
    fail: (...args) => {},
    complete: (...args) => {}
  }

  actionSheet: HTMLDivElement
  mask: HTMLDivElement
  box: HTMLDivElement
  list: HTMLDivElement
  cancelBtn: HTMLDivElement
  hideTimer: any

  constructor () {
    const actionSheet = document.createElement('div')
    actionSheet.setAttribute('class', '__mpx_actionsheet__')

    const mask = document.createElement('div')
    mask.setAttribute('class', '__mpx_mask__')

    const box = document.createElement('div')
    box.setAttribute('class', '__mpx_actionsheet_box__')

    const list = document.createElement('div')
    list.setAttribute('class', '__mpx_actionsheet_list__')

    const cancelBtn = document.createElement('div')
    cancelBtn.setAttribute('class', '__mpx_actionsheet_cancel__')
    cancelBtn.textContent = '取消'

    box.appendChild(list)
    box.appendChild(cancelBtn)
    actionSheet.appendChild(mask)
    actionSheet.appendChild(box)
    document.body.appendChild(actionSheet)

    this.actionSheet = actionSheet
    this.mask = mask
    this.box = box
    this.list = list
    this.cancelBtn = cancelBtn
  }

  show (options: WechatMiniprogram.ShowActionSheetOption) {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }

    const opts = Object.assign({}, this.defaultOpts, options)

    const list = document.createElement('div')
    list.setAttribute('class', '__mpx_actionsheet_list__')

    opts.itemList.forEach((item, index) => {
      const sheet = document.createElement('div')
      sheet.setAttribute('class', '__mpx_actionsheet_sheet__')
      sheet.textContent = item
      sheet.addEventListener('click', () => {
        this.hide()
        const res = {
          errMsg: 'showActionSheet:ok',
          tapIndex: index
        }
        opts.success(res)
        opts.complete(res)
      })
      list.appendChild(sheet)
    })

    this.box.replaceChild(list, this.list)
    this.list = list
    this.list.style.color = opts.itemColor

    this.cancelBtn.addEventListener('click', () => {
      this.hide()
      const err = { errMsg: 'showActionSheet:fail cancel' }
      opts.fail(err)
      opts.complete(err)
    })

    this.box.classList.add('show')
    this.actionSheet.classList.add('show')
  }

  hide () {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }

    this.hideTimer = setTimeout(() => {
      this.box.classList.remove('show')
      this.actionSheet.classList.remove('show')
    }, 0)
  }
}