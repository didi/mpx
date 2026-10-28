
import { createComponent } from '@mpxjs/core'

createComponent({
  properties: {
    ratingKey: { type: String, value: '' },
    value: { type: Number, value: 0 },
    max: { type: Number, value: 5 },
    readonly: { type: Boolean, value: false },
    label: { type: String, value: '请评分' }
  },
  initData: { stars: [] },
  data: { currentValue: 0, pressedScore: 0 },
  computed: {
    stars () {
      return Array.from({ length: this.max }, (_, index) => ({ score: index + 1 }))
    }
  },
  watch: {
    value: {
      immediate: true,
      handler (value) { this.currentValue = value }
    },
    readonly (value) { if (value) this.pressedScore = 0 }
  },
  methods: {
    onSelect (event) {
      if (this.readonly) return
      this.currentValue = Number(event.currentTarget.dataset.score)
      this.triggerEvent('change', { ratingKey: this.ratingKey, value: this.currentValue })
    },
    onPress (event) {
      if (this.readonly) return
      this.pressedScore = Number(event.currentTarget.dataset.score)
    },
    onRelease () { this.pressedScore = 0 }
  }
})
