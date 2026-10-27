const fs = require('fs')
const path = require('path')
const assert = require('assert/strict')
const workspace = '/Users/didi/work/mpx/.agents/skills/mpx2web-workspace'
const env = require.resolve('jest-environment-jsdom', { paths: [workspace] })
const { JSDOM, ResourceLoader, VirtualConsole } = require(require.resolve('jsdom', { paths: [env] }))
const project = fs.readFileSync('/tmp/mpx-options-verify-current', 'utf8')
const dist = path.join(project, 'dist/web')
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
class LocalResources extends ResourceLoader {
  fetch (url) {
    const pathname = new URL(url).pathname
    assert(pathname.startsWith('/help-demo/'), `Unexpected resource prefix: ${url}`)
    return Promise.resolve(fs.readFileSync(path.join(dist, pathname.slice('/help-demo/'.length))))
  }
}
async function until (fn) {
  for (let i = 0; i < 100; i++) {
    if (fn()) return
    await new Promise(resolve => setTimeout(resolve, 20))
  }
  throw new Error('Timed out: ' + fn.toString())
}
async function start (width, pathname = '/help-demo/pages/home/index') {
  const errors = []
  const vc = new VirtualConsole()
  vc.on('jsdomError', e => errors.push(e.message))
  vc.on('error', (...args) => errors.push(args.join(' ')))
  const dom = new JSDOM(html, {
    url: 'http://options.test' + pathname,
    resources: new LocalResources(),
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse (window) {
      window.scrollTo = () => {}
      window.wx = { getMenuButtonBoundingClientRect () { throw new Error('Web called wx capsule API') } }
      Object.defineProperty(window, 'innerWidth', { value: width })
    }
  })
  await until(() => dom.window.document.querySelector('.mpx-button')).catch(error => { console.error('DOM ERRORS', errors); console.error(dom.window.document.body.innerHTML); dom.window.close(); throw error })
  return { dom, errors }
}
async function verify () {
  for (const width of [375, 750]) {
    const { dom, errors } = await start(width)
    const { document } = dom.window
    const css = el => dom.window.getComputedStyle(el)
    assert.equal(css(document.querySelector('.size-sample')).width, '100px')
    assert.equal(css(document.querySelector('.size-sample')).fontSize, '14px')
    assert.equal(css(document.querySelectorAll('.card .title')[0]).color, 'rgb(198, 40, 40)')
    assert.equal(css(document.querySelectorAll('.card .title')[1]).color, 'rgb(21, 101, 192)')
    const labels = document.querySelectorAll('.theme-label')
    assert.equal(labels.length, 2)
    assert.equal(css(labels[0]).color, 'rgb(187, 51, 17)')
    assert.equal(css(labels[1]).color, 'rgb(34, 85, 204)')
    labels.forEach(label => assert.equal(css(label).padding, '12px'))
    const cells = document.querySelectorAll('.equal-row > .layout-cell')
    assert.equal(cells.length, 2)
    assert.equal(css(document.querySelector('.equal-row')).width, '240px')
    cells.forEach(cell => { assert.equal(css(cell).flexGrow, '1'); assert.equal(css(cell).flex, '1'); assert.equal(css(cell).minWidth, '0') })
    assert.equal(document.querySelectorAll('.mpx-navigation-bar').length, 0)
    const findHome = vm => vm.selectedLabel !== undefined ? vm : vm.$children.map(findHome).find(Boolean)
    assert.equal(dom.window.__mpxRouter.mode, 'history')
    assert.equal(dom.window.__mpxRouter.options.base, '/help-demo/')
    const homeVm = findHome(document.querySelector('#app').__vue__)
    assert.equal(homeVm.selectedLabel, '未选择')
    document.querySelector('.mpx-button').click()
    await until(() => document.body.textContent.includes('选择一个选项'))
    assert.equal(homeVm.selectedLabel, '正在选择')
    Array.from(document.querySelectorAll('.mpx-button')).find(button => button.textContent.includes('选项 A')).click()
    await until(() => document.body.textContent.includes('当前：选项 A'))
    assert.equal(dom.window.location.pathname, '/help-demo/pages/home/index')
    const link = Array.from(document.querySelectorAll('div')).find(el => el.textContent === '通过链接选择')
    link.click()
    await until(() => document.body.textContent.includes('选择一个选项'))
    assert.equal(homeVm.selectedLabel, '选项 A', 'link entry must not reset ready state')
    Array.from(document.querySelectorAll('.mpx-button')).find(button => button.textContent.includes('选项 B')).click()
    await until(() => document.body.textContent.includes('当前：选项 B'))
    const packageLink = Array.from(document.querySelectorAll('a')).find(el => el.textContent === '独立入口')
    packageLink.click()
    await until(() => document.body.textContent.includes('独立入口说明'))
    assert.equal(dom.window.location.pathname, '/help-demo/packageA/index')
    assert.deepEqual(errors, [])
    console.log(`PASS ${width}px: isolated cards, external classes, fixed rpx, virtual flex roots, ready and both confirmation paths`)
    dom.window.close()
  }
  const direct = await start(375, '/help-demo/pages/choice/index?source=link')
  assert(direct.dom.window.document.body.textContent.includes('选择一个选项'))
  direct.dom.window.document.querySelector('.mpx-button').click()
  await new Promise(resolve => setTimeout(resolve, 50))
  assert.deepEqual(direct.errors, [])
  direct.dom.window.close()
  console.log('PASS direct history route without opener')
}
verify().catch(error => { console.error(error); process.exitCode = 1 })
