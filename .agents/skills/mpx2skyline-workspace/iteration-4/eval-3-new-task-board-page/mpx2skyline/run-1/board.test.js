const fs = require('fs')
const path = require('path')
const vm = require('vm')
const source = fs.readFileSync(path.join(__dirname, '../outputs/pages/task-board.mpx'), 'utf8')
const script = source.match(/<script setup>([\s\S]*?)<\/script>/)[1]
function mount (query = {}) {
  let exposed
  let load
  let resize
  const context = {
    ref: value => ({ value }),
    computed: getter => ({ get value () { return getter() } }),
    onLoad: fn => { load = fn },
    onResize: fn => { resize = fn },
    defineExpose: obj => { exposed = obj },
    setTimeout,
    wx: { getSystemInfoSync: () => ({ windowHeight: 640, statusBarHeight: 24 }), getMenuButtonBoundingClientRect: () => ({ top: 30, height: 32 }), navigateBack: jest.fn(), reLaunch: jest.fn() }
  }
  vm.createContext(context)
  vm.runInContext(script.replace(/import[^\n]+\n/, '') + '\nthis.setTasks = value => { tasks.value = value }', context)
  load(query)
  return { state: exposed, setTasks: context.setTasks, resize, wx: context.wx }
}
const event = value => ({ currentTarget: { dataset: value } })
test('category query, invalid fallback, count and category selection', () => {
  const { state } = mount({ category: '生活' })
  expect(state.filteredTasks.value).toHaveLength(2)
  state.selectCategory(event({ category: '工作' }))
  expect(state.filteredTasks.value).toHaveLength(1)
  expect(mount({ category: 'invalid' }).state.filteredTasks.value).toHaveLength(3)
})
test('toggle completion preserves unrelated rows; empty result', () => {
  const { state, setTasks } = mount()
  state.toggleTask(event({ key: 't1' }))
  expect(state.filteredTasks.value.map(task => task.completed)).toEqual([true, false, true])
  state.toggleTask(event({ key: 't1' }))
  expect(state.filteredTasks.value[0].completed).toBe(false)
  setTasks([])
  expect(state.filteredTasks.value).toHaveLength(0)
  expect(source).toContain('暂无任务')
})
test('refresh success, duplicate refresh guard, feedback and pagination guard', async () => {
  jest.useFakeTimers()
  const { state } = mount()
  state.onLoadMore()
  const refresh = state.onRefresh()
  expect(state.refreshing.value).toBe(true)
  state.onLoadMore()
  await state.onRefresh()
  expect(state.filteredTasks.value).toHaveLength(5)
  jest.runAllTimers()
  await refresh
  expect(state.filteredTasks.value).toHaveLength(3)
  expect(state.refreshing.value).toBe(false)
  jest.useRealTimers()
})
test('injected refresh failure preserves tasks; retry succeeds', async () => {
  jest.useFakeTimers()
  const { state } = mount({ refreshFail: '1' })
  state.toggleTask(event({ key: 't1' }))
  const previous = state.filteredTasks.value
  const failure = state.onRefresh()
  jest.runAllTimers()
  await failure
  expect(state.filteredTasks.value).toEqual(previous)
  expect(state.refreshing.value).toBe(false)
  expect(state.refreshError.value).toContain('刷新失败')
  state.toggleTask(event({ key: 't1' }))
  const retry = state.onRefresh()
  jest.runAllTimers()
  await retry
  expect(state.refreshError.value).toBe('')
  expect(state.filteredTasks.value).toHaveLength(3)
  jest.useRealTimers()
})
test('consecutive pagination, current category, retained tasks and unique keys after refresh', async () => {
  jest.useFakeTimers()
  const { state } = mount()
  state.onLoadMore()
  state.onLoadMore()
  expect(state.filteredTasks.value).toHaveLength(7)
  expect(state.filteredTasks.value.slice(3).every(task => task.category === '工作' && !task.completed)).toBe(true)
  state.selectCategory(event({ category: '生活' }))
  state.onLoadMore()
  expect(state.filteredTasks.value).toHaveLength(4)
  state.selectCategory(event({ category: '全部' }))
  const keys = state.filteredTasks.value.map(task => task.taskKey)
  expect(new Set(keys).size).toBe(9)
  expect(keys.slice(0, 3)).toEqual(['t1', 't2', 't3'])
  const refresh = state.onRefresh()
  jest.runAllTimers()
  await refresh
  state.onLoadMore()
  expect(state.filteredTasks.value[3].taskKey).toBe('t10')
  jest.useRealTimers()
})
test('press, end and cancellation reset; explicit bounded viewport resizes', () => {
  const { state, resize } = mount()
  state.pressCategory(event({ category: '生活' }))
  expect(state.pressedCategory.value).toBe('生活')
  state.releaseCategory()
  expect(state.pressedCategory.value).toBe('')
  expect(source).toContain('bindtouchcancel="releaseCategory"')
  expect(source).toContain('bindtouchend="releaseCategory"')
  expect(source).toContain('transition: transform 150ms, opacity 150ms')
  resize({ size: { windowHeight: 480 } })
  expect(state.windowHeight.value).toBe(480)
})
test('configuration, direct list children, navigation, truncation and expose contract', () => {
  const app = JSON.parse(fs.readFileSync(path.join(__dirname, '../outputs/app.json')))
  const config = JSON.parse(source.match(/<script type="application\/json">([\s\S]*?)<\/script>/)[1])
  expect(app.pages).toEqual(['pages/home', 'pages/task-board'])
  expect(app.window).toEqual({ navigationBarTitleText: '演示' })
  expect(app.rendererOptions.webview).toEqual({})
  expect(app.rendererOptions.skyline.defaultDisplayBlock).toBe(true)
  expect(app.rendererOptions.skyline.defaultContentBox).toBe(true)
  expect(app.lazyCodeLoading).toBe('requiredComponents')
  expect(config).toMatchObject({ renderer: 'skyline', componentFramework: 'glass-easel', navigationStyle: 'custom', disableScroll: true })
  expect(source).toMatch(/<scroll-view[^>]+type="list"[^>]*>\s*<view wx:for="{{filteredTasks}}" wx:key="taskKey"/)
  expect(source).toContain('class="task-title" max-lines="{{1}}" overflow="ellipsis">{{item.title}}</text>')
  expect(source).toContain('text-overflow: ellipsis')
  expect(source).not.toMatch(/overflow-(x|y)|position:\s*sticky|wx\.createAnimation|onPullDownRefresh|onReachBottom/)
  const { state } = mount()
  ;['filteredTasks', 'onRefresh', 'onLoadMore', 'releaseCategory'].forEach(key => expect(state[key]).toBeDefined())
})
