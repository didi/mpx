import { createComponent } from '@mpxjs/core'

createComponent({
  externalClasses: ['list-class'],
  data: {
    listData: ['手机', '电视']
  },
  onShow () {
    console.log('list')
  }
})
