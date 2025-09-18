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

  it('should subpackageModulesRules feature correctly', async () => {
    // test subpackageModulesRules 功能是否正常
    const subTestPageIndexPath = getBuildOutFilePath('src/subpackage/test/pages/index.mpx', 'wx')
    const subTest2PageIndexPath = getBuildOutFilePath('src/subpackage/test2/pages/index.mpx', 'wx')
    const subTestPageIndexPathJs = readFile(subTestPageIndexPath + '.js')
    const subTest2PageIndexPathJs = readFile(subTest2PageIndexPath + '.js')
    expect(subTestPageIndexPathJs.includes('blackgan common util common name')).toBeTruthy()
    expect(subTest2PageIndexPathJs.includes('blackgan common util common name')).toBeTruthy()
  })
})
