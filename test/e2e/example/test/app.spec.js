const fs = require('fs')
const json5 = require('json5')
const path = require('path')

describe('test App instance', () => {
  const subpackage = [
    {
      "root": "test",
      "pages": [
        "pages/index",
      ]
    }
  ]

  it('should wx App instance json is correct', function () {
    console.log('=========', path.resolve('.'))
    const wxAppJsonStr = fs.readFileSync('dist/wx/app.json', 'utf-8')
    const wxAppJsonObj = json5.parse(wxAppJsonStr)
    const wxPages = wxAppJsonObj.pages
    const wxSubPackages = wxAppJsonObj.subPackages
    expect(wxPages).toEqual(['pages/index', "pages/mode", 'pages/alias', 'pages/someEnv'])
    expect(wxSubPackages).toEqual(subpackage)
  })

  it('should ali App instance json is correct', function () {
    const aliAppJsonStr = fs.readFileSync('dist/ali/app.json', 'utf-8')
    const aliAppJsonObj = json5.parse(aliAppJsonStr)
    const aliPages = aliAppJsonObj.pages
    const aliSubPackages = aliAppJsonObj.subPackages
    expect(aliPages).toEqual(['pages/index', "pages/mode", 'pages/alias'])
    expect(aliSubPackages).toEqual(subpackage)
  })

  it('should tt App instance json is correct', function () {
    const ttAppJsonStr = fs.readFileSync('dist/tt/app.json', 'utf-8')
    const ttAppJsonObj = json5.parse(ttAppJsonStr)
    const ttPages = ttAppJsonObj.pages
    const ttSubPackages = ttAppJsonObj.subPackages
    expect(ttPages).toEqual(['pages/index', "pages/mode", 'pages/alias'])
    expect(ttSubPackages).toEqual(subpackage)
  })

  it('should swan App instance json is correct', function () {
    const swanAppJsonStr = fs.readFileSync('dist/swan/app.json', 'utf-8')
    const swanAppJsonObj = json5.parse(swanAppJsonStr)
    const swanPages = swanAppJsonObj.pages
    const swanSubPackages = swanAppJsonObj.subPackages
    expect(swanPages).toEqual(['pages/index', "pages/mode", 'pages/alias'])
    expect(swanSubPackages).toEqual(subpackage)
  })

  it('should App mode and env display correct', function () {
    // test page resolve mode
    const swanPageEnvStr = fs.readFileSync('dist/swan/pages/mode.swan', 'utf-8')
    const aliPageEnvStr = fs.readFileSync('dist/ali/pages/mode.axml', 'utf-8')
    const ttPageEnvStr = fs.readFileSync('dist/tt/pages/mode.ttml', 'utf-8')
    const wxPageEnvStr = fs.readFileSync('dist/wx/pages/mode.wxml', 'utf-8')
    expect(swanPageEnvStr).toMatch(/<view>\{\{\("swan"\)}}<\/view>/)
    expect(aliPageEnvStr).toMatch(/<view>\{\{\("ali"\)}}<\/view>/)
    expect(ttPageEnvStr).toMatch(/<view>\{\{\("tt"\)}}<\/view>/)
    expect(wxPageEnvStr).toMatch(/<view>\{\{\("wx"\)}}<\/view>/)
  })
  // it('should App use plugin display correct', function () {
  //
  // })
})
