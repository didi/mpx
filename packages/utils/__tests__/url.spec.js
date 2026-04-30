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

  test('parseQuery keeps comma as separator by default', () => {
    expect(parseQuery('?a=1,b=2&c=3')).toEqual({
      a: '1',
      b: '2',
      c: '3'
    })
  })
})
