import { createDom, getRootElement, successHandle, failHandle } from '../../../common/js'
import '../../../common/stylus/Modal.styl'
// import { forEach } from '@didi/mpx-fetch/src/util'
// 汉字为两个字符，字母/数字为一个字符
const _getLength = (t) => {
  let len = 0
  for (let i = 0; i < t.length; i++) {
    if (t.charCodeAt(i) > 127 || t.charCodeAt(i) === 94) {
      len += 2
    } else {
      len++
    }
  }
  return len
}
export default class Modal {
  constructor () {
    this.defaultOpts = {
      title: '',
      content: '',
      showCancel: true,
      cancelText: '取消',
      cancelColor: '#000000',
      confirmText: '确定',
      confirmColor: '#576B95',
      success: (...args) => { },
      fail: (...args) => { },
      complete: (...args) => { }
    }

    this.hideTimer = null

    this.modal = createDom('div', { class: '__mpx_modal__' }, [
      this.mask = createDom('div', { class: '__mpx_mask__' }),
      this.box = createDom('div', { class: '__mpx_modal_box__' }, [
        this.title = createDom('div', { class: '__mpx_modal_title__' }),
        this.content = createDom('div', { class: '__mpx_modal_content__' }),
        this.btns = createDom('div', { class: '__mpx_modal_btns__' }, [
          this.cancelBtn = createDom('div', { class: '__mpx_modal_cancel__' }),
          this.confirmBtn = createDom('div', { class: '__mpx_modal_confirm__' })
        ])
      ])
    ])
  }

  show (options = {}) {
    const opts = Object.assign({}, this.defaultOpts, options)
    if (opts.confirmText && _getLength(opts.confirmText) > 8) {
      return failHandle({ errMsg: 'showModal:fail confirmText length should not larger than 4 Chinese characters' }, opts.fail, opts.complete)
    }
    if (opts.cancelText && _getLength(opts.cancelText) > 8) {
      return failHandle({ errMsg: 'showModal:fail cancelText length should not larger than 4 Chinese characters' }, opts.fail, opts.complete)
    }
    getRootElement().appendChild(this.modal)
    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }
    this.title.textContent = opts.title
    this.content.textContent = opts.content

    if (!opts.showCancel) {
      this.cancelBtn.classList.add('hide')
    } else {
      this.cancelBtn.classList.remove('hide')
    }
    this.cancelBtn.style.color = opts.cancelColor
    this.cancelBtn.textContent = opts.cancelText

    this.confirmBtn.style.color = opts.confirmColor
    this.confirmBtn.textContent = opts.confirmText

    this.cancelBtn.onclick = () => {
      this.hide()
      const result = {
        errMsg: 'showModal:ok',
        cancel: true,
        confirm: false
      }
      successHandle(result, opts.success, opts.complete)
    }
    this.confirmBtn.onclick = () => {
      this.hide()
      const result = {
        errMsg: 'showModal:ok',
        cancel: false,
        confirm: true
      }
      successHandle(result, opts.success, opts.complete)
    }

    this.modal.classList.add('show')
  }

  hide () {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }

    this.hideTimer = setTimeout(() => {
      this.modal.classList.remove('show')
      this.modal.remove()
    }, 0)
  }
}
