import { ref, computed, onLoad, onResize, onUnmounted } from '@mpxjs/core'
import mpx from '@mpxjs/api-proxy'
import {createPage} from '@mpxjs/core'
createPage ({
 initData: { categoryOptions: [], category: '全部', rating: 0, refreshing: false, filteredTasks: [] },
  setup(__props, __context) {
 const useContext = () => { return __context }








































function initialTasks () {
  return [
    { taskKey: 't1', title: '整理本周跨团队协作事项与上线验收清单', category: '工作', completed: false },
    { taskKey: 't2', title: '购买周末出行用品', category: '生活', completed: false },
    { taskKey: 't3', title: '完成每日阅读', category: '生活', completed: true }
  ]
}
const categoryOptions = [
  { label: '全部', value: '全部' },
  { label: '工作', value: '工作' },
  { label: '生活', value: '生活' }
]
const tasks = ref(initialTasks())
const category = ref('全部')
const rating = ref(0)
const refreshing = ref(false)
const refreshMessage = ref('')
const windowHeight = ref(0)
const statusBarHeight = ref(0)
const navigationHeight = ref(44)
const navigationRight = ref(100)
const filteredTasks = computed(() => category.value === '全部'
  ? tasks.value
  : tasks.value.filter(task => task.category === category.value))
let nextTaskId = 4
let rejectNextRefresh = false
let refreshTimer

function updateWindow () {
  const info = mpx.getWindowInfo()
  const menu = mpx.getMenuButtonBoundingClientRect()
  windowHeight.value = info.windowHeight
  statusBarHeight.value = info.statusBarHeight
  navigationHeight.value = menu.height + (menu.top - info.statusBarHeight) * 2
  navigationRight.value = info.windowWidth - menu.left + 8
}
onLoad((query, decodedQuery = query) => {
  category.value = categoryOptions.some(option => option.value === decodedQuery.category) ? decodedQuery.category : '全部'
  updateWindow()
})
onResize(updateWindow)
onUnmounted(() => { clearTimeout(refreshTimer) })

function goBack () {
  if (getCurrentPages().length > 1) {
    mpx.navigateBack({ delta: 1 })
  } else {
    mpx.reLaunch({ url: '/pages/home' })
  }
}
function onCategoryChange (event) {
  category.value = event.detail.value
}
function onRatingChange (event) {
  rating.value = event.detail.value
}
function toggleTask (taskKey) {
  const task = tasks.value.find(task => task.taskKey === taskKey)
  if (task) task.completed = !task.completed
}
// Public test hook: page.failNextRefresh() rejects the next simulated request once.
function failNextRefresh () {
  rejectNextRefresh = true
}
async function onRefresh () {
  if (refreshing.value) return
  refreshing.value = true
  refreshMessage.value = '正在刷新…'
  const shouldFail = rejectNextRefresh
  rejectNextRefresh = false
  try {
    await new Promise((resolve, reject) => {
      refreshTimer = setTimeout(() => {
        if (shouldFail) reject(new Error('模拟刷新失败'))
        else resolve()
      }, 450)
    })
    tasks.value = initialTasks()
    rating.value = 0
    refreshMessage.value = '刷新成功'
  } catch (error) {
    refreshMessage.value = '刷新失败，现有任务仍可使用，请下拉重试'
  } finally {
    refreshing.value = false
  }
}
function onLoadMore () {
  if (refreshing.value) return
  const taskCategory = category.value === '全部' ? '工作' : category.value
  const additions = [0, 1].map(() => {
    const taskKey = 't' + nextTaskId++
    return { taskKey, title: taskCategory + '任务 ' + taskKey, category: taskCategory, completed: false }
  })
  tasks.value = tasks.value.concat(additions)
}


return {
  tasks, category, categoryOptions, rating, filteredTasks, refreshing, refreshMessage,
  windowHeight, statusBarHeight, navigationHeight, navigationRight,
  goBack, onCategoryChange, onRatingChange, toggleTask, onRefresh, onLoadMore, failNextRefresh
}
}

})
