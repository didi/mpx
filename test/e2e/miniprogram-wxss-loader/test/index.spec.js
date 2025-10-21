const simulate = require('@mpxjs/miniprogram-simulate')
const fs = require('fs')
const path = require('path')
const { resolveDist, resolve } = require('./util')

function loadComponent (componentPathStr) {
  const outputMap = require(resolveDist('outputMap.json', 'wx'))
  const componentPath = resolve(componentPathStr)
  const realComponentPath = resolveDist(outputMap.outputPathMap[componentPath], 'wx')
  return simulate.load(realComponentPath, undefined, {
    rootPath: resolveDist('', 'wx')
  })
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

describe('index page', () => {
  let id
  beforeAll(() => {
    id = loadComponent('src/pages/index/index.mpx')
  })
  let comp = null
  let parent = null
  beforeEach(() => {
    comp = simulate.render(id)
    parent = document.createElement('parent-wrapper') // 创建容器节点
    comp.attach(parent) // 挂载组件到容器节点
  })

  it('when the style import css file, it will draw out of this file', async () => {
    const { mode, css } = {
      mode: 'wx',
      css: '.wxss'
    }

    const listComponentPath = getBuildOutFilePath(
      'src/pages/index/index.mpx',
      mode
    )
    const listComponentCss = readFile(listComponentPath + css)
    const cssImportCode = `@import "../../styless/global43985ba5/index${css}";`
    const outputDir = resolveDist('', mode)
    const outputStylePath = path.join(
      outputDir,
      `styless/global43985ba5/index${css}`
    )
    const styleContent = await fs.readFileSync(outputStylePath, 'utf8')

    expect(listComponentCss.indexOf(cssImportCode) !== -1).toBe(true)
    expect(
      styleContent.includes(`
.title-wrapper {
    font-size: 30rpx;
}`)
    ).toBe(true)
  })

  it('When ali mode, the style import css file, it will draw out of this file', async () => {
    const { mode, css } = {
      mode: 'ali',
      css: '.acss'
    }

    const listComponentPath = getBuildOutFilePath(
      'src/pages/index/index.mpx',
      mode
    )
    const listComponentCss = readFile(listComponentPath + css)
    const cssImportCode = `@import "../../styless/global43985ba5/index${css}";`
    const outputDir = resolveDist('', mode)
    const outputStylePath = path.join(
      outputDir,
      `styless/global43985ba5/index${css}`
    )
    const styleContent = await fs.readFileSync(outputStylePath, 'utf8')

    expect(listComponentCss.indexOf(cssImportCode) !== -1).toBe(true)
    expect(
      styleContent.includes(`
.title-wrapper {
    font-size: 30rpx;
}`)
    ).toBe(true)
  })

  it("when wx mode, use /* @mpx-import 'xx.less' */ note，the less-loader、stylus-loader or other preLoaders will ignore the import file compilation，finally draw out of this file", async () => {
    const { mode, css } = {
      mode: 'wx',
      css: '.wxss'
    }
    const listComponentPath = getBuildOutFilePath(
      'src/pages/other/index.mpx',
      mode
    )
    const listComponentCss = readFile(listComponentPath + css)
    const cssImportCode = `@import "../../styless/global2f76fc37/index${css}";`
    const outputDir = resolveDist('', mode)
    const outputStylePath = path.join(
      outputDir,
      `styless/global2f76fc37/index${css}`
    )
    const styleContent = await fs.readFileSync(outputStylePath, 'utf8')

    expect(listComponentCss.indexOf(cssImportCode) !== -1).toBe(true)
    expect(
      styleContent.includes(`
html body {
  font-size: 24rpx;
}`)
    ).toBe(true)
  })

  it("when ali mode, use /* @mpx-import 'xx.less' */ note，the less-loader、stylus-loader or other preLoaders will ignore the import file compilation，finally draw out of this file", async () => {
    const { mode, css } = {
      mode: 'ali',
      css: '.acss'
    }
    const listComponentPath = getBuildOutFilePath(
      'src/pages/other/index.mpx',
      mode
    )
    const listComponentCss = readFile(listComponentPath + css)
    const cssImportCode = `@import "../../styless/global2f76fc37/index${css}";`
    const outputDir = resolveDist('', mode)
    const outputStylePath = path.join(
      outputDir,
      `styless/global2f76fc37/index${css}`
    )
    const styleContent = await fs.readFileSync(outputStylePath, 'utf8')

    expect(listComponentCss.indexOf(cssImportCode) !== -1).toBe(true)
    expect(
      styleContent.includes(`
html body {
  font-size: 24rpx;
}`)
    ).toBe(true)
  })

  it('when use ali mode, it should correctly contain css scope feature', async () => {
    const { mode, css } = {
      mode: 'ali',
      css: '.acss'
    }

    const listComponentPath = getBuildOutFilePath(
      'src/pages/scoped/index.mpx',
      mode
    )
    const listComponentCss = readFile(listComponentPath + css)
    expect(/.title\../.test(listComponentCss)).toBe(true)
  })

  it('import common url more than two times， finally it will be parse once', async () => {
    const { mode, css } = {
      mode: 'wx',
      css: '.wxss'
    }

    const listComponentPath = getBuildOutFilePath(
      'src/pages/once/index.mpx',
      mode
    )
    const listComponentCss = readFile(listComponentPath + css)
    const REGEXP = /(@import[\s]+["|'].+wxss["|'];)/g
    const matched = listComponentCss.match(REGEXP)
    expect(matched.length).toBe(1)
  })
})
