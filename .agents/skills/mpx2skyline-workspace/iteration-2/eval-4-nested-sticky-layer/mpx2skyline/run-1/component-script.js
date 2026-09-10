import { createComponent } from '@mpxjs/core'

createComponent({
  properties: {
    sections: {
      type: Array,
      value: []
    }
  },
  data: {
    opened: false,
    isSkyline: false
  },
  attached() {
    this.isSkyline = this.renderer === 'skyline'
  },
  methods: {
    open() {
      this.opened = true
    },
    close() {
      this.opened = false
    }
  }
})
