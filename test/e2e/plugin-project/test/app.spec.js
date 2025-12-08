const fs = require('fs')
const path = require('path')
const json5 = require('json5')

const readFileSyncInDist = (filePath, options) => {
  const realPath = path.join(path.resolve(), filePath)
  return fs.readFileSync(realPath, options)
}

const readAndParseFileSyncInDist = (filePath, options) => {
  const str = readFileSyncInDist(filePath, options)
  return json5.parse(str)
}

describe('test plugin project generated correctly', () => {
  it('should plugin.json had correct config', function () {
    const wxPluginObj = readAndParseFileSyncInDist('dist/wx/plugin/plugin.json', 'utf-8')
    expect(wxPluginObj.publicComponents).toBeDefined()
    expect(wxPluginObj.publicComponents.hasOwnProperty('list')).toBeTruthy()
  })

  it('should miniprogram use plugin correctly', function () {
    const wxProjectObj = readAndParseFileSyncInDist('dist/wx/miniprogram/app.json', 'utf-8')
    expect(wxProjectObj.plugins.hasOwnProperty('myPlugin')).toBeTruthy()
  });
})
