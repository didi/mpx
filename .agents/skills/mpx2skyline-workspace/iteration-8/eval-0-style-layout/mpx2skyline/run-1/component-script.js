
import { createComponent } from '@mpxjs/core'

createComponent({
  properties: { title: { type: String, value: '本周精选商品' } },
  data: { isSmall: false },
  attached () {
    if (this.renderer === 'skyline') {
      this.isSmall = wx.getWindowInfo().windowWidth <= 320
      this.windowResizeHandler = ({ size }) => {
        this.isSmall = size.windowWidth <= 320
      }
      wx.onWindowResize(this.windowResizeHandler)
    }
  },
  detached () {
    if (this.renderer === 'skyline') {
      wx.offWindowResize(this.windowResizeHandler)
    }
  }
})
