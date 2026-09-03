jest.mock('../lib/react/script-helper', () => ({
  buildPagesMap: jest.fn(() => ({ pagesMap: {}, firstPage: '' })),
  buildComponentsMap: jest.fn(() => ({})),
  getRequireScript: jest.fn(() => ''),
  buildGlobalParams: jest.fn(({ srcMode }) => `reactSrcMode:${srcMode}\n`),
  stringifyRequest: jest.fn(() => '"option-processor"'),
  buildI18n: jest.fn(() => '')
}))

jest.mock('../lib/web/script-helper', () => ({
  buildComponentsMap: jest.fn(() => ({})),
  getRequireScript: jest.fn(() => ''),
  buildGlobalParams: jest.fn(({ srcMode }) => `webSrcMode:${srcMode}\n`),
  stringifyRequest: jest.fn(() => '"option-processor"'),
  buildI18n: jest.fn(() => '')
}))

const processReactScript = require('../lib/react/processScript')
const processWebScript = require('../lib/web/processScript')
const parseComponent = require('../lib/parser')

describe('block mode srcMode', () => {
  const baseOptions = {
    ctorType: 'component',
    srcMode: 'wx',
    moduleId: 'm123',
    isProduction: false,
    jsonConfig: {},
    outputPath: '',
    builtInComponentsMap: {},
    localComponentsMap: {}
  }

  it('normalizes src-mode independently from mode selection', () => {
    const parts = parseComponent('<template mode="ali" src-mode="ali"><view /></template>', {
      filePath: '/src/test.mpx',
      mode: 'ali',
      env: ''
    })
    expect(parts.template.mode).toBe('ali')
    expect(parts.template.srcMode).toBe('ali')
  })

  it('ignores src-mode that differs from output mode', () => {
    const parts = parseComponent('<template mode="ali" src-mode="wx"><view /></template>', {
      filePath: '/src/test.mpx',
      mode: 'ali',
      env: ''
    })
    expect(parts.template.mode).toBe('ali')
    expect(parts.template.srcMode).toBeUndefined()
  })

  it('should preserve srcMode for RN script block', (done) => {
    const loaderContext = {
      getMpx: () => ({
        appInfo: { name: 'app' }
      })
    }

    processReactScript({
      mode: 'ios'
    }, Object.assign({
      loaderContext,
      localPagesMap: {},
      rnConfig: {}
    }, baseOptions), (err, result) => {
      expect(err).toBeNull()
      expect(result.output).toContain('reactSrcMode:wx')
      done()
    })
  })

  it('should preserve srcMode for Web script block', (done) => {
    const loaderContext = {
      mode: 'development',
      getMpx: () => ({
        projectRoot: '/project',
        appInfo: { name: 'app' },
        webConfig: {},
        i18n: null
      })
    }

    processWebScript({
      tag: 'script',
      attrs: {
        mode: 'web'
      },
      mode: 'web',
      content: 'Component({})'
    }, Object.assign({
      loaderContext,
      hasScoped: false
    }, baseOptions), (err, result) => {
      expect(err).toBeNull()
      expect(result.output).toContain('webSrcMode:wx')
      done()
    })
  })
})
