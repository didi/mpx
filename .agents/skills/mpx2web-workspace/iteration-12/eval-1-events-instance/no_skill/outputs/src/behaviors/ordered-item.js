import { getMixin } from '@mpxjs/core'

export default getMixin({
  properties: { label: String },
  methods: {
    getLabel () {
      return this.label
    }
  }
})
