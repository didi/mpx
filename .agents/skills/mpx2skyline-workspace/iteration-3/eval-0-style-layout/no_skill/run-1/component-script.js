import { createComponent } from '@mpxjs/core'

createComponent({
  properties: { title: { type: String, value: '本周精选商品' } },
  data: { cardPadding: 24 },
  attached () {
    const { windowWidth } = wx.getWindowInfo()
    this.cardPadding = windowWidth <= 320 ? 12 : 24
  }
})
