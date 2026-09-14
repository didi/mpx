
import { createComponent } from '@mpxjs/core'

createComponent({
  properties: {
    title: { type: String, value: '欢迎领取本周优惠' }
  },
  data: {
    isSkyline: false,
    animationData: {}
  },
  attached () {
    this.isSkyline = this.renderer === 'skyline'
  },
  ready () {
    if (!this.isSkyline) return
    const { shared, timing, repeat, Easing } = wx.worklet
    const pulse = shared(0.3)
    const scale = shared(1)
    const opacity = shared(1)
    this._promoMotion = { pulse, scale, opacity }
    this.applyAnimatedStyle('.pulse-dot', () => {
      'worklet'
      return { opacity: pulse.value }
    })
    this.applyAnimatedStyle('.skyline-button', () => {
      'worklet'
      return { transform: `scale(${scale.value})`, opacity: opacity.value }
    })
    pulse.value = repeat(timing(1, { duration: 1000, easing: Easing.ease }), -1, false)
  },
  detached () {
    if (!this._promoMotion) return
    Object.keys(this._promoMotion).forEach((key) => {
      wx.worklet.cancelAnimation(this._promoMotion[key])
    })
    this._promoMotion = null
  },
  methods: {
    press () {
      this.setPressed(true)
    },
    release () {
      this.setPressed(false)
    },
    setPressed (pressed) {
      if (this.isSkyline) {
        if (!this._promoMotion) return
        const { timing, Easing } = wx.worklet
        this._promoMotion.scale.value = timing(pressed ? 0.96 : 1, { duration: 150, easing: Easing.linear })
        this._promoMotion.opacity.value = timing(pressed ? 0.7 : 1, { duration: 150, easing: Easing.linear })
        return
      }
      const animation = wx.createAnimation({ duration: 150 })
      animation.scale(pressed ? 0.96 : 1).opacity(pressed ? 0.7 : 1).step()
      this.animationData = animation.export()
    }
  }
})
