const fs = require('fs')
const json5 = require('json5')
const path = require('path')

const readFileSyncInDist = (filePath, options) => {
  const realPath = path.join(path.resolve(), filePath)
  return fs.readFileSync(realPath, options)
}

describe('test App instance', () => {
  let subpackage = []
  beforeEach(() => {
    subpackage = [
      {
        'root': 'test2',
        'pages': [
          'pages/index'
        ]
      },
      {
        'root': 'test',
        'pages': [
          'pages/index'
        ]
      }
    ]
  })

  it('should wx App instance json is correct', function () {
    const wxAppJsonStr = readFileSyncInDist('dist/wx/app.json', 'utf-8')
    const wxAppJsonObj = json5.parse(wxAppJsonStr)
    // const wxPages = wxAppJsonObj.pages
    const wxSubPackages = wxAppJsonObj.subPackages
    if (subpackage[0].root !== wxSubPackages[0].root) {
      subpackage.reverse()
    }
    // expect(wxPages).toMatch(['pages/index', 'pages/mode', 'pages/alias', 'pages/someEnv'])
    expect(wxSubPackages).toEqual(subpackage)
  })

  it('should ali App instance json is correct', function () {
    const aliAppJsonStr = readFileSyncInDist('dist/ali/app.json', 'utf-8')
    const aliAppJsonObj = json5.parse(aliAppJsonStr)
    const aliPages = aliAppJsonObj.pages
    const aliSubPackages = aliAppJsonObj.subPackages
    expect(aliPages).toEqual(['pages/index', 'pages/mode', 'pages/alias'])
    if (subpackage[0].root !== aliSubPackages[0].root) {
      subpackage.reverse()
    }
    expect(aliSubPackages).toEqual(subpackage)
  })

  it('should tt App instance json is correct', function () {
    const ttAppJsonStr = readFileSyncInDist('dist/tt/app.json', 'utf-8')
    const ttAppJsonObj = json5.parse(ttAppJsonStr)
    const ttPages = ttAppJsonObj.pages
    const ttSubPackages = ttAppJsonObj.subPackages
    expect(ttPages).toEqual(['pages/index', 'pages/mode', 'pages/alias'])
    if (subpackage[0].root !== ttSubPackages[0].root) {
      subpackage.reverse()
    }
    expect(ttSubPackages).toEqual(subpackage)
  })

  it('should swan App instance json is correct', function () {
    const swanAppJsonStr = readFileSyncInDist('dist/swan/app.json', 'utf-8')
    const swanAppJsonObj = json5.parse(swanAppJsonStr)
    const swanPages = swanAppJsonObj.pages
    const swanSubPackages = swanAppJsonObj.subPackages
    expect(swanPages).toEqual(['pages/index', 'pages/mode', 'pages/alias'])
    if (subpackage[0].root !== swanSubPackages[0].root) {
      subpackage.reverse()
    }
    expect(swanSubPackages).toEqual(subpackage)
  })

  it('should App mode and env display correct', function () {
    // test page resolve mode
    const swanPageEnvStr = readFileSyncInDist('dist/swan/pages/mode.swan', 'utf-8')
    const aliPageEnvStr = readFileSyncInDist('dist/ali/pages/mode.axml', 'utf-8')
    const ttPageEnvStr = readFileSyncInDist('dist/tt/pages/mode.ttml', 'utf-8')
    const wxPageEnvStr = readFileSyncInDist('dist/wx/pages/mode.wxml', 'utf-8')
    expect(swanPageEnvStr).toMatch(/\{\{\("swan"\)}}/)
    expect(aliPageEnvStr).toMatch(/\{\{\("ali"\)}}/)
    expect(ttPageEnvStr).toMatch(/\{\{\("tt"\)}}/)
    expect(wxPageEnvStr).toMatch(/\{\{\("wx"\)}}/)
  })
})
