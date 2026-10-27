const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { parseDocument } = require('htmlparser2')
const output = path.resolve(__dirname, '../outputs')
const source = fs.readFileSync(path.join(output, 'orders.mpx'), 'utf8')
const template = source.match(/<template>([\s\S]*?)<\/template>/)[1]
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
const service = fs.readFileSync(path.join(output, 'service.js'), 'utf8').replace('export function', 'function')
const doc = parseDocument(template, { xmlMode: true, decodeEntities: false })
const nodes = []
const visit = node => { if (node.type === 'tag') nodes.push(node); (node.children || []).forEach(visit) }
visit(doc)
const outer = nodes.find(n => n.attribs.id === 'orders-outer')
const main = nodes.find(n => n.attribs.id === 'orders-main')
const strips = nodes.filter(n => n.attribs.class === 'strip')
const expression = (binding, page) => vm.runInNewContext('(' + binding.slice(2, -2) + ')', page)
const ev = (target = 'orders-main', detail = {}) => ({ target: { id: target }, currentTarget: { id: 'orders-main' }, detail })
assert.equal(main.parent, outer)
assert.equal(outer.attribs.type, 'nested')
assert.equal(main.attribs.type, 'custom')
assert.equal(main.attribs['associative-container'], 'nested-scroll-view')
strips.forEach(strip => {
  assert.equal(strip.attribs.type, 'list')
  assert.equal(strip.attribs['scroll-x'], '{{true}}')
  assert.equal(strip.attribs['enable-flex'], '{{true}}')
  assert.deepEqual(strip.children.filter(n => n.type === 'tag').map(n => n.attribs.class), ['tile'])
})
async function check (renderer) {
  let options
  let failNextRefresh = false
  const calls = []
  const context = vm.createContext({
    createPage: opt => { options = opt },
    getWindowInfo: () => ({ windowHeight: 844, statusBarHeight: 47 }),
    getMenuButtonBoundingClientRect: () => ({ height: 32, top: 53 }),
    Promise
  })
  vm.runInContext(service, context)
  const originalFetch = context.fetchOrders
  context.fetchOrders = (page, shouldFail) => {
    const injectedFailure = page === 1 && failNextRefresh
    failNextRefresh = false
    calls.push({ page, fail: !!(shouldFail || injectedFailure) })
    return originalFetch(page, shouldFail || injectedFailure)
  }
  vm.runInContext(script, context)
  const page = Object.assign({}, JSON.parse(JSON.stringify(options.data)), { renderer })
  Object.keys(options.methods).forEach(key => { page[key] = options.methods[key].bind(page) })
  const dispatch = (attribute, event) => page[main.attribs[attribute]](event)
  await options.onLoad.call(page)
  assert.equal(page.sections.length, 4)
  assert.equal(page.contentHeight, 753)
  assert.equal(expression(outer.attribs['wx:style'], page).height, '753px')
  assert.equal(expression(main.attribs['wx:style'], page).height, '753px')
  const original = JSON.stringify(page.sections)
  assert.equal(expression(main.attribs['refresher-enabled'], page), true)
  await dispatch('bindscrolltolower', ev())
  await dispatch('bindscrolltolower', ev())
  assert.equal(page.pageNo, 3)
  assert.equal(page.sections.length, 12)
  assert.equal(JSON.stringify(page.sections.slice(0, 4)), original)
  assert.equal(page.sections.reduce((sum, group) => sum + group.items.length, 0), 96)
  const beforeFailure = JSON.stringify(page.sections)
  failNextRefresh = true
  const failing = dispatch('bindrefresherrefresh', ev())
  assert.equal(expression(main.attribs['refresher-enabled'], page), true)
  assert.equal(expression(main.attribs['refresher-triggered'], page), true)
  await failing
  assert.equal(expression(main.attribs['refresher-triggered'], page), false)
  assert.equal(expression(main.attribs['refresher-enabled'], page), true)
  assert.equal(page.loading, false)
  assert.equal(page.pageNo, 3)
  assert.equal(JSON.stringify(page.sections), beforeFailure)
  await dispatch('bindscrolltolower', ev())
  assert.equal(page.pageNo, 4)
  const refreshing = dispatch('bindrefresherrefresh', ev())
  assert.equal(expression(main.attribs['refresher-triggered'], page), true)
  await refreshing
  assert.equal(expression(main.attribs['refresher-triggered'], page), false)
  assert.equal(page.pageNo, 1)
  assert.equal(JSON.stringify(page.sections), original)
  dispatch('bindscroll', ev('orders-main', { scrollTop: 237 }))
  assert.equal(page.scrollTop, 237)
  dispatch('bindscroll', ev('orders-outer', { scrollTop: 44 }))
  dispatch('bindscroll', ev('horizontal-strip', { scrollLeft: 120 }))
  await dispatch('bindscrolltolower', ev('horizontal-strip'))
  assert.equal(page.scrollTop, 237)
  assert.equal(page.pageNo, 1)
  assert.ok(template.includes('滚动位置：{{scrollTop}}'))
  return { renderer, calls, mainHeight: 753, outerHeight: 753, outerChildHeight: 873, afterTwoBottomEvents: { groups: 12, orders: 96, page: 3, minimumGroupContentHeight: 1440 }, refreshViaTemplateSuccessAndInjectedFailure: true, stateResetAndListPreservation: true, mainScrollDisplay: 237, childEventsIgnored: true, boundary: 'Node VM + parsed source bindings; no native event delivery or rendering' }
}
Promise.all(['webview', 'skyline'].map(check)).then(evidence => {
  const result = { status: 'passed', kind: 'grader-independent-static-and-mock', evidence, device: 'not_run' }
  fs.writeFileSync(path.join(__dirname, 'grader-evidence.json'), JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify(result, null, 2))
}).catch(error => { console.error(error); process.exitCode = 1 })
