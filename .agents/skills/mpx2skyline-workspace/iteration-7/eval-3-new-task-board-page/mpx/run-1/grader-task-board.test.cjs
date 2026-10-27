const fs = require('fs')
const path = require('path')
const vm = require('vm')
const vue = require('vue')
const babel = require('@babel/core')
const parseSfc = require('@mpxjs/webpack-plugin/lib/parser')
const compileSetup = require('@mpxjs/webpack-plugin/lib/script-setup-compiler')
const { parseDocument } = require('htmlparser2')

const output = path.resolve(__dirname, '../outputs')
const cases = {}

function elements (root) {
  return (root.children || []).flatMap(node => node.type === 'tag' ? [node].concat(elements(node)) : [])
}
async function load (file, type) {
  const filename = path.join(output, file)
  const sfc = parseSfc(fs.readFileSync(filename, 'utf8'), { filePath: filename, mode: 'wx' })
  let script = sfc.script.content
  if (sfc.script.attrs.setup) {
    script = await new Promise((resolve, reject) => {
      compileSetup.call({
        resource: filename + '?ctorType=' + type,
        resourcePath: filename,
        async: () => (error, content) => error ? reject(error) : resolve(content)
      }, script)
    })
  }
  const code = babel.transformSync(script, { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code
  return { code, nodes: elements(parseDocument(sfc.template.content, { xmlMode: true })), json: JSON.parse(sfc.json.content) }
}
function mount (definition, initial = {}, emit = () => {}) {
  let options
  const hooks = {}
  const events = []
  const scope = vue.effectScope()
  // Mpx 宏由真实编译器处理；宿主注册、生命周期与事件使用 mock，响应式使用 Vue 2.7。
  const core = Object.assign({}, vue, {
    createPage: value => { options = value },
    createComponent: value => { options = value },
    onLoad: handler => { hooks.load = handler }
  })
  vm.runInNewContext(definition.code, {
    require: name => { if (name !== '@mpxjs/core') throw new Error(name); return core },
    setTimeout: (...args) => setTimeout(...args),
    exports: {}
  })
  const values = {}
  Object.entries(options.properties || {}).forEach(([key, descriptor]) => {
    values[key] = Array.isArray(descriptor.value) ? descriptor.value.slice() : descriptor.value
  })
  const props = vue.reactive(Object.assign(values, initial))
  const state = vue.reactive(Object.assign({}, options.data))
  const instance = {}
  const expose = (key, get, set) => Object.defineProperty(instance, key, { enumerable: true, configurable: true, get, set })
  Object.keys(props).forEach(key => expose(key, () => props[key], value => { props[key] = value }))
  Object.keys(state).forEach(key => expose(key, () => state[key], value => { state[key] = value }))
  instance.triggerEvent = (name, detail) => {
    events.push({ name, detail })
    emit(name, { detail })
  }
  scope.run(() => {
    Object.entries(options.methods || {}).forEach(([key, method]) => { instance[key] = method.bind(instance) })
    Object.entries(options.computed || {}).forEach(([key, method]) => {
      const value = vue.computed(() => method.call(instance))
      expose(key, () => value.value)
    })
    Object.entries(options.watch || {}).forEach(([key, config]) => {
      const handler = typeof config === 'function' ? config : config.handler
      vue.watch(() => instance[key], handler.bind(instance), typeof config === 'function' ? {} : config)
    })
    if (options.setup) {
      const bindings = options.setup(props, { triggerEvent: instance.triggerEvent })
      Object.entries(bindings).forEach(([key, value]) => {
        expose(key, () => vue.unref(value), next => { if (vue.isRef(value)) value.value = next })
      })
    }
  })
  const node = selector => {
    const found = definition.nodes.find(item => item.name === selector || (item.attribs.class || '').split(' ').includes(selector))
    if (!found) throw new Error('未找到实际模板节点：' + selector)
    return found
  }
  const evaluate = (expression, locals) => vm.runInNewContext('(' + expression + ')', Object.assign({}, instance, locals))
  const attr = (selector, key, locals = {}) => {
    const raw = node(selector).attribs[key]
    if (raw === undefined) throw new Error('未找到实际模板属性：' + key)
    return raw.startsWith('{{') ? evaluate(raw.slice(2, -2), locals) : raw
  }
  const dispatch = (selector, event, locals = {}) => {
    const expression = node(selector).attribs['bind' + event]
    if (!expression) throw new Error('未找到实际模板事件：' + event)
    if (/^[a-zA-Z]+$/.test(expression)) {
      if (typeof instance[expression] !== 'function') throw new Error('未暴露处理器：' + expression)
      return instance[expression](locals.$event)
    }
    return evaluate(expression, locals)
  }
  return { instance, props, events, hooks, node, attr, dispatch, unmount: () => scope.stop() }
}
function componentProps (page, selector) {
  const result = {}
  Object.keys(page.node(selector).attribs).filter(key => !key.startsWith('bind')).forEach(key => { result[key] = page.attr(selector, key) })
  return result
}
function page (query = {}) {
  const mounted = mount(cases.page)
  mounted.hooks.load(query, query)
  return mounted
}
const options = [{ label: '全部', value: '全部' }, { label: '工作', value: '工作' }, { label: '生活', value: '生活', disabled: true }]

beforeAll(async () => {
  cases.page = await load('pages/task-board.mpx', 'page')
  cases.rating = await load('components/rating-selector.mpx', 'component')
  cases.segmented = await load('components/segmented-control.mpx', 'component')
  const evidence = Object.fromEntries(Object.entries(cases).map(([key, value]) => [key, {
    json: value.json,
    bindings: value.nodes.filter(node => Object.keys(node.attribs).some(attr => attr.startsWith('bind'))).map(node => ({ tag: node.name, class: node.attribs.class, attributes: node.attribs }))
  }]))
  fs.writeFileSync(path.join(__dirname, 'grader-template-bindings.json'), JSON.stringify(evidence, null, 2) + '\n')
})
afterEach(() => { jest.useRealTimers() })

test('页面参数初始化、非法回退、筛选与任务完成状态', () => {
  const all = page()
  expect(all.instance.filteredTasks.map(task => task.taskKey)).toEqual(['t1', 't2', 't3'])
  expect(page({ category: '工作' }).instance.filteredTasks).toHaveLength(1)
  expect(page({ category: '生活' }).instance.filteredTasks).toHaveLength(2)
  expect(page({ category: '无效' }).instance.category).toBe('全部')
  all.dispatch('task-row', 'tap', { item: all.instance.filteredTasks[0] })
  expect(all.instance.filteredTasks[0].completed).toBe(true)
  all.dispatch('segmented-control', 'change', { $event: { detail: { controlKey: 'category', value: '工作' } } })
  expect(all.instance.filteredTasks).toHaveLength(1)
  expect(all.instance.filteredTasks[0].completed).toBe(true)
  all.dispatch('task-row', 'tap', { item: all.instance.filteredTasks[0] })
  expect(all.instance.filteredTasks[0].completed).toBe(false)
})

test('页面实际注册、传参、组件 change 回写及父级连续更新', async () => {
  const board = page({ category: '生活' })
  expect(cases.page.json.usingComponents).toEqual({
    'rating-selector': '../components/rating-selector.mpx',
    'segmented-control': '../components/segmented-control.mpx'
  })
  const segment = mount(cases.segmented, componentProps(board, 'segmented-control'), (name, event) => board.dispatch('segmented-control', name, { $event: event }))
  const rating = mount(cases.rating, componentProps(board, 'rating-selector'), (name, event) => board.dispatch('rating-selector', name, { $event: event }))
  expect(segment.instance.selectedValue).toBe('生活')
  expect(rating.instance.currentValue).toBe(0)
  expect(rating.props.max).toBe(5)
  expect(rating.props.readonly).toBe(false)
  segment.dispatch('segmented-option', 'tap', { item: board.instance.categoryOptions[1] })
  expect(segment.events[0]).toEqual({ name: 'change', detail: { controlKey: 'category', value: '工作' } })
  expect(board.instance.category).toBe('工作')
  expect(board.instance.filteredTasks).toHaveLength(1)
  rating.dispatch('rating-star', 'tap', { item: 4 })
  expect(rating.events[0]).toEqual({ name: 'change', detail: { ratingKey: 'board', value: 4 } })
  expect(board.instance.rating).toBe(4)
  for (const value of [1, 5, 2, 0]) {
    rating.props.value = value
    await vue.nextTick()
    expect(rating.instance.currentValue).toBe(value)
  }
  for (const value of ['全部', '生活', '工作', '']) {
    segment.props.value = value
    await vue.nextTick()
    expect(segment.instance.selectedValue).toBe(value)
  }
})

test('rating 默认值、自主选择、readonly、touchend/cancel 与实例隔离', async () => {
  const first = mount(cases.rating)
  const second = mount(cases.rating)
  expect(cases.rating.json.component).toBe(true)
  expect(first.props).toMatchObject({ ratingKey: '', value: 0, max: 5, readonly: false, label: '请评分' })
  expect(first.instance.stars).toEqual([1, 2, 3, 4, 5])
  first.dispatch('rating-star', 'touchstart', { item: 3 })
  expect(first.attr('rating-star', 'wx:class', { item: 3 })['rating-star-pressed']).toBe(true)
  expect(second.instance.pressedStar).toBe(0)
  first.dispatch('rating-star', 'touchcancel')
  expect(first.instance.pressedStar).toBe(0)
  expect(first.events).toHaveLength(0)
  first.dispatch('rating-star', 'touchstart', { item: 2 })
  first.dispatch('rating-star', 'touchend')
  first.dispatch('rating-star', 'tap', { item: 2 })
  expect(first.instance.currentValue).toBe(2)
  expect(first.instance.pressedStar).toBe(0)
  expect(second.instance.currentValue).toBe(0)
  first.props.readonly = true
  await vue.nextTick()
  first.dispatch('rating-star', 'touchstart', { item: 5 })
  first.dispatch('rating-star', 'tap', { item: 5 })
  expect(first.instance.currentValue).toBe(2)
  expect(first.instance.pressedStar).toBe(0)
  expect(first.events).toHaveLength(1)
  first.props.value = 4
  await vue.nextTick()
  expect(first.instance.currentValue).toBe(4)
  first.props.max = 3
  expect(first.instance.stars).toEqual([1, 2, 3])
})

test('segmented 默认属性、初始化/空/null/异步数组与父级更新', async () => {
  const segment = mount(cases.segmented)
  expect(cases.segmented.json.component).toBe(true)
  expect(segment.props).toMatchObject({ controlKey: '', value: '', disabled: false, label: '请选择', options: [] })
  expect(segment.instance.safeOptions).toEqual([])
  segment.props.options = null
  await vue.nextTick()
  expect(segment.instance.safeOptions).toEqual([])
  segment.props.options = options
  await vue.nextTick()
  expect(segment.instance.safeOptions).toHaveLength(3)
  segment.props.options = []
  expect(segment.instance.safeOptions).toEqual([])
  const initialNull = mount(cases.segmented, { options: null })
  expect(initialNull.instance.safeOptions).toEqual([])
})

test('segmented 整体/单项禁用、触摸取消、选中态与两实例隔离', async () => {
  const first = mount(cases.segmented, { options, value: '全部', controlKey: 'first' })
  const second = mount(cases.segmented, { options, value: '工作', controlKey: 'second' })
  first.dispatch('segmented-option', 'touchstart', { item: options[1], index: 1 })
  expect(first.attr('segmented-option', 'wx:class', { item: options[1], index: 1 })['segmented-option-pressed']).toBe(true)
  expect(second.instance.pressedIndex).toBe(-1)
  first.dispatch('segmented-option', 'touchcancel')
  expect(first.instance.pressedIndex).toBe(-1)
  expect(first.events).toHaveLength(0)
  first.dispatch('segmented-option', 'touchstart', { item: options[1], index: 1 })
  first.dispatch('segmented-option', 'touchend')
  first.dispatch('segmented-option', 'tap', { item: options[1] })
  expect(first.instance.selectedValue).toBe('工作')
  expect(first.attr('segmented-option', 'wx:class', { item: options[1], index: 1 })['segmented-option-selected']).toBe(true)
  first.dispatch('segmented-option', 'touchstart', { item: options[2], index: 2 })
  first.dispatch('segmented-option', 'tap', { item: options[2] })
  expect(first.instance.selectedValue).toBe('工作')
  expect(first.instance.pressedIndex).toBe(-1)
  first.props.disabled = true
  await vue.nextTick()
  first.dispatch('segmented-option', 'touchstart', { item: options[0], index: 0 })
  first.dispatch('segmented-option', 'tap', { item: options[0] })
  expect(first.instance.selectedValue).toBe('工作')
  expect(first.instance.pressedIndex).toBe(-1)
  expect(first.events).toHaveLength(1)
  second.dispatch('segmented-option', 'tap', { item: options[0] })
  expect(second.events[0].detail).toEqual({ controlKey: 'second', value: '全部' })
  expect(first.instance.selectedValue).toBe('工作')
})

test('刷新成功恢复初始数据、评分归零、结束反馈、抑制重入', async () => {
  jest.useFakeTimers()
  const board = page({ category: '工作' })
  const rating = mount(cases.rating, componentProps(board, 'rating-selector'), (name, event) => board.dispatch('rating-selector', name, { $event: event }))
  rating.dispatch('rating-star', 'tap', { item: 5 })
  rating.props.value = board.instance.rating
  await vue.nextTick()
  board.dispatch('task-row', 'tap', { item: board.instance.filteredTasks[0] })
  board.dispatch('board-list', 'scrolltolower')
  const pending = board.dispatch('board-list', 'refresherrefresh')
  expect(board.attr('board-list', 'refresher-triggered')).toBe(true)
  board.dispatch('board-list', 'scrolltolower')
  await board.dispatch('board-list', 'refresherrefresh')
  expect(jest.getTimerCount()).toBe(1)
  jest.runAllTimers()
  await pending
  expect(board.attr('board-list', 'refresher-triggered')).toBe(false)
  expect(board.instance.filteredTasks).toHaveLength(1)
  expect(board.instance.filteredTasks[0].completed).toBe(false)
  expect(board.instance.rating).toBe(0)
  expect(board.instance.category).toBe('工作')
  rating.props.value = board.instance.rating
  await vue.nextTick()
  expect(rating.instance.currentValue).toBe(0)
})

test('注入刷新失败保留列表/评分且可继续操作，下一次成功', async () => {
  jest.useFakeTimers()
  const board = page()
  board.dispatch('rating-selector', 'change', { $event: { detail: { ratingKey: 'board', value: 3 } } })
  board.dispatch('task-row', 'tap', { item: board.instance.filteredTasks[0] })
  board.dispatch('board-list', 'scrolltolower')
  const snapshot = JSON.stringify(board.instance.filteredTasks)
  board.instance.injectRefreshFailure()
  const failed = board.dispatch('board-list', 'refresherrefresh')
  jest.runAllTimers()
  await failed
  expect(JSON.stringify(board.instance.filteredTasks)).toBe(snapshot)
  expect(board.instance.rating).toBe(3)
  expect(board.instance.refreshing).toBe(false)
  expect(board.instance.feedback).toContain('失败')
  board.dispatch('task-row', 'tap', { item: board.instance.filteredTasks[0] })
  expect(board.instance.filteredTasks[0].completed).toBe(false)
  board.dispatch('board-list', 'scrolltolower')
  expect(board.instance.filteredTasks).toHaveLength(7)
  const success = board.dispatch('board-list', 'refresherrefresh')
  jest.runAllTimers()
  await success
  expect(board.instance.filteredTasks).toHaveLength(3)
  expect(board.instance.rating).toBe(0)
})

test('刷新参数失败入口与连续分页保留旧项、类别正确、key 始终唯一', async () => {
  jest.useFakeTimers()
  const board = page({ refreshFail: '1' })
  const failed = board.dispatch('board-list', 'refresherrefresh')
  jest.runAllTimers()
  await failed
  expect(board.instance.feedback).toContain('失败')
  const seen = new Set(['t1', 't2', 't3'])
  for (const category of ['全部', '工作', '生活', '全部']) {
    board.dispatch('segmented-control', 'change', { $event: { detail: { controlKey: 'category', value: category } } })
    const oldKeys = board.instance.filteredTasks.map(task => task.taskKey)
    board.dispatch('board-list', 'scrolltolower')
    const result = board.instance.filteredTasks
    expect(result.map(task => task.taskKey).slice(0, -2)).toEqual(oldKeys)
    result.slice(-2).forEach(task => {
      expect(task.category).toBe(category === '全部' ? '工作' : category)
      expect(task.completed).toBe(false)
      expect(seen.has(task.taskKey)).toBe(false)
      seen.add(task.taskKey)
    })
  }
})

test('通过公开方法构造无匹配列表，实际 wx:if 空态成立', () => {
  const board = page()
  // 数据源不暴露给 UI；使用已暴露选择值构造所有合法类别均有任务之外的空集。
  board.instance.category = '测试空分类'
  expect(board.instance.filteredTasks).toEqual([])
  expect(board.attr('board-empty', 'wx:if')).toBe(true)
})

test('双 renderer 静态配置、滚动边界、文本省略及过渡声明', () => {
  const host = JSON.parse(fs.readFileSync(path.join(output, 'app.json'), 'utf8'))
  const inputHost = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../input/app.json'), 'utf8'))
  expect(host.pages).toEqual(['pages/home', 'pages/task-board'])
  expect(host.window).toEqual(inputHost.window)
  expect(host.rendererOptions.webview).toEqual(inputHost.rendererOptions.webview)
  expect(host.lazyCodeLoading).toBe('requiredComponents')
  expect(Object.values(host.rendererOptions.skyline)).toEqual([true, true, 'legacy', true, 'legacy'])
  expect(cases.page.json).toMatchObject({ renderer: 'skyline', componentFramework: 'glass-easel', navigationStyle: 'custom', disableScroll: true })
  const board = page()
  expect(board.attr('board-list', 'type')).toBe('list')
  expect(board.attr('board-list', 'refresher-enabled')).toBe(true)
  expect(board.node('task-row').parent).toBe(board.node('board-list'))
  for (const [file, selectors] of [
    ['pages/task-board.mpx', ['task-title', 'board-feedback']],
    ['components/rating-selector.mpx', ['rating-label']],
    ['components/segmented-control.mpx', ['segmented-label', 'segmented-option-label']]
  ]) {
    const source = fs.readFileSync(path.join(output, file), 'utf8')
    selectors.forEach(selector => {
      const definition = file.startsWith('pages') ? cases.page : file.includes('rating') ? cases.rating : cases.segmented
      const text = definition.nodes.find(node => (node.attribs.class || '').split(' ').includes(selector))
      expect(text.name).toBe('text')
      expect(text.attribs['max-lines']).toBe('{{1}}')
      expect(text.attribs.overflow).toBe('ellipsis')
    })
    expect(source).toContain('text-overflow: ellipsis')
    if (file.startsWith('components')) {
      expect(source).toContain('transition: transform 150ms ease, opacity 150ms ease')
      expect(source).toContain('transform: scale(0.96); opacity: 0.7')
    }
  }
})
