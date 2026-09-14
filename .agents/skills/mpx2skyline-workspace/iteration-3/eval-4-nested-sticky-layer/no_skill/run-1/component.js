
import { createComponent } from '@mpxjs/core'

createComponent({
  properties: {
    sections: { type: Array, value: [] }
  },
  data: {
    isSkyline: false,
    opened: false
  },
  attached () {
    this.isSkyline = this.renderer === 'skyline'
  },
  methods: {
    open () {
      this.opened = true
    },
    close () {
      this.opened = false
    },
    preventMove () {}
  }
})
