const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom')
const root = '/private/tmp/mpx-options-validation/dist/web'
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))
class LocalResources extends ResourceLoader {
  fetch (url) {
    const pathname = new URL(url).pathname
    assert.ok(pathname.startsWith('/help-demo/'), 'resources use deployment prefix')
    const file = path.join(root, pathname.slice('/help-demo/'.length))
    assert.ok(fs.existsSync(file), 'resource exists: ' + pathname)
    return Promise.resolve(fs.readFileSync(file))
  }
}
async function load (width, route = '') {
  const errors = []
  const virtualConsole = new VirtualConsole()
  virtualConsole.on('jsdomError', error => errors.push(error.message))
  virtualConsole.on('error', (...args) => errors.push(args.join(' ')))
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), {
    url: 'https://validation.invalid/help-demo/' + route,
    runScripts: 'dangerously',
resources: new LocalResources(),
pretendToBeVisual: true,
virtualConsole,
    beforeParse (window) {
      window.matchMedia = () => ({ matches: false, addListener () {}, removeListener () {} })
      window.scrollTo = () => {}
      window.innerWidth = width
      window.wx = { getMenuButtonBoundingClientRect () { throw new Error('Web called wx capsule API') } }
    }
  })
  await new Promise(resolve => dom.window.addEventListener('load', resolve))
  await delay(30)
  return { dom, errors }
}
async function waitFor (predicate) {
  for (let index = 0; index < 100; index++) {
    if (predicate()) return
    await delay(10)
  }
  throw new Error('Timed out waiting for navigation/state')
}
;(async () => {
  for (const width of [375, 750]) {
    const { dom, errors } = await load(width)
    try {
      const window = dom.window
      const document = window.document
      const style = selector => window.getComputedStyle(document.querySelector(selector))
      assert.equal(style('.size-sample').width, '100px')
      assert.equal(style('.size-sample').fontSize, '14px')
      assert.equal(style('.card .title').color, 'rgb(198, 40, 40)')
      assert.equal(window.getComputedStyle(document.querySelectorAll('.card .title')[1]).color, 'rgb(21, 101, 192)')
      assert.equal(style('.theme-label.warm-tone').color, 'rgb(187, 51, 17)')
      assert.equal(style('.theme-label.cool-tone').color, 'rgb(34, 85, 204)')
      assert.equal(style('.theme-label').padding, '12px')
      assert.equal(style('.equal-row').width, '240px')
      const row = document.querySelector('.equal-row')
      assert.equal(row.children.length, 2)
      Array.from(row.children).forEach(cell => {
        assert.ok(cell.classList.contains('layout-cell'), 'no component wrapper between row and cell')
        assert.equal(window.getComputedStyle(cell).flexGrow, '1')
        assert.equal(window.getComputedStyle(cell).minWidth, '0')
      })
      assert.equal(window.__mpxRouter.mode, 'history')
      assert.equal(window.__mpxRouter.options.base, '/help-demo/')
      document.querySelector('.mpx-button').dispatchEvent(new window.Event('tap', { bubbles: true }))
      await waitFor(() => window.location.pathname.endsWith('/pages/choice/index'))
      await waitFor(() => window.getCurrentPages()[0].selectedLabel === '正在选择')
      const choiceA = Array.from(document.querySelectorAll('.mpx-button')).find(button => button.textContent === '选项 A')
      assert.ok(choiceA)
      choiceA.dispatchEvent(new window.Event('tap', { bubbles: true }))
      await waitFor(() => window.location.pathname.endsWith('/pages/home/index'))
      await waitFor(() => document.body.textContent.includes('当前：选项 A'))
      const link = Array.from(document.querySelectorAll('a')).find(anchor => anchor.textContent === '通过链接选择')
      assert.equal(new URL(link.href).pathname, '/help-demo/pages/choice/index')
      link.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }))
      await waitFor(() => window.location.pathname.endsWith('/pages/choice/index'))
      await waitFor(() => document.body.textContent.includes('选项 B'))
      assert.equal(window.getCurrentPages()[0].selectedLabel, '选项 A', 'link entry must not reset ready state')
      assert.equal(document.querySelectorAll('.mpx-navigation-bar').length, 0)
      const choiceB = Array.from(document.querySelectorAll('.mpx-button')).find(button => button.textContent === '选项 B')
      choiceB.dispatchEvent(new window.Event('tap', { bubbles: true }))
      await waitFor(() => window.location.pathname.endsWith('/pages/home/index'))
      await waitFor(() => document.body.textContent.includes('当前：选项 B'))
      const packageLink = Array.from(document.querySelectorAll('a')).find(anchor => anchor.textContent === '独立入口')
      packageLink.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))
      await waitFor(() => document.body.textContent.includes('独立入口说明'))
      assert.ok(window.location.pathname.endsWith('/packageA/index'))
      assert.deepEqual(errors, [])
      console.log('PASS', width, 'CSS, host structure, ready, both return paths, history and lazy subpackage')
    } finally { dom.window.close() }
  }
  const { dom, errors } = await load(375, 'pages/choice/index?source=link')
  try {
    assert.ok(dom.window.document.body.textContent.includes('选择一个选项'))
    dom.window.document.querySelector('.mpx-button').dispatchEvent(new dom.window.Event('tap', { bubbles: true }))
    await delay(30)
    assert.deepEqual(errors, [])
    console.log('PASS direct choice route without opener')
  } finally { dom.window.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
