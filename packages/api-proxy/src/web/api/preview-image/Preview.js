import { webHandleSuccess, webHandleFail, createDom, warn, getRootElement } from '../../../common/js'
import '../../../common/stylus/Preview.styl'
/**
 * Preview class for displaying images in a slideshow format.
 * todo: unit test
 */
export default class Preview {
  constructor () {
    this.currentIndex = 0
    this.maxIndex = 0
    this.minDistance = 30
    this.preview = createDom('div', { class: '__mpx_preview__' }, [
      this.textTip = createDom('div', { class: '__mpx_preview_tip__' })
    ])
    this.initEvent()
  }

  /**
   * Initializes the event listeners for the preview image feature.
   */
  initEvent () {
    // swipe to change image
    let startX = 0
    let startY = 0
    this.preview.addEventListener('touchstart', (e) => {
      startX = e.touches[0].pageX
      startY = e.touches[0].pageY
    })
    this.preview.addEventListener('touchend', (e) => {
      // click to close
      if (Math.abs(e.changedTouches[0].pageX - startX) < 10 && Math.abs(e.changedTouches[0].pageY - startY) < 10) {
        this.currentIndex = 0
        this.preview.style.display = 'none'
        this.preview.querySelector('.__mpx_preview_images__').remove()
        this.preview.remove()
      } else {
        const endX = e.changedTouches[0].pageX
        const distance = endX - startX
        if (Math.abs(distance) < this.minDistance) {
          return
        }
        if (distance > 0) {
          this.currentIndex = Math.max(0, this.currentIndex - 1)
        }
        if (distance < 0) {
          this.currentIndex = Math.min(this.maxIndex - 1, this.currentIndex + 1)
        }
        this.preview.querySelector('.__mpx_preview_images__').style.transform = `translateX(-${this.currentIndex * 100}%)`
        this.updateTextTip()
      }
    })
  }

  /**
   * 显示预览图片
   * @param {Object} options - 选项对象
   * @param {string[]} options.urls - 图片地址数组
   */
  show (options) {
    const supported = ['urls', 'success', 'fail', 'complete']
    Object.keys(options).forEach(key => !supported.includes(key) && warn(`previewImage: 暂不支持选项 ${key} ！`))
    const { urls, success, fail, complete } = options
    try {
      getRootElement().appendChild(this.preview)
      this.preview.style.display = 'block'
      // create images with urls
      // append to preview
      this.preview.appendChild(createDom('div', { class: '__mpx_preview_images__' }, urls.map(url => createDom('div', {
        style: `background-image: url(${url})`
      }))))
      this.maxIndex = urls.length
      this.updateTextTip()
      webHandleSuccess({ errMsg: 'previewImage:ok' }, success, complete)
    } catch (e) {
      webHandleFail({ errMsg: 'previewImage:fail', err: e }, fail, complete)
    }
  }

  /**
   * 更新文本提示
   */
  updateTextTip () {
    this.textTip.textContent = `${this.currentIndex + 1}/${this.maxIndex}`
  }
}
