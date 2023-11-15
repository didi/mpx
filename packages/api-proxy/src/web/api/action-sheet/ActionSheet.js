import { ToPromise, webHandleSuccess, webHandleFail, createDom } from '../../../common/js'
import '../../../common/stylus/ActionSheet.styl'

export default class ActionSheet extends ToPromise {
  constructor () {
    super()
    this.defaultOpts = {
      itemList: [],
      itemColor: '#000000',
      success: null,
      fail: null,
      complete: null
    }
    this.hideTimer = null

    this.actionSheet = createDom('div', { class: '__mpx_actionsheet__' }, [
      this.mask = createDom('div', { class: '__mpx_mask__' }),
      this.box = createDom('div', { class: '__mpx_actionsheet_box__' }, [
        this.list = createDom('div', { class: '__mpx_actionsheet_list__' }),
        this.cancelBtn = createDom('div', { class: '__mpx_actionsheet_cancel__' }, ['取消'])
      ])
    ])
    document.body.appendChild(this.actionSheet)
  }

  show (options) {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }

    const opts = Object.assign({}, this.defaultOpts, options)

    const list = createDom('div', { class: '__mpx_actionsheet_list__' })

    opts.itemList.forEach((item, index) => {
      const sheet = createDom('div', { class: '__mpx_actionsheet_sheet__' }, [item])
      sheet.onclick = () => {
        this.hide()
        const res = {
          errMsg: 'showActionSheet:ok',
          tapIndex: index
        }
        webHandleSuccess(res, opts.success, opts.complete)
        this.toPromiseResolve(res)
      }
      list.appendChild(sheet)
    })

    this.box.replaceChild(list, this.list)
    this.list = list
    this.list.style.color = opts.itemColor

    this.cancelBtn.onclick = () => {
      this.hide()
      const err = { errMsg: 'showActionSheet:fail cancel' }
      webHandleFail(err, opts.fail, opts.complete)
      !opts.fail && this.toPromiseReject(err)
    }

    // make transition next frame
    this.actionSheet.classList.add('show')
    // 如果使用 requestAnimationFrame，第一次展示不会有动画效果，原因待确认，这里先使用 setTimeout
    setTimeout(() => {
      this.box.classList.add('show')
    }, 17)

    return this.toPromiseInitPromise()
  }

  hide () {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }

    this.box.classList.remove('show')
    this.hideTimer = setTimeout(() => {
      this.actionSheet.classList.remove('show')
    }, 300) // animation duration is 300ms
  }
}
