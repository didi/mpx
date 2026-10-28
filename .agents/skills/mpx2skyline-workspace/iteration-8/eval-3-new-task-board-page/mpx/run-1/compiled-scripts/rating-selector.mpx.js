
















import { createComponent } from '@mpxjs/core'

createComponent({
  initData: { stars: [] },
  properties: {
    ratingKey: { type: String, value: '' },
    value: { type: Number, value: 0 },
    max: { type: Number, value: 5 },
    readonly: { type: Boolean, value: false },
    label: { type: String, value: '请评分' }
  },
  data: {
    currentValue: 0,
    pressedStar: 0
  },
  computed: {
    stars () {
      return Array.from({ length: this.max }, (_, index) => index + 1)
    }
  },
  watch: {
    value: {
      immediate: true,
      handler (value) {
        this.currentValue = value
      }
    },
    readonly () {
      this.pressedStar = 0
    }
  },
  methods: {
    selectStar (value) {
      if (this.readonly) return
      this.currentValue = value
      this.triggerEvent('change', { ratingKey: this.ratingKey, value })
    },
    pressStar (value) {
      if (this.readonly) return
      this.pressedStar = value
    },
    releaseStar () {
      this.pressedStar = 0
    }
  }
})
