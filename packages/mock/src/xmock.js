import mock from 'mockjs'
export default class XMock {
  constructor (options) {
    this.options = options
  }
  mock (xfetch, mockRequstList) {
    if (!mockRequstList || !mockRequstList.length) {
      console.error('please provide a mock mockRequstList')
      return
    }
    if (!xfetch) {
      console.error('please provide a xfetch')
      return
    }
    const rawXfetch = xfetch
    const fetch = xfetch.fetch
    xfetch.fetch = (config) => {
      let isMock = false
      let mockItem = null
      mockRequstList.forEach(item => {
        if (!item.url) {
          console.error('please provide a mock url')
          return
        }
        if (this.match(config.url, item.url)) {
          isMock = true
          mockItem = item
        }
      })
      if (isMock) {
        if (!mockItem.rule) {
          console.error('please provide a mock rule')
          return
        }
        return new Promise((resolve, reject) => {
          xfetch.queue.adapter(config).then(res => {
            res.data = mock.mock(mockItem.rule)
            resolve(res)
          }).catch(e => {
            e.data = mock.mock(mockItem.rule)
            resolve(e)
          })
        })
      } else {
        rawXfetch.fetch = fetch
      }
    }
  }
  match (expected, actual) {
    if (this.type(expected) === 'string') {
      return expected === actual
    }
    if (this.type(expected) === 'regexp') {
      return expected.test(actual)
    }
  }
  type (obj) {
    return (obj === null || obj === undefined) ? String(obj) : Object.prototype.toString.call(obj).match(/\[object (\w+)\]/)[1].toLowerCase()
  }
}
