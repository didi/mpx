
import { createComponent } from '@mpxjs/core'

createComponent({
  properties: {
    label: { type: String, value: '用户' },
    payload: { type: String, optionalTypes: [Object], value: '' }
  },
  data: {
    items: [],
    config: { default: 'keep' },
    isSkyline: false,
    pulseOpacity: 0.3,
    pressed: false
  },
  computed: {
    visibleItems () {
      return this.items.filter(item => item.visible)
    }
  },
  attached () {
    this.isSkyline = this.renderer === 'skyline'
    this.startPulse()
  },
  detached () {
    this.stopPulse()
  },
  pageLifetimes: {
    show () { this.startPulse() },
    hide () {
      this.stopPulse()
      this.release()
    }
  },
  methods: {
    setRows (res) {
      this.items = Array.isArray(res.items) ? res.items : []
    },
    scrollTop () {
      wx.createSelectorQuery().in(this).select('#users').node().exec(res => {
        if (res[0] && res[0].node) res[0].node.scrollTo({ top: 0 })
      })
    },
    openDetail () {
      wx.navigateTo({ url: '/pages/detail' })
    },
    press () { this.pressed = true },
    release () { this.pressed = false },
    startPulse () {
      if (this._pulseTimer) return
      this._pulseStart = Date.now()
      this.pulseOpacity = 0.3
      this._pulseTimer = setInterval(() => {
        const progress = ((Date.now() - this._pulseStart) % 1000) / 1000
        this.pulseOpacity = 0.3 + 0.7 * progress
      }, 16)
    },
    stopPulse () {
      clearInterval(this._pulseTimer)
      this._pulseTimer = null
    }
  }
})
