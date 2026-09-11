const compiler = require('../../lib/template-compiler/compiler')
const templateLoader = require('../../lib/template-compiler')

describe('template compiler UnoCSS scan matching', () => {
  let parse

  beforeEach(() => {
    parse = jest.spyOn(compiler, 'parse').mockReturnValue({
      root: {},
      meta: {
        wxsModuleMap: {}
      }
    })
    jest.spyOn(compiler, 'serialize').mockReturnValue('')
    jest.spyOn(compiler, 'genNode').mockReturnValue('')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  function compileTemplate (resource) {
    const isUnoCSSScanFile = jest.fn(file => file.startsWith('/project/src/') && !file.startsWith('/project/src/excluded/'))
    const mpx = {
      projectRoot: '/project',
      mode: 'wx',
      srcMode: 'wx',
      defs: {},
      externalClasses: [],
      hasUnoCSS: true,
      isUnoCSSScanFile,
      wxsContentMap: {},
      optimizeRenderRules: [],
      forceProxyEventRules: [],
      autoVirtualHostRules: [],
      checkUsingComponentsRules: [],
      getModuleId: jest.fn(() => 'module-id')
    }
    const loaderContext = {
      resource,
      cacheable: jest.fn(),
      getMpx: () => mpx,
      emitError: jest.fn(),
      emitWarning: jest.fn(),
      emitFile: jest.fn()
    }

    templateLoader.call(loaderContext, '')

    return {
      isUnoCSSScanFile,
      options: parse.mock.calls[0][1]
    }
  }

  test.each([
    ['/project/src/pages/index.mpx?type=template', true],
    ['/project/src/excluded/index.mpx?type=template', false],
    ['/project/packages/component.mpx?type=template', false]
  ])('passes scan result for resource %s to compiler', (resource, expected) => {
    const { isUnoCSSScanFile, options } = compileTemplate(resource)

    expect(isUnoCSSScanFile).toHaveBeenCalledWith(resource.split('?')[0])
    expect(options.isUnoCSSScanFile).toBe(expected)
  })
})
