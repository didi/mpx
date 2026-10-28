const fs = require('fs')
const path = require('path')
const vm = require('vm')
const babel = require('@babel/core')
const vue = require('vue')
const compileSetup = require('@mpxjs/webpack-plugin/lib/script-setup-compiler')
const output = path.resolve(__dirname, '../outputs')
const sources = {}

beforeAll(async () => {
  const compilation = JSON.parse(fs.readFileSync(path.join(__dirname, 'compile.json'), 'utf8'))
  expect(compilation.success).toBe(true)
  for (const [name, file] of Object.entries({
    page: 'pages/task-board.mpx', rating: 'components/rating-selector.mpx', segmented: 'components/segmented-control.mpx'
  })) {
    const text = fs.readFileSync(path.join(output, file), 'utf8')
    const block = text.match(/<script( setup)?>([\s\S]*?)<\/script>/)
    let script = block[2]
    if (block[1]) {
      script = await new Promise((resolve, reject) => {
        compileSetup.call({
          resource: file + '?ctorType=' + (name === 'page' ? 'page' : 'component'),
          resourcePath: path.join(output, file),
          async: () => (error, result) => error ? reject(error) : resolve(result)
        }, script)
      })
    }
    fs.writeFileSync(path.join(__dirname, name + '.transformed.js'), script)
    sources[name] = {
      script: babel.transformSync(script, { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code,
      template: text.match(/<template>([\s\S]*?)<\/template>/)[1],
      json: JSON.parse(text.match(/<script type="application\/json">([\s\S]*?)<\/script>/)[1])
    }
  }
})

function mount (name, values = {}, emit = () => {}) {
  const hooks = {}
  const events = []
  let definition
  let proxy
  const api = Object.assign({}, vue, {
    createComponent: options => { definition = options },
    createPage: options => { definition = options },
    getCurrentInstance: () => ({ proxy }),
    onLoad: callback => { hooks.load = callback },
    onResize: callback => { hooks.resize = callback },
    watch: (source, handler, options) => vue.watch(source, handler, Object.assign({}, options, { flush: 'sync' }))
  })
  const sandbox = {
    require: key => { if (key === '@mpxjs/core') return api; throw new Error(key) },
    exports: {}, setTimeout,
    wx: { getWindowInfo: () => ({ windowHeight: 640, statusBarHeight: 24 }), getMenuButtonBoundingClientRect: () => ({ top: 30, height: 32 }) }
  }
  vm.runInNewContext(sources[name].script, sandbox)
  const defaults = {}
  Object.entries(definition.properties || {}).forEach(([key, descriptor]) => { defaults[key] = descriptor.value })
  const props = vue.reactive(Object.assign({}, defaults, values))
  const state = vue.reactive(Object.assign({}, definition.data))
  let exposed = {}
  const methods = {}
  proxy = new Proxy({}, {
    get (_, key) {
      if (key === 'triggerEvent') return (type, detail) => { events.push({ type, detail }); emit(type, detail) }
      if (key in exposed) return vue.unref(exposed[key])
      if (key in state) return state[key]
      if (key in props) return props[key]
      return methods[key]
    },
    set (_, key, value) {
      if (vue.isRef(exposed[key])) exposed[key].value = value
      else if (key in props) props[key] = value
      else state[key] = value
      return true
    }
  })
  Object.entries(definition.methods || {}).forEach(([key, fn]) => { methods[key] = fn.bind(proxy) })
  Object.entries(definition.computed || {}).forEach(([key, fn]) => { exposed[key] = vue.computed(fn.bind(proxy)) })
  Object.entries(definition.watch || {}).forEach(([key, watcher]) => {
    const handler = typeof watcher === 'function' ? watcher : watcher.handler
    vue.watch(() => proxy[key], handler.bind(proxy), { immediate: !!watcher.immediate, flush: 'sync' })
  })
  if (definition.setup) exposed = definition.setup(props, {})
  // Verify every event handler in the real template is reachable on this instance.
  const handlers = Array.from(sources[name].template.matchAll(/bind[\w:]+="(\w+)"/g), match => match[1])
  handlers.forEach(handler => expect(typeof proxy[handler]).toBe('function'))
  return { name, proxy, props, events, hooks, definition, exposed }
}

function tag (component, node) {
  const pattern = new RegExp('<' + node + '(?=[\\s>])[^>]*>')
  const match = sources[component.name].template.match(pattern)
  if (!match) throw new Error('Missing template node: ' + node)
  return match[0]
}
function event (component, node, type, dataset = {}, detail = {}) {
  const handler = tag(component, node).match(new RegExp('bind' + type + '="(\\w+)"'))
  if (!handler) throw new Error('Missing binding: ' + type)
  return component.proxy[handler[1]]({ currentTarget: { dataset }, detail })
}
function itemEvent (component, className, type, dataset) {
  const node = sources[component.name].template.match(new RegExp('<view class="' + className + '"[^>]*>'))[0]
  const handler = node.match(new RegExp('bind' + type + '="(\\w+)"'))[1]
  return component.proxy[handler]({ currentTarget: { dataset } })
}
function linkedComponent (page, componentName, name) {
  const node = tag(page, componentName)
  const attrs = Array.from(node.matchAll(/([\w-]+)="([^"]*)"/g))
  const values = {}
  attrs.forEach(([, key, value]) => {
    if (key.startsWith('bind')) return
    const expression = value.match(/^{{([\s\S]*)}}$/)
    values[key] = expression ? vm.runInNewContext(expression[1], new Proxy({}, { has: () => true, get: (_, k) => page.proxy[k] })) : value
  })
  const child = mount(name, values, (type, detail) => event(page, componentName, type, {}, detail))
  child.sync = () => attrs.forEach(([, key, value]) => {
    const expression = value.match(/^{{([\s\S]*)}}$/)
    if (expression) child.props[key] = vm.runInNewContext(expression[1], new Proxy({}, { has: () => true, get: (_, k) => page.proxy[k] }))
  })
  return child
}

beforeEach(() => jest.useFakeTimers())
afterEach(() => jest.useRealTimers())

test('real compiler transform exposes all setup template methods and collection bindings', () => {
  const page = mount('page')
  const segmented = mount('segmented')
  expect(page.proxy.visibleTasks).toHaveLength(3)
  expect(segmented.proxy.safeOptions).toEqual([])
  for (const instance of [page, segmented]) {
    const names = Array.from(sources[instance.name].template.matchAll(/wx:for="{{(\w+)}}"/g), m => m[1])
    names.forEach(key => expect(Array.isArray(instance.proxy[key])).toBe(true))
  }
})
test.each(['全部', '工作', '生活', 'illegal', undefined])('query category %s initializes correct filter', input => {
  const page = mount('page')
  page.hooks.load({ category: input })
  const expected = ['全部', '工作', '生活'].includes(input) ? input : '全部'
  expect(page.proxy.category).toBe(expected)
  expect(page.proxy.visibleTasks).toHaveLength(expected === '工作' ? 1 : expected === '生活' ? 2 : 3)
})
test('task completion toggles twice via real card binding', () => {
  const page = mount('page')
  itemEvent(page, 'task-card', 'tap', { taskKey: 't1' })
  expect(page.proxy.visibleTasks[0].completed).toBe(true)
  itemEvent(page, 'task-card', 'tap', { taskKey: 't1' })
  expect(page.proxy.visibleTasks[0].completed).toBe(false)
})
test('empty result uses actual empty conditional', () => {
  const page = mount('page')
  event(page, 'segmented-control', 'change', {}, { controlKey: 'category', value: '空分类' })
  expect(page.proxy.visibleTasks).toEqual([])
  expect(sources.page.template).toContain('wx:if="{{visibleTasks.length === 0}}"')
  expect(sources.page.template).toContain('暂无任务')
})
test('refresh success resets tasks and rating, with concurrent refresh/load guarded', async () => {
  const page = mount('page')
  event(page, 'rating-selector', 'change', {}, { ratingKey: 'board', value: 4 })
  event(page, 'scroll-view', 'scrolltolower')
  itemEvent(page, 'task-card', 'tap', { taskKey: 't1' })
  const pending = event(page, 'scroll-view', 'refresherrefresh')
  expect(page.proxy.refreshing).toBe(true)
  event(page, 'scroll-view', 'scrolltolower')
  expect(page.proxy.visibleTasks).toHaveLength(5)
  await event(page, 'scroll-view', 'refresherrefresh')
  await jest.runAllTimersAsync()
  await pending
  expect(page.proxy.visibleTasks).toHaveLength(3)
  expect(page.proxy.visibleTasks[0].completed).toBe(false)
  expect(page.proxy.rating).toBe(0)
  expect(page.proxy.refreshing).toBe(false)
})
test('injected failure preserves list/rating, ends feedback, permits toggle/page/retry', async () => {
  const page = mount('page')
  page.hooks.load({ category: '生活', refreshFail: '1' })
  event(page, 'rating-selector', 'change', {}, { ratingKey: 'board', value: 3 })
  const before = JSON.stringify(page.proxy.visibleTasks)
  const pending = event(page, 'scroll-view', 'refresherrefresh')
  await jest.runAllTimersAsync()
  await pending
  expect(JSON.stringify(page.proxy.visibleTasks)).toBe(before)
  expect(page.proxy.rating).toBe(3)
  expect(page.proxy.refreshing).toBe(false)
  expect(page.proxy.refreshMessage).toContain('失败')
  itemEvent(page, 'task-card', 'tap', { taskKey: 't2' })
  expect(page.proxy.visibleTasks[0].completed).toBe(true)
  event(page, 'scroll-view', 'scrolltolower')
  expect(page.proxy.visibleTasks).toHaveLength(4)
  const retry = event(page, 'scroll-view', 'refresherrefresh')
  await jest.runAllTimersAsync()
  await retry
  expect(page.proxy.rating).toBe(0)
  expect(page.proxy.category).toBe('生活')
})
test.each(['全部', '工作', '生活'])('continuous pagination preserves tasks and unique keys: %s', category => {
  const page = mount('page')
  page.hooks.load({ category })
  const original = page.proxy.visibleTasks.slice()
  event(page, 'scroll-view', 'scrolltolower')
  event(page, 'scroll-view', 'scrolltolower')
  expect(page.proxy.visibleTasks).toHaveLength(original.length + 4)
  expect(page.proxy.visibleTasks.slice(0, original.length)).toEqual(original)
  const added = page.proxy.visibleTasks.slice(original.length)
  expect(new Set(page.proxy.visibleTasks.map(t => t.taskKey)).size).toBe(original.length + 4)
  added.forEach(t => { expect(t.completed).toBe(false); expect(t.category).toBe(category === '全部' ? '工作' : category) })
})
test('rating defaults and public parent value updates', () => {
  const rating = mount('rating')
  expect(rating.proxy.ratingKey).toBe('')
  expect(rating.proxy.max).toBe(5)
  expect(rating.proxy.readonly).toBe(false)
  expect(rating.proxy.label).toBe('请评分')
  expect(rating.proxy.currentValue).toBe(0)
  expect(rating.proxy.stars).toHaveLength(5)
  ;[4, 1, 5, 0].forEach(value => { rating.props.value = value; expect(rating.proxy.currentValue).toBe(value) })
  rating.props.max = 3
  expect(rating.proxy.stars).toHaveLength(3)
})
test('rating immediate change detail and readonly prevents both events and press', () => {
  const rating = mount('rating', { ratingKey: 'demo' })
  itemEvent(rating, 'rating-star', 'tap', { score: 3 })
  expect(rating.proxy.currentValue).toBe(3)
  expect(rating.events).toEqual([{ type: 'change', detail: { ratingKey: 'demo', value: 3 } }])
  rating.props.readonly = true
  itemEvent(rating, 'rating-star', 'tap', { score: 5 })
  itemEvent(rating, 'rating-star', 'touchstart', { score: 5 })
  expect(rating.proxy.currentValue).toBe(3)
  expect(rating.proxy.pressedScore).toBe(0)
  expect(rating.events).toHaveLength(1)
  rating.props.value = 2
  expect(rating.proxy.currentValue).toBe(2)
})
test.each(['rating', 'segmented'])('%s touchend/cancel and instance isolation use template bindings', name => {
  const values = name === 'segmented' ? { options: [{ label: 'A', value: 'a' }] } : {}
  const a = mount(name, values)
  const b = mount(name, values)
  const className = name === 'rating' ? 'rating-star' : 'segmented-option'
  const dataset = name === 'rating' ? { score: 2 } : { index: 0 }
  const stateKey = name === 'rating' ? 'pressedScore' : 'pressedIndex'
  const neutral = name === 'rating' ? 0 : -1
  itemEvent(a, className, 'touchstart', dataset)
  expect(a.proxy[stateKey]).toBe(name === 'rating' ? 2 : 0)
  expect(b.proxy[stateKey]).toBe(neutral)
  itemEvent(a, className, 'touchcancel', dataset)
  expect(a.proxy[stateKey]).toBe(neutral)
  expect(a.events).toHaveLength(0)
  itemEvent(a, className, 'touchstart', dataset)
  itemEvent(a, className, 'touchend', dataset)
  expect(a.proxy[stateKey]).toBe(neutral)
  itemEvent(a, className, 'tap', dataset)
  expect(b.events).toHaveLength(0)
  expect(name === 'rating' ? b.proxy.currentValue : b.proxy.selectedValue).toBe(name === 'rating' ? 0 : '')
})
test('segmented defaults/null/array transitions and continuous parent updates', () => {
  const segmented = mount('segmented')
  expect(segmented.proxy.controlKey).toBe('')
  expect(segmented.proxy.value).toBe('')
  expect(segmented.proxy.disabled).toBe(false)
  expect(segmented.proxy.label).toBe('请选择')
  expect(segmented.proxy.safeOptions).toEqual([])
  segmented.props.options = null
  expect(segmented.proxy.safeOptions).toEqual([])
  segmented.props.options = [{ label: 'A', value: 'a' }]
  expect(segmented.proxy.safeOptions).toHaveLength(1)
  ;['a', 'b', '', 'a'].forEach(value => { segmented.props.value = value; expect(segmented.proxy.selectedValue).toBe(value) })
  expect(mount('segmented', { options: null }).proxy.safeOptions).toEqual([])
})
test('segmented immediate detail, disabled states and replacement clears press', () => {
  const component = mount('segmented', { controlKey: 'demo', options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b', disabled: true }] })
  itemEvent(component, 'segmented-option', 'tap', { index: 0 })
  expect(component.proxy.selectedValue).toBe('a')
  expect(component.events).toEqual([{ type: 'change', detail: { controlKey: 'demo', value: 'a' } }])
  itemEvent(component, 'segmented-option', 'tap', { index: 1 })
  itemEvent(component, 'segmented-option', 'touchstart', { index: 1 })
  expect(component.proxy.pressedIndex).toBe(-1)
  component.props.disabled = true
  itemEvent(component, 'segmented-option', 'tap', { index: 0 })
  itemEvent(component, 'segmented-option', 'touchstart', { index: 0 })
  expect(component.proxy.pressedIndex).toBe(-1)
  expect(component.events).toHaveLength(1)
  expect(component.proxy.selectedValue).toBe('a')
  component.props.disabled = false
  itemEvent(component, 'segmented-option', 'touchstart', { index: 0 })
  component.props.options = null
  expect(component.proxy.pressedIndex).toBe(-1)
})
test('actual page registrations, props and two-way event chain', async () => {
  const page = mount('page')
  page.hooks.load({ category: '生活' })
  expect(sources.page.json.usingComponents).toEqual({ 'rating-selector': '../components/rating-selector.mpx', 'segmented-control': '../components/segmented-control.mpx' })
  expect(sources.rating.json.component).toBe(true)
  expect(sources.segmented.json.component).toBe(true)
  const segmented = linkedComponent(page, 'segmented-control', 'segmented')
  const rating = linkedComponent(page, 'rating-selector', 'rating')
  expect(segmented.proxy.selectedValue).toBe('生活')
  expect(segmented.proxy.safeOptions).toHaveLength(3)
  expect(rating.proxy.ratingKey).toBe('board')
  itemEvent(segmented, 'segmented-option', 'tap', { index: 1 })
  segmented.sync()
  expect(page.proxy.category).toBe('工作')
  expect(page.proxy.visibleTasks).toHaveLength(1)
  itemEvent(rating, 'rating-star', 'tap', { score: 4 })
  rating.sync()
  expect(page.proxy.rating).toBe(4)
  expect(rating.proxy.currentValue).toBe(4)
  const pending = event(page, 'scroll-view', 'refresherrefresh')
  await jest.runAllTimersAsync()
  await pending
  rating.sync()
  expect(rating.proxy.currentValue).toBe(0)
})
test('resize updates viewport bound to the root', () => {
  const page = mount('page')
  page.hooks.resize({ size: { windowHeight: 520, windowWidth: 320 } })
  expect(page.proxy.windowHeight).toBe(520)
  expect(sources.page.template).toContain("height: windowHeight + 'px'")
})
