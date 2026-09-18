/* global wx */

import { createComponent } from '@mpxjs/core'

createComponent({
  properties: { title: { type: String, value: '本周精选商品' } },
  data: { compact: false },
  attached () {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    this.setData({ compact: info.screenWidth <= 320 })
  }
})
