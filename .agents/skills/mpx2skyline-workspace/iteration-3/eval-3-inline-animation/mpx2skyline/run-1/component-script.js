
import { createComponent } from '@mpxjs/core'

createComponent({
  properties: {
    title: { type: String, value: '欢迎领取本周优惠' }
  },
  data: {
    isSkyline: false,
    pressed: false
  },
  attached () {
    this.isSkyline = this.renderer === 'skyline'
  },
  methods: {
    press () {
      this.pressed = true
    },
    release () {
      this.pressed = false
    }
  }
})
