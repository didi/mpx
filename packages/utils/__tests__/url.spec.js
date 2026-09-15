import { parseQuery, parseUrlQuery } from '../src/url'

describe('url utils', () => {
  test('parseUrlQuery keeps raw json query value when noDecode is true', () => {
    const data = {
      a: 1,
      b: 2
    }
    const { path, queryObj } = parseUrlQuery('/pages/detail?data=' + JSON.stringify(data) + '&id=1', true)

    expect(path).toBe('/pages/detail')
    expect(queryObj.data).toBe(JSON.stringify(data))
    expect(queryObj.id).toBe('1')
  })

  test('parseQuery keeps comma in query value', () => {
    expect(parseQuery('?a=1,b=2&c=3')).toEqual({
      a: '1,b=2',
      c: '3'
    })
  })

  test('parseQuery keeps encoded child url query value', () => {
    expect(parseQuery('?redirectUrl=https%3A%2F%2Fdidi.com%3Fa%3D1%26b%3D2')).toEqual({
      redirectUrl: 'https://didi.com?a=1&b=2'
    })
  })
})
