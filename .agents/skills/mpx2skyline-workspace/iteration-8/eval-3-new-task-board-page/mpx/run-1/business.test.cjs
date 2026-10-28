const fs = require('fs')
const path = require('path')
const { load, mount, base } = require('./harness.cjs')
let pageDef, ratingDef, segmentDef
beforeAll(async () => {
  pageDef = await load('pages/task-board.mpx', 'page')
  ratingDef = await load('components/rating-selector.mpx', 'component')
  segmentDef = await load('components/segmented-control.mpx', 'component')
})

function connect (page) {
  const rating = mount(ratingDef, page.attributes('rating-selector'))
  const segment = mount(segmentDef, page.attributes('segmented-control'))
  return { rating, segment }
}
function relay (page, child, selector) {
  const event = child.events[child.events.length - 1]
  page.fire(selector, 'change', {}, { detail: event.detail })
  child.update(page.attributes(selector))
}

test('all SFCs have four blocks; real page JSON registers both actual components; host preserves homepage', () => {
  const app = JSON.parse(fs.readFileSync(path.join(base, 'app.json')))
  const original = JSON.parse(fs.readFileSync(path.join(base, '../../input/app.json')))
  expect(app.pages).toEqual(['pages/home', 'pages/task-board'])
  expect(app.window).toEqual(original.window)
  expect(app.rendererOptions.webview).toEqual(original.rendererOptions.webview)
  expect(pageDef.json).toMatchObject({ renderer: 'skyline', componentFramework: 'glass-easel', navigationStyle: 'custom', disableScroll: true })
  Object.entries(pageDef.json.usingComponents).forEach(([tag, relative]) => {
    expect(fs.existsSync(path.resolve(base, 'pages', relative))).toBe(true)
    expect(pageDef.nodes.some(node => node.tag === tag)).toBe(true)
  })
  expect(ratingDef.json.component).toBe(true)
  expect(segmentDef.json.component).toBe(true)
  ;[pageDef, ratingDef, segmentDef].forEach(def => {
    expect(def.source).toMatch(/<template>/)
    expect(def.source).toMatch(/<style>/)
    expect(def.source).toMatch(/<script(?: setup)?>/)
    expect(def.source).toMatch(/<script type="application\/json">/)
  })
})

test('query initializes valid categories; invalid/missing/encoded-looking values fall back to 全部', () => {
  ;['全部', '工作', '生活', 'invalid', undefined, '%E7%94%9F%E6%B4%BB'].forEach(category => {
    const page = mount(pageDef, {}, { category })
    expect(page.state.category).toBe(['全部', '工作', '生活'].includes(category) ? category : '全部')
    expect(page.state.filteredTasks.length).toBe(category === '工作' ? 1 : category === '生活' ? 2 : 3)
    const { segment } = connect(page)
    expect(segment.state.currentValue).toBe(page.state.category)
    page.checkBindings()
  })
  const page = mount(pageDef)
  page.hooks.load({ category: '%E7%94%9F%E6%B4%BB' }, { category: '生活' })
  expect(page.state.category).toBe('生活')
  expect(page.state.filteredTasks.length).toBe(2)
})

test('initial tasks match contract, task taps toggle completion; empty-list binding is reachable', () => {
  const page = mount(pageDef)
  expect(page.state.tasks.map(task => [task.taskKey, task.title, task.category, task.completed])).toEqual([
    ['t1', '整理本周跨团队协作事项与上线验收清单', '工作', false],
    ['t2', '购买周末出行用品', '生活', false],
    ['t3', '完成每日阅读', '生活', true]
  ])
  page.fire('task-row', 'tap', { item: page.state.tasks[0] })
  expect(page.state.tasks[0].completed).toBe(true)
  page.fire('task-row', 'tap', { item: page.state.tasks[0] })
  expect(page.state.tasks[0].completed).toBe(false)
  page.state.tasks = []
  expect(page.state.filteredTasks).toEqual([])
  expect(pageDef.source).toMatch(/wx:if="{{!filteredTasks.length}}"[^>]*><text>暂无任务<\/text>/)
})

