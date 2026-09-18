const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const source = fs.readFileSync(path.join(__dirname, '../outputs/user-list.mpx'), 'utf8')
const row = fs.readFileSync(path.join(__dirname, '../outputs/row.wxml'), 'utf8')
function setup () {
  let options, interval, time = 0, cleared = 0
  const calls = []
  const node = { scrollTo: value => calls.push(['scrollTo', value.top]) }
  const query = {
    in (target) { calls.push(['in', target]); return this },
    select (selector) { calls.push(['select', selector]); return this },
    node () { return this },
    exec (callback) { callback([{ node }]) }
  }
  vm.runInNewContext(source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/import[^\n]*\n/, ''), {
    createComponent: value => { options = value },
    wx: { createSelectorQuery: () => query, navigateTo: value => calls.push(['navigateTo', value.url]) },
    Date: { now: () => time },
    setInterval: (fn, delay) => { interval = fn; calls.push(['interval', delay]); return 1 },
    clearInterval: () => { cleared++ }
  })
  const instance = Object.assign({}, options.data, options.methods)
  return { options, instance, calls, tick: value => { time = value; interval() }, cleared: () => cleared }
}
test('empty initialization, null, visible filtering and replacement', () => {
  const { options, instance } = setup()
  const visible = () => options.computed.visibleItems.call(instance)
  assert.equal(visible().length, 0)
  instance.setRows({ items: null })
  assert.equal(visible().length, 0)
  instance.setRows({ items: [{ id: 1, name: 'hidden', visible: false }, { id: 2, name: 'shown', visible: true }] })
  assert.equal(visible().length, 1)
  assert.equal(visible()[0].name, 'shown')
  instance.setRows({ items: [] })
  assert.equal(visible().length, 0)
  assert.equal(instance.config.default, 'keep')
  assert.equal(options.properties.payload.optionalTypes[0].name, 'Object')
})
test('external row gets explicit filtered item and index', () => {
  assert.match(source, /<import src=".\/row.wxml"/)
  assert.match(source, /wx:for="{{visibleItems}}"/)
  assert.match(source, /<template is="user-row" data="{{item, index}}"/)
  assert.match(row, /name="user-row"/)
  assert.match(row, /{{index}}:{{item.name}}/)
  assert.doesNotMatch(source, /<include/)
})
test('query is component scoped and scrolls actual users target', () => {
  const { instance, calls } = setup()
  instance.scrollTop()
  assert.equal(calls[0][1], instance)
  assert.deepEqual(calls.slice(1), [['select', '#users'], ['scrollTo', 0]])
  assert.match(source, /id="users"[^>]*enhanced="{{true}}"[^>]*scroll-y="{{true}}"/)
  assert.match(source, /id="other"/)
})
test('press, release and cancel share the same button state', () => {
  const { instance } = setup()
  instance.press(); assert.equal(instance.pressed, true)
  instance.release(); assert.equal(instance.pressed, false)
  instance.press(); instance.release(); assert.equal(instance.pressed, false)
  assert.match(source, /bindtouchend="release" bindtouchcancel="release"/)
  assert.match(source, /pressed \? 0.96 : 1/)
  assert.match(source, /pressed \? 0.7 : 1/)
  assert.match(source, /transition-duration: 150ms/)
})
test('both detail entries invoke the supported navigation method', () => {
  const { instance, calls } = setup()
  assert.equal((source.match(/bindtap="openDetail"/g) || []).length, 2)
  instance.openDetail(); instance.openDetail()
  assert.deepEqual(calls, [['navigateTo', '/pages/detail'], ['navigateTo', '/pages/detail']])
})
test('one second pulse period with lifecycle cleanup and no duplicate timer', () => {
  const { instance, options, calls, tick, cleared } = setup()
  instance.renderer = 'skyline'
  options.attached.call(instance)
  assert.equal(instance.isSkyline, true)
  assert.equal(instance.pulseOpacity, 0.3)
  tick(500); assert.ok(Math.abs(instance.pulseOpacity - 0.65) < 1e-9)
  tick(1000); assert.equal(instance.pulseOpacity, 0.3)
  options.pageLifetimes.show.call(instance)
  assert.equal(calls.filter(x => x[0] === 'interval').length, 1)
  options.pageLifetimes.hide.call(instance)
  assert.equal(cleared(), 1)
  options.detached.call(instance)
  assert.equal(instance._pulseTimer, null)
})
test('title owns icon and long label together; explicit dot has intended size', () => {
  assert.match(source, /<span[^>]*class="truncate skyline-title"><image[^>]*\/><text>{{label}}<\/text><\/span>/)
  assert.match(source, /<view wx:else class="truncate webview-title"><image[^>]*\/><text>{{label}}<\/text><\/view>/)
  assert.match(source, /max-lines: 1/)
  assert.match(source, /text-overflow: ellipsis/)
  assert.match(source, /width: 8px; height: 8px/)
  assert.match(source, /background-color: #f50/)
  assert.doesNotMatch(source, /::before|@keyframes|createAnimation/)
})
