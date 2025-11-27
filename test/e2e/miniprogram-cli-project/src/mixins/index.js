// mixin.js
export default {
  data: {
    list1: {
      'phone': '手机',
      'tv': '电视',
      'computer': '电脑'
    }
  },
  ready () {
    console.log('mixins ready:', this.list.phone)
  }
}
