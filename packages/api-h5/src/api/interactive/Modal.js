import '../../common/stylus/Modal.styl'

const noop = () => {}

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
      success: noop,
      fail: noop,
      complete: noop
    }

    const modal = document.createElement('div')
    modal.setAttribute('class', '__mpx_modal__')

    const mask = document.createElement('div')
    mask.setAttribute('class', '__mpx_mask__')

    const box = document.createElement('div')
    box.setAttribute('class', '__mpx_modal_box__')

    const title = document.createElement('div')
    title.setAttribute('class', '__mpx_modal_title__')

    const content = document.createElement('div')
    content.setAttribute('class', '__mpx_modal_content__')

    const btns = document.createElement('div')
    btns.setAttribute('class', '__mpx_modal_btns__')

    const cancelBtn = document.createElement('div')
    cancelBtn.setAttribute('class', '__mpx_modal_cancel__')

    const confirmBtn = document.createElement('div')
    confirmBtn.setAttribute('class', '__mpx_modal_confirm__')

    btns.appendChild(cancelBtn)
    btns.appendChild(confirmBtn)
    box.appendChild(title)
    box.appendChild(content)
    box.appendChild(btns)
    modal.appendChild(mask)
    modal.appendChild(box)
    document.body.appendChild(modal)

    this.modal = modal
    this.mask = mask
    this.box = box
    this.title = title
    this.content = content
    this.btns = btns
    this.cancelBtn = cancelBtn
    this.confirmBtn = confirmBtn
  }
  show (options = {}) {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }

    const opts = Object.assign({}, this.defaultOpts, options)

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

    this.cancelBtn.addEventListener('click', () => {
      this.hide()
      const result = {
        errMsg: 'showModal:ok',
        cancel: true,
        confirm: false
      }
      opts.success(result)
      opts.complete(result)
    })
    this.confirmBtn.addEventListener('click', () => {
      this.hide()
      const result = {
        errMsg: 'showModal:ok',
        cancel: false,
        confirm: true
      }
      opts.success(result)
      opts.complete(result)
    })

    this.modal.classList.add('show')
  }
  hide () {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }

    this.hideTimer = setTimeout(() => {
      this.modal.classList.remove('show')
    }, 0)
  }
}
