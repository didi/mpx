import XFetch from '../src/xfetch'

describe('test proxy method.', () => {
  let options = {
    proxy: [{
      test: { // 自定义匹配规则
        header: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        method: 'GET',
        params: {
          a: 1
        },
        protocol: 'http:',
        host: '10.11.11.123',
        port: '8000',
        path: '/api/user'
      },
      proxy: {
        header: {
          'content-type': 'text/html'
        },
        params: { a: 2 },
        data: { a: 2 },
        host: 'test.didi.com',
        port: 8001
      }
    }, {
      test: {
        custom (config) { // config 为原始的请求配置
          if (~config.url.indexOf('/api/group')) return true
          return false
        }
      },
      proxy: {
        host: 'test.didi.com',
        port: 8001,
        path: '/api/group/1'
      }
    }]
  }
  const xfetch = new XFetch(options)
  it('test proxy parameters method.', () => {
    xfetch.appendProxy({
      test: {},
      proxy: {},
      waterfall: true
    })
    xfetch.appendProxy({
      test: {},
      proxy: {},
      waterfall: true
    })
    expect(xfetch.getProxy()).toBe(options.proxy)
    xfetch.clearProxy()
    expect(xfetch.getProxy()).toBe(undefined)
  })
})

describe('request proxy test.', () => {
  const xfetch = new XFetch({
    proxy: [{
      test: { // 自定义匹配规则
        header: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        method: 'GET',
        params: {
          a: 1
        },
        protocol: 'http:',
        host: '10.11.11.123',
        port: '8000',
        path: '/api/user'
      },
      proxy: {
        header: {
          'content-type': 'text/html'
        },
        params: { a: 2 },
        data: { a: 2 },
        host: 'test.didi.com',
        port: 8001
      }
    }, {
      test: {
        custom (config) { // config 为原始的请求配置
          if (~config.url.indexOf('/api/group')) return true
          return false
        }
      },
      proxy: {
        host: 'test.didi.com',
        port: 8001,
        path: '/api/group/1'
      }
    }]
  })
  it('specified request parameters', () => {
    // request parameters
    const options = {
      url: 'http://10.11.11.123:8000/api/user',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      method: 'GET',
      params: {
        a: 1
      }
    }

    let result = {
      url: 'http://test.didi.com:8001/api/user',
      header: { 'content-type': 'text/html' },
      method: 'GET',
      params: { a: 2 },
      data: { a: 2 }
    }

    let config = xfetch.checkProxy(options)
    expect(JSON.stringify(config)).toBe(JSON.stringify(result))
  })
  it('custom method', () => {
    // request url
    const options = { url: 'http://10.11.11.123:8000/api/group' }
    let config = xfetch.checkProxy(options)
    expect(config.url).toBe('http://test.didi.com:8001/api/group/1')
  })
  it('not match parameters', () => {
    // request url
    const options = { url: 'http://10.11.11.123:8000/api/getlist' }
    let config = xfetch.checkProxy(options)
    expect(config.url).toBe('http://10.11.11.123:8000/api/getlist')
  })
})
