const fs = require('fs')
const path = require('path')
const vm = require('vm')
const assert = require('assert/strict')
const output = path.resolve(process.argv[2] || path.join(__dirname, '../outputs'))
const source = fs.readFileSync(path.join(output, 'orders.mpx'), 'utf8')
const template = source.match(/<template>([\s\S]*?)<\/template>/)[1]
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
const service = fs.readFileSync(path.join(output, 'service.js'), 'utf8').replace('export function', 'function')
const realFetch = vm.runInNewContext(service + '\nfetchOrders')
const root = { tag: 'root', children: [] }
const stack = [root]
Array.from(template.matchAll(/<(\/?)([\w-]+)\b([^>]*?)(\/?)>/g)).forEach(match => {
  if (match[1]) return assert.equal(stack.pop().tag, match[2])
  const attrs = {}
  Array.from(match[3].matchAll(/([\w:-]+)="([^"]*)"/g)).forEach(attr => { attrs[attr[1]] = attr[2] })
  const node = { tag: match[2], attrs, children: [] }
  stack[stack.length - 1].children.push(node)
  if (!match[4]) stack.push(node)
})
assert.equal(stack.length, 1)
const pageNode = root.children[0]
const skyOuter = pageNode.children[1]
const webOuter = pageNode.children[2]
assert.equal(skyOuter.attrs.type, 'nested')
assert.equal(skyOuter.children[0].tag, 'nested-scroll-header')
assert.equal(skyOuter.children[1].tag, 'nested-scroll-body')
const skyMain = skyOuter.children[1].children[0]
const webMain = webOuter.children[1]
assert.equal(skyMain.attrs['associative-container'], 'nested-scroll-view')
assert.equal(skyMain.children[0].tag, 'sticky-section')
assert.equal(skyMain.children[0].children[0].tag, 'sticky-header')
assert.equal(webMain.children[0].children[0].attrs.class, 'header webview-sticky')
const css = source.match(/<style>([\s\S]*?)<\/style>/)[1]
function declaration(selector, prop) {
  const rule = css.match(new RegExp('\\.' + selector + '\\s*\\{([^}]+)\\}'))
  assert(rule, 'Missing class rule ' + selector)
  const values = {}
  rule[1].split(';').forEach(part => {
    const colon = part.indexOf(':')
    if (colon >= 0) values[part.slice(0, colon).trim()] = part.slice(colon + 1).trim()
  })
  return values[prop]
}
const groupHeight = parseFloat(declaration('header', 'height')) + parseFloat(declaration('strip', 'height'))
const summaryHeight = parseFloat(declaration('summary', 'height'))
assert.equal(declaration('summary', 'box-sizing'), 'border-box')
assert.equal(declaration('header', 'background'), '#fff')
assert.equal(declaration('strip', 'display'), 'flex')
assert.equal(declaration('strip', 'flex-direction'), 'row')
assert.equal(declaration('tile', 'width'), '120px')
assert.equal(declaration('tile', 'flex-shrink'), '0')
assert.equal(declaration('fab', 'position'), 'fixed')
assert.equal(declaration('modal', 'position'), 'fixed')
assert(Number(declaration('modal', 'z-index')) > Number(declaration('fab', 'z-index')))
;['top', 'right', 'bottom', 'left'].forEach(side => assert.equal(declaration('modal', side), '0'))
assert.equal(declaration('webview-sticky', 'position'), 'sticky')
assert.equal(declaration('webview-sticky', 'top'), '0')
const report = []
function evalBinding(value, instance) { return vm.runInNewContext('(' + value.slice(2, -2) + ')', instance) }
function dispatch(node, eventName, instance, event) {
  const name = node.attrs['bind' + eventName] || node.attrs['catch' + eventName]
  assert(name, 'No actual binding for ' + eventName)
  return instance[name](event)
}
function unique(sections) {
  assert.equal(new Set(sections.map(group => group.id)).size, sections.length)
  const ids = sections.flatMap(group => group.items.map(order => order.id))
  assert.equal(new Set(ids).size, ids.length)
  sections.forEach(group => assert.equal(group.items.length, 8))
}
async function check(renderer, main, outer) {
  let options
  let failNextRefresh = false
  let windowHeight = 800
  const requests = []
  const toasts = []
  const fetchOrders = (page, shouldFail = false) => {
    if (page === 1 && failNextRefresh) { shouldFail = true; failNextRefresh = false }
    requests.push([page, shouldFail])
    return realFetch(page, shouldFail)
  }
  const wx = {
    getWindowInfo: () => ({ windowHeight, statusBarHeight: 24 }),
    getMenuButtonBoundingClientRect: () => ({ top: 28, height: 32 }),
    showToast: options => toasts.push(options.title)
  }
  vm.runInNewContext(script, { createPage: value => { options = value }, wx, fetchOrders })
  const instance = Object.assign({ renderer }, options.data)
  Object.entries(options.methods).forEach(([name, fn]) => { instance[name] = fn.bind(instance) })
  const enabled = () => evalBinding(main.attrs['refresher-enabled'], instance)
  assert(enabled())
  const initial = options.onLoad.call(instance)
  assert(instance.refreshing && enabled())
  await initial
  assert.equal(instance.sections.length, 4)
  assert.equal(instance.scrollHeight, 732)
  assert.equal(evalBinding(main.attrs['wx:style'], instance).height, '732px')
  assert.equal(evalBinding(outer.attrs['wx:style'], instance).height, '732px')
  assert(!instance.refreshing && !instance.loading && enabled())
  const initialGroups = Array.from(instance.sections)
  const initialOrders = initialGroups.map(group => group.items)
  const paging = dispatch(main, 'scrolltolower', instance)
  assert(instance.loading && !instance.refreshing && !enabled())
  await paging
  await dispatch(main, 'scrolltolower', instance)
  assert.equal(instance.pageNo, 3)
  assert.equal(instance.sections.length, 12)
  initialGroups.forEach((group, index) => {
    assert.equal(instance.sections[index], group)
    assert.equal(instance.sections[index].items, initialOrders[index])
  })
  unique(instance.sections)
  const old = instance.sections
  const refreshing = dispatch(main, 'refresherrefresh', instance)
  assert(instance.refreshing && enabled())
  await refreshing
  assert.notEqual(instance.sections, old)
  assert.equal(instance.sections.length, 4)
  assert.equal(instance.pageNo, 1)
  assert(!instance.refreshing && !instance.loading && enabled())
  await dispatch(main, 'scrolltolower', instance)
  const preserved = instance.sections
  failNextRefresh = true
  const failed = dispatch(main, 'refresherrefresh', instance)
  assert(instance.refreshing && enabled())
  await failed
  assert.equal(instance.sections, preserved)
  assert.equal(instance.pageNo, 2)
  assert(!instance.refreshing && !instance.loading && enabled())
  assert.equal(toasts[toasts.length - 1], '订单加载失败')
  await dispatch(main, 'scrolltolower', instance)
  assert.equal(instance.pageNo, 3)
  assert.equal(instance.sections.length, 12)
  dispatch(main, 'scroll', instance, { detail: { scrollTop: 186 } })
  assert.equal(instance.scrollTop, 186)
  const strip = main.children[0].children[1]
  dispatch(strip, 'scroll', instance, { detail: { scrollTop: 999 } })
  const requestCount = requests.length
  dispatch(strip, 'scrolltolower', instance)
  assert.equal(requests.length, requestCount)
  assert.equal(instance.scrollTop, 186)
  assert(!outer.attrs.bindscroll && !outer.attrs.catchscroll && !outer.attrs.bindscrolltolower && !outer.attrs.catchscrolltolower)
  const fab = pageNode.children.find(node => node.attrs.class === 'fab')
  const modal = pageNode.children.find(node => node.attrs.class === 'modal')
  dispatch(fab, 'tap', instance)
  assert(instance.opened)
  dispatch(modal, 'tap', instance)
  assert(!instance.opened)
  windowHeight = 600
  options.onResize.call(instance)
  assert.equal(instance.scrollHeight, 532)
  report.push({ renderer, status: 'passed', requests, refreshFailureViaActualBinding: true, retainedOriginalObjects: true, paginationGate: 'false only during pagination; true idle/refresh', mainScrollTop: instance.scrollTop, dimensions: { outerAndMainAtWindow800: 732, summary: summaryHeight, contentAt4Groups: 4 * groupHeight, contentAt8Groups: 8 * groupHeight, contentAt12Groups: 12 * groupHeight, outerContentHeight: 732 + summaryHeight, outerScrollRange: summaryHeight, resizedMainAtWindow600: 532 }, nativeRendering: 'not_run' })
}
async function run() {
  await check('skyline', skyMain, skyOuter)
  await check('webview', webMain, webOuter)
  console.log(JSON.stringify({ status: 'passed', evidenceType: 'independent template-bound VM and static geometry', checks: report }, null, 2))
}
run().catch(error => { console.error(error); process.exitCode = 1 })
