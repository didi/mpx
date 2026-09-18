
import { ref, computed, onLoad, onResize } from '@mpxjs/core'

const categories = ['全部', '工作', '生活']
const initialTasks = [
  { taskKey: 't1', title: '整理本周跨团队协作事项与上线验收清单', category: '工作', completed: false },
  { taskKey: 't2', title: '购买周末出行用品', category: '生活', completed: false },
  { taskKey: 't3', title: '完成每日阅读', category: '生活', completed: true }
]
const cloneInitialTasks = () => initialTasks.map(task => Object.assign({}, task))
const tasks = ref(cloneInitialTasks())
const category = ref('全部')
const pressedCategory = ref('')
const refreshing = ref(false)
const refreshError = ref('')
const windowHeight = ref(600)
const statusBarHeight = ref(20)
const navigationHeight = ref(44)
const filteredTasks = computed(() => tasks.value.filter(task => category.value === '全部' || task.category === category.value))
let nextTaskId = 4
let failNextRefresh = false

onLoad((options) => {
  category.value = categories.includes(options.category) ? options.category : '全部'
  failNextRefresh = options.refreshFail === '1'
  const info = wx.getSystemInfoSync()
  const menu = wx.getMenuButtonBoundingClientRect()
  windowHeight.value = info.windowHeight
  statusBarHeight.value = info.statusBarHeight
  navigationHeight.value = (menu.top - info.statusBarHeight) * 2 + menu.height
})
onResize(({ size }) => {
  windowHeight.value = size.windowHeight
})
function selectCategory (event) {
  category.value = event.currentTarget.dataset.category
  releaseCategory()
}
function pressCategory (event) {
  pressedCategory.value = event.currentTarget.dataset.category
}
function releaseCategory () {
  pressedCategory.value = ''
}
function toggleTask (event) {
  const task = tasks.value.find(task => task.taskKey === event.currentTarget.dataset.key)
  if (task) task.completed = !task.completed
}
function requestTasks () {
  const shouldFail = failNextRefresh
  failNextRefresh = false
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) reject(new Error('刷新失败，请下拉重试'))
      else resolve(cloneInitialTasks())
    }, 400)
  })
}
async function onRefresh () {
  if (refreshing.value) return
  refreshing.value = true
  refreshError.value = ''
  try {
    tasks.value = await requestTasks()
  } catch (error) {
    refreshError.value = error.message
  } finally {
    refreshing.value = false
  }
}
function onLoadMore () {
  if (refreshing.value) return
  const targetCategory = category.value === '全部' ? '工作' : category.value
  const additions = [0, 1].map(() => {
    const taskKey = `t${nextTaskId++}`
    return { taskKey, title: `新增${targetCategory}任务 ${taskKey}`, category: targetCategory, completed: false }
  })
  tasks.value = tasks.value.concat(additions)
}
function goHome () {
  wx.navigateBack({ fail: () => wx.reLaunch({ url: '/pages/home' }) })
}
defineExpose({ categories, category, pressedCategory, filteredTasks, refreshing, refreshError, windowHeight, statusBarHeight, navigationHeight, selectCategory, pressCategory, releaseCategory, toggleTask, onRefresh, onLoadMore, goHome })
