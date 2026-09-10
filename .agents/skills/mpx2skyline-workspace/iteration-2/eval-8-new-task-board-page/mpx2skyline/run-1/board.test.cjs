const fs = require('fs')
const vm = require('vm')
const path = require('path')
const source = fs.readFileSync(path.join(__dirname, '../outputs/pages/task-board.mpx'), 'utf8')
function setup () {
  let exposed
  const script = source.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/import[^\n]+\n/, '')
  vm.runInNewContext(script, {
    ref: value => ({ value }),
    computed: getter => ({ get value () { return getter() } }),
    nextTick: () => Promise.resolve(),
    defineExpose: value => { exposed = value },
    wx: { getWindowInfo: () => ({ statusBarHeight: 24 }), getMenuButtonBoundingClientRect: () => ({ top: 32, height: 32 }) }
  })
  return exposed
}
const event = dataset => ({ currentTarget: { dataset } })
test('filters, task toggle and empty state data', () => {
  const page = setup()
  expect(page.visibleTasks.value.map(item => item.id)).toEqual([1, 2])
  page.changeFilter(event({ filter: 'todo' }))
  expect(page.visibleTasks.value.map(item => item.id)).toEqual([1])
  page.toggleTask(event({ id: '1' }))
  expect(page.visibleTasks.value).toHaveLength(0)
  page.changeFilter(event({ filter: 'done' }))
  expect(page.visibleTasks.value.map(item => item.id)).toEqual([1, 2])
})
test('refresh restores seed objects and resets refresher; appended IDs stay unique', async () => {
  const page = setup()
  page.toggleTask(event({ id: 1 }))
  page.loadMore()
  const promise = page.refreshTasks()
  expect(page.refreshing.value).toBe(true)
  await promise
  expect(page.refreshing.value).toBe(false)
  expect(page.visibleTasks.value.map(item => [item.id, item.done])).toEqual([[1, false], [2, true]])
  page.loadMore()
  page.loadMore()
  expect(page.visibleTasks.value.map(item => item.id)).toEqual([1, 2, 4, 5])
  expect(page.visibleTasks.value.slice(2).every(item => !item.done)).toBe(true)
})
