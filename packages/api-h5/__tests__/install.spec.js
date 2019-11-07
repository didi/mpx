import install from '../src/index'
import * as allApi from '../src/api/index'

const obj = Object.create(null)

describe('test index', () => {
  test('should obj has all api', () => {
    install(obj)
    const installed = Object.keys(allApi).every(api => typeof obj[api] === 'function')
    expect(installed).toBe(true)
  })
})