test('rating defaults, immediate local selection and exact public detail', () => {
  const rating = mount(ratingDef)
  expect(rating.attributes('rating-label')['max-lines']).toBe(1)
  expect(rating.state.ratingKey).toBe('')
  expect(rating.state.value).toBe(0)
  expect(rating.state.max).toBe(5)
  expect(rating.state.readonly).toBe(false)
  expect(rating.state.label).toBe('请评分')
  expect(rating.state.stars).toEqual([1, 2, 3, 4, 5])
  rating.fire('rating-star', 'tap', { item: 3 })
  expect(rating.state.currentValue).toBe(3)
  expect(rating.events).toEqual([{ name: 'change', detail: { ratingKey: '', value: 3 } }])
  rating.checkBindings()
})

test('rating parent value consecutive updates and readonly preserve score/event state', () => {
  const rating = mount(ratingDef, { ratingKey: 'test', value: 2, max: 7 })
  expect(rating.state.currentValue).toBe(2)
  expect(rating.state.stars.length).toBe(7)
  ;[4, 1, 0, 5].forEach(value => { rating.update({ value }); expect(rating.state.currentValue).toBe(value) })
  rating.update({ readonly: true })
  rating.fire('rating-star', 'touchstart', { item: 2 })
  rating.fire('rating-star', 'tap', { item: 2 })
  expect(rating.state.pressedStar).toBe(0)
  expect(rating.state.currentValue).toBe(5)
  expect(rating.events).toEqual([])
})

test('segmented defaults; null/empty/async arrays always produce safe list', () => {
  const segment = mount(segmentDef)
  expect(segment.props.controlKey).toBe('')
  expect(segment.props.value).toBe('')
  expect(segment.props.disabled).toBe(false)
  expect(segment.props.label).toBe('请选择')
  expect(segment.state.safeOptions).toEqual([])
  segment.checkBindings()
  ;[null, [], [{ label: '很长很长很长的候选文案', value: 'work' }], null].forEach(options => {
    segment.update({ options })
    expect(segment.state.safeOptions).toEqual(options || [])
    segment.checkBindings()
  })
})

test('segmented immediate selection/detail, parent consecutive updates and disabled guards', () => {
  const options = [{ label: 'A', value: 'a' }, { label: 'B', value: 'b', disabled: true }]
  const segment = mount(segmentDef, { controlKey: 'group', options, value: 'b' })
  segment.fire('segmented-option', 'tap', { item: options[0] })
  expect(segment.state.currentValue).toBe('a')
  expect(segment.events).toEqual([{ name: 'change', detail: { controlKey: 'group', value: 'a' } }])
  segment.update({ value: segment.events[0].detail.value })
  ;['b', 'a', '', 'b'].forEach(value => { segment.update({ value }); expect(segment.state.currentValue).toBe(value) })
  segment.fire('segmented-option', 'tap', { item: options[1] })
  segment.fire('segmented-option', 'touchstart', { item: options[1] })
  expect(segment.state.currentValue).toBe('b')
  expect(segment.state.pressedValue).toBe(null)
  segment.update({ disabled: true })
  segment.fire('segmented-option', 'tap', { item: options[0] })
  segment.fire('segmented-option', 'touchstart', { item: options[0] })
  expect(segment.state.currentValue).toBe('b')
  expect(segment.events.length).toBe(1)
  segment.checkBindings()
})

test('touch end/cancel restore state, each component instance is independent', () => {
  const option = { label: 'A', value: 'a' }
  ;[[ratingDef, 'rating-star', 2, 'pressedStar', 0], [segmentDef, 'segmented-option', option, 'pressedValue', null]].forEach(([def, selector, item, field, released]) => {
    const a = mount(def, selector === 'segmented-option' ? { options: [option] } : {})
    const b = mount(def, selector === 'segmented-option' ? { options: [option] } : {})
    a.fire(selector, 'touchstart', { item })
    expect(a.state[field]).toBe(selector === 'rating-star' ? 2 : 'a')
    expect(b.state[field]).toBe(released)
    a.fire(selector, 'touchcancel')
    expect(a.state[field]).toBe(released)
    a.fire(selector, 'touchstart', { item })
    a.fire(selector, 'touchend')
    expect(a.state[field]).toBe(released)
    expect(a.events).toEqual([])
    a.fire(selector, 'tap', { item })
    expect(b.state.currentValue).toBe(selector === 'rating-star' ? 0 : '')
    expect(b.events).toEqual([])
    expect(def.source).toMatch(/transition: transform 150ms ease, opacity 150ms ease/)
    expect(def.source).toMatch(/transform: scale\(0.96\); opacity: 0.7/)
  })
})

