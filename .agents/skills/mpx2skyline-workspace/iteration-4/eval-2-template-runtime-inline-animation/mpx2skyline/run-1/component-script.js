
import { createComponent } from '@mpxjs/core'

createComponent({
  properties: {
    label: { type: String, value: '用户' },
    payload: { type: String, optionalTypes: [Object], value: '' }
  },
  initData: { visibleItems: [] },
  data: { items: [], config: { default: 'keep' }, pressed: false, isSkyline: false },
  attached () {
    this.isSkyline = this.renderer === 'skyline'
  },
  computed: {
    visibleItems () { return this.items.filter(item => item.visible) }
  },
  methods: {
    setRows (res) { this.items = res.items || [] },
    scrollTop () {
      this.createSelectorQuery().select('#users').node().exec(res => {
        res[0].node.scrollTo({ top: 0 })
      })
    },
    press () { this.pressed = true },
    release () { this.pressed = false },
    openDetail () { wx.navigateTo({ url: '/pages/detail' }) }
  }
})
