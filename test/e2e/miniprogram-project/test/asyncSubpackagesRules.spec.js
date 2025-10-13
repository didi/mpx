const fs = require('fs')
const json5 = require('json5')
const path = require('path')

const readFileSyncInDist = (filePath, options) => {
  const realPath = path.join(path.resolve(), filePath)
  return fs.readFileSync(realPath, options)
}

describe('test webpackPlugin asyncSubpackageRules', () => {
  it('should automatically supplement usingComponents and componentPlaceholder', function () {
    const wxAppJsonStr = readFileSyncInDist('dist/wx/test2/pages/testAsyncSubpackageRules1.json')
    const wxAppJsonObj = json5.parse(wxAppJsonStr)
    expect(wxAppJsonObj).toMatchObject({
      usingComponents: {
        asyncComp: expect.any(String),
        'placeholder-view': expect.any(String)
      },
      componentPlaceholder: {
        asyncComp: 'placeholder-view'
      }
    })
  })

  it('should not add duplicate usingComponents', function () {
    const wxAppJsonStr = readFileSyncInDist('dist/wx/test2/pages/testAsyncSubpackageRules2.json')
    const wxAppJsonObj = json5.parse(wxAppJsonStr)
    expect(wxAppJsonObj).toMatchObject({
      usingComponents: {
        asyncComp: expect.any(String),
        'placeholder-view': expect.any(String)
      },
      componentPlaceholder: {
        asyncComp: 'placeholder-view'
      }
    })
  })

  it('should not overwrite existing usingComponents and componentPlaceholder', function () {
    const wxAppJsonStr = readFileSyncInDist('dist/wx/test2/pages/testAsyncSubpackageRules3.json')
    const wxAppJsonObj = json5.parse(wxAppJsonStr)
    expect(wxAppJsonObj).toMatchObject({
      usingComponents: {
        asyncComp: expect.any(String),
        asyncComp1: expect.any(String),
        'placeholder-view': expect.any(String),
        'placeholder-view1': expect.any(String)
      },
      componentPlaceholder: {
        asyncComp: 'placeholder-view1',
        asyncComp1: 'button'
      }
    })
  })
})
