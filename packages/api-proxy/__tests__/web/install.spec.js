import install from '../../src/index.web'
import * as allApi from '../../src/web/api/index'

const obj = Object.create(null)

describe('test index', () => {
  test('should obj has all api', () => {
    install(obj)
    const installed = Object.keys(allApi).every(api => typeof obj[api] === 'function')
    expect(installed).toBe(true)
  })
})
