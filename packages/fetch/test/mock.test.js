
import XFetch from '../src/xfetch'

describe('test mock method.', () => {
  const xfetch = new XFetch()
  it('custom function match test', () => {
    let options = [{
      mock: [{
        test: {
          custom (origin) {
            return ~origin.url.indexOf('/api/getlist')
          }
        },
        mock: () => {
          return {
            code: 200,
            msg: 'succes',
            data: [{
              id: '1',
              name: 'qy'
            }, {
              id: '2',
              name: 'wl'
            }]
          }
        }
      }]
    }]
    xfetch.setMock(options)
    expect(xfetch.getMock()).toBe(options)
    expect(xfetch.clearMock()).toBe(undefined)
  })
})

describe('response mock data proxy test.', () => {
  const xfetch = new XFetch({
    mock: [{
      test: {
        custom (origin) {
          return ~(origin.url || origin.path).indexOf('/api/getlist')
        }
      },
      mock: () => {
        return {
          code: 200,
          msg: 'succes',
          data: [{
            id: '1',
            name: 'qy'
          }, {
            id: '2',
            name: 'wl'
          }]
        }
      }
    }, {
      test: {
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
      mock: () => {
        return {
          code: 200,
          msg: 'succes',
          data: {
            name: 'qy'
          }
        }
      }
    }, {
      test: {
        protocol: 'http:',
        host: '10.11.11.123',
        port: '8000',
        path: '/api/getType',
        custom (origin) {
          return ~(origin.url || origin.path).indexOf('/api/getConfig')
        }
      },
      mock: () => {
        return {
          code: 200,
          msg: 'succes',
          data: {
            color: 'red',
            bg: 'white',
            fontSize: 12
          }
        }
      }
    }]
  })
  it('custom function match test', () => {
    // request url
    let options = { url: 'http://10.11.11.123:8000/api/getlist' }
    let result = {
      code: 200,
      msg: 'succes',
      data: [{
        id: '1',
        name: 'qy'
      }, {
        id: '2',
        name: 'wl'
      }]
    }

    xfetch.fetch(options).then((data) => {
      expect(JSON.stringify(data)).toBe(JSON.stringify(result))
    })
  })
  it('detailed url parameter matching test', () => {
    // request url
    const options = {
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      method: 'GET',
      params: {
        a: 1
      },
      url: 'http://10.11.11.123:8000/api/user'
    }
    let result = {
      code: 200,
      msg: 'succes',
      data: {
        name: 'qy'
      }
    }
    xfetch.fetch(options).then((data) => {
      expect(JSON.stringify(data)).toBe(JSON.stringify(result))
    })
  })

  it('custom priority test', () => {
    let result = {
      code: 200,
      msg: 'succes',
      data: {
        color: 'red',
        bg: 'white',
        fontSize: 12
      }
    }
    xfetch.fetch({ url: 'http://10.11.11.123:8000/api/getConfig' }).then((data) => {
      expect(JSON.stringify(data)).toBe(JSON.stringify(result))
    })
  })
})
