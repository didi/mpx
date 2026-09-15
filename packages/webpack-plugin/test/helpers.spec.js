const loaderUtils = require('loader-utils')
const createHelpers = require('../lib/helpers')

describe('helpers block mode', () => {
  let getRemainingRequest
  let stringifyRequest

  beforeEach(() => {
    getRemainingRequest = jest.spyOn(loaderUtils, 'getRemainingRequest').mockReturnValue('/src/test.mpx')
    stringifyRequest = jest.spyOn(loaderUtils, 'stringifyRequest').mockImplementation((context, request) => request)
  })

  afterEach(() => {
    getRemainingRequest.mockRestore()
    stringifyRequest.mockRestore()
  })

  function getStyleRequest (mode, srcMode) {
    const { getRequestString } = createHelpers({
      resource: '/src/test.mpx',
      getMpx: () => ({ mode, env: '' })
    })
    return getRequestString('styles', {
      src: './style.css',
      mode,
      srcMode
    })
  }

  it.each(['web', 'ios', 'android', 'harmony'])('should preserve global srcMode for %s block', (mode) => {
    expect(getStyleRequest(mode)).not.toContain(`mode=${mode}`)
  })

  it('should pass explicit block srcMode independently from mode', () => {
    expect(getStyleRequest('ali', 'ali')).toContain('srcMode=ali')
  })

  it('should keep srcMode for an inline template block', () => {
    const { getRequestString } = createHelpers({
      resource: '/src/test.mpx?srcMode=wx',
      getMpx: () => ({ mode: 'ali', env: '' })
    })

    expect(getRequestString('template', {
      srcMode: 'ali'
    })).toContain('srcMode=ali')
  })

  it('should inherit resource srcMode for an SFC template src block', () => {
    const { getRequestString } = createHelpers({
      resource: '/src/test.mpx?srcMode=wx',
      getMpx: () => ({ mode: 'ali', env: '' })
    })
    const request = getRequestString('template', {
      src: './template.axml'
    }, {
      srcMode: 'wx'
    })

    expect(request).toContain('srcMode=wx')
    expect(request).not.toMatch(/[?&]mode=/)
  })

  it('should use explicit src-mode for an SFC template src block', () => {
    const { getRequestString } = createHelpers({
      resource: '/src/test.mpx?srcMode=wx',
      getMpx: () => ({ mode: 'ali', env: '' })
    })
    const request = getRequestString('template', {
      src: './template.axml',
      srcMode: 'ali'
    }, {
      srcMode: 'wx'
    })

    expect(request).toContain('srcMode=ali')
    expect(request).not.toContain('srcMode=wx')
    expect(request).not.toMatch(/[?&]mode=/)
  })
})
