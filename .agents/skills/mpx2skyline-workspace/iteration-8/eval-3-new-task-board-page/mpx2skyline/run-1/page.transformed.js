import { ref, computed, onLoad, onResize } from '@mpxjs/core'
import {createPage} from '@mpxjs/core'
createPage ({
 initData: { visibleTasks: [], categoryOptions: [], category: '全部', rating: 0, refreshing: false },
  setup(__props, __context) {
 const useContext = () => { return __context }





const categoryOptions = [
  { label: '全部', value: '全部' },
  { label: '工作', value: '工作' },
  { label: '生活', value: '生活' }
]
const createInitialTasks = () => [
  { taskKey: 't1', title: '整理本周跨团队协作事项与上线验收清单', category: '工作', completed: false },
  { taskKey: 't2', title: '购买周末出行用品', category: '生活', completed: false },
  { taskKey: 't3', title: '完成每日阅读', category: '生活', completed: true }
]
const category = ref('全部')
const tasks = ref(createInitialTasks())
const rating = ref(0)
const refreshing = ref(false)
const refreshMessage = ref('')
const windowInfo = wx.getWindowInfo()
const menuRect = wx.getMenuButtonBoundingClientRect()
const windowHeight = ref(windowInfo.windowHeight)
const statusBarHeight = windowInfo.statusBarHeight
const navigationHeight = Math.max(44, (menuRect.top - statusBarHeight) * 2 + menuRect.height)
const visibleTasks = computed(() => tasks.value.filter(task => category.value === '全部' || task.category === category.value))
let taskSequence = 0
let failNextRefresh = false

onLoad((query) => {
  category.value = categoryOptions.some(option => option.value === query.category) ? query.category : '全部'
  // Test entry: /pages/task-board?refreshFail=1 fails the next refresh once.
  failNextRefresh = query.refreshFail === '1'
})
onResize(({ size }) => {
  windowHeight.value = size.windowHeight
})

function onCategoryChange (event) {
  if (event.detail.controlKey === 'category') category.value = event.detail.value
}
function onRatingChange (event) {
  if (event.detail.ratingKey === 'board') rating.value = event.detail.value
}
function onToggleTask (event) {
  tasks.value = tasks.value.map(task => task.taskKey === event.currentTarget.dataset.taskKey
    ? Object.assign({}, task, { completed: !task.completed })
    : task)
}
function requestInitialTasks () {
  const shouldFail = failNextRefresh
  failNextRefresh = false
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) reject(new Error('模拟刷新失败'))
      else resolve(createInitialTasks())
    }, 300)
  })
}
async function onRefresh () {
  if (refreshing.value) return
  refreshing.value = true
  refreshMessage.value = '正在刷新…'
  try {
    tasks.value = await requestInitialTasks()
    rating.value = 0
    refreshMessage.value = '刷新成功'
  } catch (error) {
    refreshMessage.value = '刷新失败，请下拉重试；当前任务已保留'
  } finally {
    refreshing.value = false
  }
}
function onLoadMore () {
  if (refreshing.value) return
  const nextCategory = category.value === '全部' ? '工作' : category.value
  const additions = [1, 2].map(() => {
    taskSequence += 1
    return { taskKey: 'extra-' + taskSequence, title: nextCategory + '追加任务 ' + taskSequence, category: nextCategory, completed: false }
  })
  tasks.value = tasks.value.concat(additions)
}


return {
  categoryOptions, category, rating, visibleTasks, refreshing, refreshMessage,
  windowHeight, statusBarHeight, navigationHeight,
  onCategoryChange, onRatingChange, onToggleTask, onRefresh, onLoadMore
}
}

})
