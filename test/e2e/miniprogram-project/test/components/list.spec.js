const simulate = require('@mpxjs/miniprogram-simulate')
const fs = require('fs')
const { resolveDist, resolve } = require('../util')

function loadComponent (componentPathStr) {
  const outputMap = require(resolveDist('outputMap.json', 'wx'))
  const componentPath = resolve(componentPathStr)
  const realComponentPath = resolveDist(outputMap.outputPathMap[componentPath], 'wx')
  return simulate.load(realComponentPath, undefined, { rootPath: resolveDist('', 'wx') })
}

function getBuildOutFilePath (componentPathStr, mode) {
  const outputMap = require(resolveDist('outputMap.json', mode))
  const componentPath = resolve(componentPathStr)
  return resolveDist(outputMap.outputPathMap[componentPath], mode)
}

function readFile (path) {
  const result = fs.readFileSync(path, 'utf-8')
  return result
}

describe('component list', () => {
  let id
  beforeAll(() => {
    id = loadComponent('src/components/list.mpx')
  })
  let comp = null
  let parent = null
  beforeEach(() => {
    comp = simulate.render(id)
    parent = document.createElement('parent-wrapper') // 创建容器节点
    comp.attach(parent)// 挂载组件到容器节点
  })

  it('correctly sets the message when component attached', async () => {
    await simulate.sleep(1000)
    const instance = comp.instance
    // test path resolve
    expect(instance.data.pathIndexPath).toBe('/pages/index')
    // test store bind count
    expect(comp.querySelector('.count_location').dom.innerHTML).toBe('0')
    // test mixins
    expect(instance.data.list).toEqual({
      'phone': '手机',
      'tv': '电视',
      'computer': '电脑'
    })
    // test img resolve
    expect(instance.data.testPngPath).toBeDefined()
  })

  it('should correctly css scope feature', async () => {
    // test ali mode css scope
    const listComponentAliPath = getBuildOutFilePath('src/components/list.mpx', 'ali')
    const listComponentAliCss = readFile(listComponentAliPath + '.acss')
    expect(/.list\../.test(listComponentAliCss)).toBe(true)
  })

  it('should correctly defs feature', () => {
    // 测试 defs 功能是否正常
    const instance = comp.instance
    expect(instance.data.defBlack).toBe('blackgan test')
    expect(comp.querySelector('.test_defs').dom.innerHTML).toBe('blackgan test')
  })

  it('should transRpxRules feature correctly', function () {
    // 测试 transRpxRules 功能是否正常
    const listComponentWxPath = getBuildOutFilePath('src/components/list.mpx', 'wx')
    const listComponentWxCss = readFile(listComponentWxPath + '.wxss')
    expect(listComponentWxCss.includes('width: 118rpx;')).toBeTruthy()
  })

  it('should decodeHtmlText feature correctly', function () {
    // 测试decodeHTMLText功能是否正常
    expect(comp.querySelector('.test_decodeText').dom.innerHTML).toBe('foo © bar ≠ baz 𝌆 qux')
  })

  it('should customOutputPath feature correctly', function () {
    // 测试customOutputPath 功能是否正常
    const customComponentWxPath = getBuildOutFilePath('src/components/customOutputCom.mpx', 'wx')
    expect(customComponentWxPath.includes('wx/components/customOutputCom/index')).toBeTruthy()
  })

  // it('should i18n feature correctly', function () {
  //
  //   expect(comp.querySelector('.test_i18n').dom.innerHTML).toBe('foo © bar ≠ baz 𝌆 qux')
  // })
})
