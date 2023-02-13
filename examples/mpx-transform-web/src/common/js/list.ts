import { createComponent } from '@mpxjs/core'

console.log(111132123)

createComponent({
  externalClasses: ['list-class'],
  data: {
    listData: ['手机', '电视', '电脑21221212']
  },
  onShow () {
    console.log('list')
  }
})
