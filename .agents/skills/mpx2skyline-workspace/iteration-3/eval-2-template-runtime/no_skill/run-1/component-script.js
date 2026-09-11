
import { createComponent } from '@mpxjs/core'

createComponent({
  properties: {
    label: { type: String, value: '用户' },
    payload: { type: null, value: '' }
  },
  data: {
    items: [],
    config: { default: 'keep' }
  },
  computed: {
    visibleItems () {
      return this.items.filter(item => item.visible)
    }
  },
  methods: {
    setRows (res) {
      this.items = res.items || []
    },
    scrollTop () {
      wx.createSelectorQuery().in(this).select('#users').node().exec(res => {
        if (res[0] && res[0].node) {
          res[0].node.scrollTo({ top: 0 })
        }
      })
    },
    openDetail () {
      wx.navigateTo({ url: '/pages/detail' })
    }
  }
})
