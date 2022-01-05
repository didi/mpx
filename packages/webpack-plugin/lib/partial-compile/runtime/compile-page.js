import mpx from '@mpxjs/core'
import mpxFetch from '@mpxjs/fetch'
mpx.use(mpxFetch)

export const compilePage = (path, reason) => {
  mpx.xfetch.fetch({
    // eslint-disable-next-line no-undef
    url: COMPILE_PAGE_URI,
    data: {
      pagePath: path,
      reason
    }
  }).then(res => {
    if (res.data && res.data.ok) {
      mpx.showToast({
        title: '正在打包...',
        icon: 'loading'
      })
    }
  })
}
