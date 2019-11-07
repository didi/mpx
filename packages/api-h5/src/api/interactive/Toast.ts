import '../../common/stylus/Toast.styl'

type typeOpt = 'loading' | 'toast'
interface hideToastOptions extends WechatMiniprogram.HideToastOption {
  duration?: number
}

export default class Toast {
  defaultOpts = {
    title: '',
    icon: 'success',
    image: '',
    duration: 2000,
    mask: false,
    success: (...args) => {},
    fail: (...args) => {},
    complete: (...args) => {}
  }
  toast: HTMLDivElement
  mask: HTMLDivElement
  box: HTMLDivElement
  icon: HTMLDivElement
  title: HTMLDivElement
  hideTimer: any
  type: typeOpt

  constructor () {
    const toast = document.createElement('div')
    toast.setAttribute('class', '__mpx_toast__')

    const mask = document.createElement('div')
    mask.setAttribute('class', '__mpx_mask__')

    const box = document.createElement('div')
    box.setAttribute('class', '__mpx_toast_box__')

    const icon = document.createElement('div')
    icon.setAttribute('class', '__mpx_toast_icon__')

    const title = document.createElement('div')
    title.setAttribute('class', '__mpx_toast_title__')

    box.appendChild(icon)
    box.appendChild(title)
    toast.appendChild(mask)
    toast.appendChild(box)
    document.body.appendChild(toast)

    this.toast = toast
    this.mask = mask
    this.box = box
    this.icon = icon
    this.title = title
  }

  show (options: WechatMiniprogram.ShowToastOption, type: typeOpt) {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }

    const opts = Object.assign({}, this.defaultOpts, options)

    this.type = type

    if (opts.mask) {
      this.mask.classList.add('show')
    } else {
      this.mask.classList.remove('show')
    }

    if (opts.image) {
      this.icon.style.backgroundImage = `url(${opts.image})`
      this.icon.classList.remove('success', 'loading')
    } else if (opts.icon === 'loading') {
      this.icon.classList.add('loading')
      this.icon.classList.remove('success')
    } else if (opts.icon === 'none') {
      this.icon.classList.add('hide')
    } else {
      this.icon.classList.add('success')
      this.icon.classList.remove('loading')
    }

    this.title.textContent = opts.title || ''
    this.toast.classList.add('show')

    opts.duration >= 0 && this.hide({ duration: opts.duration }, type)

    const errMsg = type === 'loading' ? 'showLoading:ok' : 'showToast:ok'
    opts.success({ errMsg })
    opts.complete({ errMsg })
  }

  hide (options: hideToastOptions = {}, type) {
    if (this.type !== type) return

    const duration = options.duration || 0
    const errMsg = type === 'loading' ? 'hideLoading:ok' : 'hideToast:ok'
    options.success && options.success({ errMsg })
    options.complete && options.complete({ errMsg })

    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }

    this.hideTimer = setTimeout(() => { this.toast.classList.remove('show') }, duration)
  }
}
