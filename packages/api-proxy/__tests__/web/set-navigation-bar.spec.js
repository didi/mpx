import fs from 'fs'
import { transformSync } from '@babel/core'
import Vue from 'vue'
import Mpx from '@mpxjs/core'
import { setNavigationBarTitle, setNavigationBarColor } from '../../src/platform/api/set-navigation-bar/index.web'
import { processComponentOption } from '../../../webpack-plugin/lib/runtime/optionProcessor'
import pageStatusMixin from '../../../core/src/platform/builtInMixins/pageStatusMixin.web'

jest.mock('@mpxjs/core', () => ({ config: { webConfig: { enableTitleBar: true } } }))

const filename = require.resolve('@mpxjs/webpack-plugin/lib/runtime/components/web/mpx-titlebar.vue')
const source = fs.readFileSync(filename, 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1]
const code = transformSync(source, { filename: filename + '.js', envName: 'test' }).code
const titlebarModule = { exports: {} }
// eslint-disable-next-line no-new-func
new Function('require', 'module', 'exports', code)(require, titlebarModule, titlebarModule.exports)
const Titlebar = titlebarModule.exports.default

describe('Web navigation bar APIs', () => {
  const getPages = global.getCurrentPages
  const ignoredElements = Vue.config.ignoredElements
  const pages = []
  let currentPage

  beforeAll(() => {
    Vue.config.ignoredElements = ignoredElements.concat('page')
  })

  afterAll(() => {
    Vue.config.ignoredElements = ignoredElements
  })

  function createPage (options) {
    const page = new Vue(options).$mount()
    pages.push(page)
    return page
  }

  function pageOptions (pageConfig = {}) {
    return processComponentOption({
      option: {
        beforeCreate: pageStatusMixin('page').beforeCreate,
        render (h) {
          return h(Titlebar, { props: { pageConfig: this.$options.__mpxPageConfig } })
        }
      },
      ctorType: 'page',
      pageConfig,
      componentsMap: {},
      hasApp: true
    })
  }

  beforeEach(() => {
    global.__mpxPageConfig = {}
    global.getCurrentPages = () => currentPage ? [currentPage] : []
    currentPage = null
    Mpx.config.webConfig.enableTitleBar = true
    document.title = ''
    document.head.innerHTML = ''
  })

  afterEach(() => {
    pages.splice(0).forEach(page => page.$destroy())
    global.getCurrentPages = getPages
    delete global.__mpxPageConfig
  })

  test('updates the built-in titlebar and preserves browser title and theme color', async () => {
    currentPage = createPage(pageOptions())
    const success = jest.fn()
    const complete = jest.fn()

    setNavigationBarTitle({ title: 'Updated title', success, complete })
    setNavigationBarColor({ frontColor: '#ffffff', backgroundColor: '#123456', success, complete })
    await Vue.nextTick()

    const title = currentPage.$el.querySelector('.mpx-titlebar__title')
    expect(title.textContent).toBe('Updated title')
    expect(title.style.color).toBe('rgb(255, 255, 255)')
    expect(currentPage.$el.querySelector('.mpx-titlebar').style.backgroundColor).toBe('rgb(18, 52, 86)')
    expect(document.title).toBe('Updated title')
    expect(document.querySelector('meta[name="theme-color"]').content).toBe('#123456')
    expect(success.mock.calls).toEqual([
      [{ errMsg: 'setNavigationBarTitle:ok' }],
      [{ errMsg: 'setNavigationBarColor:ok' }]
    ])
    expect(complete.mock.calls).toEqual(success.mock.calls)
  })

  test('keeps updates local to the current page instance', async () => {
    global.__mpxPageConfig = { navigationBarTitleText: 'App title', disableScroll: true }
    const pageConfig = { navigationBarTitleText: 'Page title' }
    const options = pageOptions(pageConfig)
    const firstPage = createPage(options)
    expect(firstPage.$options.__mpxPageConfig).toEqual({ navigationBarTitleText: 'Page title', disableScroll: true })
    currentPage = firstPage
    setNavigationBarTitle({ title: 'First page' })
    const secondPage = createPage(options)
    expect(secondPage.$options.__mpxPageConfig.navigationBarTitleText).toBe('Page title')
    currentPage = secondPage
    setNavigationBarTitle({ title: 'Second page' })
    setNavigationBarColor({ frontColor: '#000000', backgroundColor: '#abcdef' })
    await Vue.nextTick()

    expect(firstPage.$el.querySelector('.mpx-titlebar__title').textContent).toBe('First page')
    expect(secondPage.$el.querySelector('.mpx-titlebar__title').textContent).toBe('Second page')
    expect(firstPage.$options.__mpxPageConfig.navigationBarBackgroundColor).toBeUndefined()
    expect(global.__mpxPageConfig).toEqual({ navigationBarTitleText: 'App title', disableScroll: true })
    expect(pageConfig).toEqual({ navigationBarTitleText: 'Page title' })
    expect(options.__mpxPageConfig).toBe(pageConfig)
  })

  test('keeps the titlebar hidden when disabled and still updates browser metadata', async () => {
    Mpx.config.webConfig.enableTitleBar = false
    currentPage = createPage(pageOptions())
    setNavigationBarTitle({ title: 'Browser title' })
    setNavigationBarColor({ frontColor: '#ffffff', backgroundColor: '#123456' })
    await Vue.nextTick()

    expect(currentPage.$el.querySelector('.mpx-titlebar')).toBeNull()
    expect(document.title).toBe('Browser title')
    expect(document.querySelector('meta[name="theme-color"]').content).toBe('#123456')
  })

  test.each([null, { route: 'page' }])('reports failure when the page instance is unavailable: %p', (page) => {
    currentPage = page
    document.title = 'Original title'
    document.head.insertAdjacentHTML('beforeend', '<meta name="theme-color" content="#abcdef">')
    const success = jest.fn()
    const fail = jest.fn()
    const complete = jest.fn()

    setNavigationBarTitle({ title: 'Updated', success, fail, complete })
    setNavigationBarColor({ frontColor: '#000000', backgroundColor: '#123456', success, fail, complete })

    expect(success).not.toHaveBeenCalled()
    expect(fail.mock.calls).toEqual([
      [{ errMsg: 'setNavigationBarTitle:fail page instance is unavailable' }],
      [{ errMsg: 'setNavigationBarColor:fail page instance is unavailable' }]
    ])
    expect(complete.mock.calls).toEqual(fail.mock.calls)
    expect(document.title).toBe('Original title')
    expect(document.querySelector('meta[name="theme-color"]').content).toBe('#abcdef')
  })

  test('accepts a three-digit hex background color', async () => {
    currentPage = createPage(pageOptions())
    setNavigationBarColor({ frontColor: '#000000', backgroundColor: '#abc' })
    await Vue.nextTick()

    expect(currentPage.$el.querySelector('.mpx-titlebar').style.backgroundColor).toBe('rgb(170, 187, 204)')
    expect(currentPage.$el.querySelector('.mpx-titlebar__title').style.color).toBe('rgb(0, 0, 0)')
  })

  test.each([
    {},
    { frontColor: '#FFFFFF', backgroundColor: '#123456' },
    { frontColor: '#000000', backgroundColor: 'red' },
    { frontColor: '#ffffff', backgroundColor: '#1234' },
    { backgroundColor: '#123456' }
  ])('rejects invalid colors without changing the titlebar or browser theme', (options) => {
    currentPage = createPage(pageOptions())
    document.head.innerHTML = '<meta name="theme-color" content="#abcdef">'
    const success = jest.fn()
    const fail = jest.fn()
    const complete = jest.fn()

    setNavigationBarColor(Object.assign({}, options, { success, fail, complete }))

    const result = { errMsg: 'setNavigationBarColor:fail invalid color' }
    expect(fail).toHaveBeenCalledWith(result)
    expect(complete).toHaveBeenCalledWith(result)
    expect(success).not.toHaveBeenCalled()
    expect(currentPage.$options.__mpxPageConfig).toEqual({})
    expect(document.querySelector('meta[name="theme-color"]').content).toBe('#abcdef')
  })
})
