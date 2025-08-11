import { successHandle, failHandle, createDom, bindTap, getRootElement } from '../../../common/js'
import '../../../common/stylus/ActionSheet.styl'

export default class ActionSheet {
  constructor () {
    // super()
    this.defaultOpts = {
      itemList: [],
      itemColor: '#000000',
      success: null,
      fail: null,
      complete: null
    }
    this.hideTimer = null
    // 临时绑定事件的解绑方法数组，用于在 hide 时解绑
    this.tempListeners = []

    this.actionSheet = createDom('div', { class: '__mpx_actionsheet__' }, [
      this.mask = createDom('div', { class: '__mpx_mask__' }),
      this.box = createDom('div', { class: '__mpx_actionsheet_box__' }, [
        this.list = createDom('div', { class: '__mpx_actionsheet_list__' }),
        this.cancelBtn = createDom('div', { class: '__mpx_actionsheet_cancel__' }, ['取消'])
      ])
    ])
  }

  show (options) {
    getRootElement().appendChild(this.actionSheet) // show 则挂载
    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }

    const opts = Object.assign({}, this.defaultOpts, options)

    const list = createDom('div', { class: '__mpx_actionsheet_list__' })

    // todo 使用事件代理
    opts.itemList.forEach((item, index) => {
      const sheet = createDom('div', { class: '__mpx_actionsheet_sheet__' }, [item])
      this.tempListeners.push(bindTap(sheet, () => {
        this.hide()
        const res = {
          errMsg: 'showActionSheet:ok',
          tapIndex: index
        }
        successHandle(res, opts.success, opts.complete)
      }))
      list.appendChild(sheet)
    })

    this.box.replaceChild(list, this.list)
    this.list = list
    this.list.style.color = opts.itemColor

    this.tempListeners.push(bindTap(this.cancelBtn, () => {
      this.hide()
      const err = { errMsg: 'showActionSheet:fail cancel' }
      failHandle(err, opts.fail, opts.complete)
    }))
    // make transition next frame
    this.actionSheet.classList.add('show')
    // 如果使用 requestAnimationFrame，第一次展示不会有动画效果，原因待确认，这里先使用 setTimeout
    setTimeout(() => {
      this.box.classList.add('show')
    }, 17)
  }

  hide () {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }
    this.tempListeners.forEach(unbind => unbind())
    this.tempListeners = []
    this.box.classList.remove('show')
    this.hideTimer = setTimeout(() => {
      this.actionSheet.classList.remove('show')
      this.actionSheet.remove() // hide 则卸载
    }, 300) // animation duration is 300ms
  }
}
