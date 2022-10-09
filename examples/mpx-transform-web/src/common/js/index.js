import mpx, { createPage } from '@mpxjs/core'
import swiperPage from '../../packageA/pages/swiper.mpx?resolve'
createPage({
  data: {
    a: 1,
    index: 0,
    array: ['美国', '中国', '巴西', '日本']
  },
  onLoad () {
    console.log('load index')
  },
  onShow () {
    console.log('show index')
    console.log('test', swiperPage)
  },
  methods: {
    reload () {
      window.location.reload()
    },
    jumpPage () {
      mpx.navigateTo({
        url: swiperPage
      })
    }
  }
})