test('page actually passes keys/types/options and accepts both child change events', () => {
  const page = mount(pageDef)
  const { rating, segment } = connect(page)
  expect(rating.state.ratingKey).toBe('board')
  expect(rating.state.value).toBe(0)
  expect(rating.state.max).toBe(5)
  expect(rating.state.readonly).toBe(false)
  expect(segment.props.controlKey).toBe('category')
  segment.fire('segmented-option', 'tap', { item: segment.props.options[2] })
  relay(page, segment, 'segmented-control')
  expect(page.state.category).toBe('生活')
  expect(page.state.filteredTasks.length).toBe(2)
  rating.fire('rating-star', 'tap', { item: 4 })
  relay(page, rating, 'rating-selector')
  expect(page.state.rating).toBe(4)
  rating.update({ value: page.state.rating })
  expect(rating.state.currentValue).toBe(4)
  page.checkBindings()
})

test('continuous pagination appends 2 unique incomplete tasks of current category; all uses work', () => {
  const page = mount(pageDef)
  ;['全部', '工作', '生活', '生活'].forEach(category => {
    page.fire('segmented-control', 'change', {}, { detail: { controlKey: 'category', value: category } })
    const previous = page.state.tasks.slice()
    page.fire('board-scroll', 'scrolltolower')
    expect(page.state.tasks.length).toBe(previous.length + 2)
    expect(page.state.tasks.slice(0, previous.length)).toEqual(previous)
    page.state.tasks.slice(-2).forEach(task => {
      expect(task.category).toBe(category === '全部' ? '工作' : category)
      expect(task.completed).toBe(false)
    })
    expect(new Set(page.state.tasks.map(task => task.taskKey)).size).toBe(page.state.tasks.length)
  })
})

test('refresh success resets tasks/rating and finishes feedback; refresh failure preserves usable list/score', async () => {
  jest.useFakeTimers()
  try {
    const page = mount(pageDef, {}, { category: '生活' })
    const { rating } = connect(page)
    rating.fire('rating-star', 'tap', { item: 4 })
    relay(page, rating, 'rating-selector')
    page.fire('board-scroll', 'scrolltolower')
    const before = JSON.stringify(page.state.tasks)
    page.state.failNextRefresh()
    const failure = page.fire('board-scroll', 'refresherrefresh')
    expect(page.state.refreshing).toBe(true)
    page.fire('board-scroll', 'scrolltolower')
    page.fire('board-scroll', 'refresherrefresh')
    expect(JSON.stringify(page.state.tasks)).toBe(before)
    await jest.advanceTimersByTimeAsync(450)
    await failure
    expect(page.state.refreshing).toBe(false)
    expect(JSON.stringify(page.state.tasks)).toBe(before)
    expect(page.state.rating).toBe(4)
    expect(page.state.refreshMessage).toContain('刷新失败')
    page.fire('task-row', 'tap', { item: page.state.tasks[1] })
    expect(page.state.tasks[1].completed).toBe(true)
    const success = page.fire('board-scroll', 'refresherrefresh')
    await jest.advanceTimersByTimeAsync(450)
    await success
    expect(page.state.refreshing).toBe(false)
    expect(page.state.tasks.length).toBe(3)
    expect(page.state.tasks[1].completed).toBe(false)
    expect(page.state.rating).toBe(0)
    rating.update({ value: page.state.rating })
    expect(rating.state.currentValue).toBe(0)
    expect(page.state.refreshMessage).toBe('刷新成功')
    expect(page.state.category).toBe('生活')
    page.fire('board-scroll', 'scrolltolower')
    expect(new Set(page.state.tasks.map(task => task.taskKey)).size).toBe(5)
  } finally { jest.useRealTimers() }
})

test('viewport sizing responds to resize; navigation targets retained home', () => {
  const page = mount(pageDef)
  expect(page.state.windowHeight).toBe(640)
  expect(page.state.statusBarHeight).toBe(24)
  expect(page.state.navigationHeight).toBe(40)
  page.state.windowHeight = 0
  page.hooks.resize()
  expect(page.state.windowHeight).toBe(640)
  page.fire('board-back', 'tap')
  expect(page.apiCalls).toEqual([['reLaunch', { url: '/pages/home' }]])
  expect(pageDef.source).toMatch(/\.board-scroll-region \{ flex: 1; min-height: 0;/)
  expect(pageDef.source).toMatch(/\.board-scroll \{ width: 100%; height: 100%;/)
  expect(pageDef.source).toMatch(/\.board-top \{ flex-shrink: 0;/)
})
