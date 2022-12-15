import { createComponent } from '@mpxjs/core'

console.log(123131344445555)

createComponent({
  externalClasses: ['list-class'],
  data: {
    listData: ['手机', '电视', '电脑']
  },
  onShow () {
    console.log('list')
  }
})
