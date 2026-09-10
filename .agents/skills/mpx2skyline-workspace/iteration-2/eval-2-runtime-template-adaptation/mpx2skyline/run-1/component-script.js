import { createComponent } from '@mpxjs/core'

createComponent({
  properties: {
    label: { type: String, value: '用户' },
    payload: { type: String, optionalTypes: [Object], value: '' }
  },
  data: {
    items: undefined,
    config: { default: 'keep' }
  },
  initData: {
    visibleItems: []
  },
  computed: {
    visibleItems () {
      return this.items ? this.items.filter(item => item.visible) : []
    }
  },
  methods: {
    setRows (res) {
      this.items = res.items
    },
    scrollTop () {
      this.createSelectorQuery().select('#users').node().exec(res => {
        res[0].node.scrollTo({ top: 0 })
      })
    }
  }
})
