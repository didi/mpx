import mpx, { createPage } from '@mpxjs/core'
import swiperPage from '../../packageA/pages/swiper.mpx?resolve'
// import img from '../../images/icon1.png'
createPage({
  data: {
    // img,
    a: 1,
    index: 0,
    array: ['美国', '中国', '巴西', '日本']
  },
  onLoad () {
    console.log('load index')
  },
  onShow () {
    console.log('show index123')
    console.log('test', swiperPage, mpx.i18n.locale)
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
