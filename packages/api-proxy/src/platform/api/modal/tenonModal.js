import { ToPromise, successHandle } from '../../../common/js'
import '../../../common/stylus/Modal.styl'
import { getClassStyle } from '@hummer/tenon-vue'

// 汉字为两个字符，字母/数字为一个字符
const _getLength = t => {
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
function createDom (Element, attrs = {}, children = []) {
  const dom = new Element()
  Object.keys(attrs).forEach(k => Reflect.set(dom, k, attrs[k]))
  children.length && children.forEach(child => dom.appendChild(child))
  return dom
}
export default class Modal extends ToPromise {
  constructor () {
    super()
    this.defaultOpts = {
      title: '',
      content: '',
      showCancel: true,
      cancelText: '取消',
      cancelColor: '#000000',
      confirmText: '确定',
      confirmColor: '#576B95',
      success: (...args) => {},
      fail: (...args) => {},
      complete: (...args) => {}
    }
    this.hideTimer = null
  }

  show (options = {}) {
    if (options.confirmText && _getLength(options.confirmText) > 8) {
      // eslint-disable-next-line
      return Promise.reject({
        errMsg:
          'showModal:fail confirmText length should not larger than 4 Chinese characters'
      })
    }
    if (options.cancelText && _getLength(options.cancelText) > 8) {
      // eslint-disable-next-line
      return Promise.reject({
        errMsg:
          'showModal:fail cancelText length should not larger than 4 Chinese characters'
      })
    }
    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }

    this.box = createDom(
      View,
      { style: getClassStyle(null, '__mpx_modal_box__') },
      [
        createDom(
          View,
          { style: getClassStyle(null, '__mpx_modal_title_view__') },
          [
            (this.title = createDom(Text, {
              style: getClassStyle(null, '__mpx_modal_title__')
            }))
          ]
        ),
        createDom(
          View,
          { style: getClassStyle(null, '__mpx_modal_content_view__') },
          [
            (this.content = createDom(Text, {
              style: getClassStyle(null, '__mpx_modal_content__')
            }))
          ]
        ),
        (this.btns = createDom(
          View,
          { style: getClassStyle(null, '__mpx_modal_btns__') },
          [
            (this.cancelBtn = createDom(Text, {
              style: getClassStyle(null, '__mpx_modal_cancel__')
            })),
            (this.confirmBtn = createDom(Text, {
              style: getClassStyle(null, '__mpx_modal_confirm__')
            }))
          ]
        ))
      ]
    )

    const opts = Object.assign({}, this.defaultOpts, options)
    this.title.text = opts.title
    this.content.text = opts.content
    this.dialog = new Dialog()
    this.dialog.cancelable = false
    this.cancelBtn.text = opts.cancelText
    this.confirmBtn.text = opts.confirmText
    this.confirmBtn.style = Object.assign(this.confirmBtn.style, { color: opts.confirmColor })
    if (opts.showCancel !== true) {
      this.cancelBtn.style = Object.assign(
        this.cancelBtn.style,
        getClassStyle(null, '__mpx_modal_hide__')
      )
    } else {
      this.cancelBtn.style = Object.assign(
        this.cancelBtn.style,
        { color: opts.cancelColor }
      )
    }

    this.cancelBtn.addEventListener('tap', event => {
      this.hide()
      const result = {
        errMsg: 'showModal:ok',
        cancel: true,
        confirm: false
      }
      successHandle(result, opts.success, opts.complete)
      this.toPromiseResolve(result)
    })

    this.confirmBtn.addEventListener('tap', event => {
      this.hide()
      const result = {
        errMsg: 'showModal:ok',
        cancel: false,
        confirm: true
      }
      successHandle(result, opts.success, opts.complete)
      this.toPromiseResolve(result)
    })

    this.dialog.custom(this.box)
    return this.toPromiseInitPromise()
  }

  hide () {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }

    this.hideTimer = setTimeout(() => {
      this.dialog.dismiss()
    }, 0)
  }
}
