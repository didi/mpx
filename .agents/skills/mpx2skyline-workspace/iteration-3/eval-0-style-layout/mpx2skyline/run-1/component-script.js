import { createComponent } from '@mpxjs/core'
createComponent({
  properties: { title: { type: String, value: '本周精选商品' } },
  data: { isSkyline: false, isSmall: false },
  attached () {
    this.isSkyline = this.renderer === 'skyline'
    if (this.isSkyline) this.isSmall = wx.getWindowInfo().screenWidth <= 320
  }
})
