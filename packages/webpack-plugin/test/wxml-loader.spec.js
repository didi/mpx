const loaderUtils = require('loader-utils')
const wxmlLoader = require('../lib/wxml/loader')

describe('wxml loader imported resource srcMode', () => {
  let stringifyRequest

  beforeEach(() => {
    stringifyRequest = jest.spyOn(loaderUtils, 'stringifyRequest').mockImplementation((context, request) => JSON.stringify(request))
  })

  afterEach(() => {
    stringifyRequest.mockRestore()
  })

  it('does not pass parent srcMode or mode to imported template and WXS requests', () => {
    const output = wxmlLoader.call({
      resource: '/src/parent.axml?srcMode=ali',
      resourcePath: '/src/parent.axml',
      remainingRequest: '/src/parent.axml?srcMode=ali',
      getMpx: () => ({
        projectRoot: '/src',
        externals: [],
        mode: 'ali',
        env: '',
        attributes: []
      })
    }, '<import src="./child.axml"/><import-sjs name="util" from="./util.sjs"/>')

    const requests = stringifyRequest.mock.calls.map((call) => call[1])
    expect(requests).toHaveLength(2)
    requests.forEach((request) => {
      expect(request).not.toContain('srcMode=ali')
      expect(request).not.toMatch(/[?&]mode=ali(?:&|$)/)
    })
    expect(output).toContain('require(')
  })
})
