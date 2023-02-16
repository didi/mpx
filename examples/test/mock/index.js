import Mock from '@mpxjs/mock'
import center from './data/center.js'
import join from './data/join.js'
import notice from './data/notice.js'
import getList from './data/list'
import poster from './data/poster'
import communityQrCode from './data/community_qrcode'

const mockList = [
  {
    url: /festival\/center/,
    rule: center
  },
  {
    url: /festival\/toggle_init/,
    rule: join
  },
  {
    url: /toggle_manual_notice/,
    rule: notice
  },
  {
    url: /toggle_relation_get/,
    rule: getList
  },
  {
    url: /create_painter/,
    rule: poster
  },
  {
    url: /community_qrcode/,
    rule: communityQrCode
  }
]

;(function initMock () {
  if (__mpx_mode__ === 'web') {
    mockList.map(({ url, rule }) => {
      Mock.mock(url, rule)
    })
  } else {
    Mock(mockList)
  }
})()
