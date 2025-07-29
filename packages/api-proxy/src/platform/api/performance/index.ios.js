import { InteractionManager } from 'react-native'
import { getFocusedNavigation } from '../../../common/js'

// 全局观察者列表
const globalObservers = []

// 创建 EntryList 对象的工厂函数
function createEntryList (entries) {
  return {
    getEntries: () => entries,
    getEntriesByName: (name) => entries.filter(entry => entry.name === name),
    getEntriesByType: (entryType) => entries.filter(entry => entry.entryType === entryType)
  }
}

// 主性能类
class Performance {
  constructor () {
    this.entries = []
    this.bufferSize = 100 // 默认缓冲区大小
    // 自动初始化性能收集
    this.initPerformanceCollection()
  }

  // 创建性能观察者
  createObserver (callback) {
    const observer = {
      callback,
      entryTypes: [],
      observe (options) {
        this.entryTypes = options.entryTypes || []
      },
      disconnect () {
        // 从全局观察者列表中移除当前观察者
        const index = globalObservers.indexOf(observer)
        if (index > -1) {
          globalObservers.splice(index, 1)
        }
      }
    }
    globalObservers.push(observer)
    return observer
  }

  // 获取所有性能条目
  getEntries () {
    return createEntryList(this.entries)
  }

  // 根据名称获取性能条目
  getEntriesByName (name) {
    const filteredEntries = this.entries.filter(entry => entry.name === name)
    return createEntryList(filteredEntries)
  }

  // 根据类型获取性能条目
  getEntriesByType (entryType) {
    const filteredEntries = this.entries.filter(entry => entry.entryType === entryType)
    return createEntryList(filteredEntries)
  }

  // 设置缓冲区大小
  setBufferSize (size) {
    this.bufferSize = size
    if (this.entries.length > size) {
      this.entries = this.entries.slice(-size)
    }
  }

  // 添加性能条目
  addEntry (entry) {
    this.entries.push(entry)

    // 检查缓冲区大小
    if (this.entries.length > this.bufferSize) {
      this.entries = this.entries.slice(-this.bufferSize)
    }

    // 通知观察者
    globalObservers.forEach(observer => {
      if (observer.entryTypes && observer.entryTypes.includes(entry.entryType)) {
        observer.callback(createEntryList([entry]))
      }
    })
  }

  // 创建性能条目
  createEntry (name, entryType, startTime, duration, additionalData = {}) {
    return {
      name,
      entryType,
      startTime,
      duration,
      ...additionalData
    }
  }

  // 初始化性能收集（内部方法）
  initPerformanceCollection () {
    // 记录应用启动时间
    this.appLaunchStartTime = Date.now()

    // 延迟初始化，等待应用完全启动
    setTimeout(() => {
      this.setupAppLaunchCollection()
      this.setupRouteCollection()
    }, 0)
  }

  // 设置应用启动性能收集（内部方法）
  setupAppLaunchCollection () {
    InteractionManager.runAfterInteractions(() => {
      const appLaunchEndTime = Date.now()
      const duration = appLaunchEndTime - this.appLaunchStartTime

      const entry = this.createEntry(
        'appLaunch',
        'navigation',
        this.appLaunchStartTime,
        duration
      )
      this.addEntry(entry)
    })
  }

  // 设置路由性能收集（内部方法）
  setupRouteCollection () {
    // 定期检查导航实例是否可用
    const checkNavigation = () => {
      const navigation = getFocusedNavigation()
      if (navigation && !this.routeCollectionSetup) {
        this.routeCollectionSetup = true
        this.collectRoutePerformance(navigation)
      } else if (!navigation) {
        // 如果导航实例不可用，继续检查
        setTimeout(checkNavigation, 100)
      }
    }
    checkNavigation()
  }

  // 收集路由性能（内部方法）
  collectRoutePerformance (navigation) {
    let routeStartTime = Date.now()

    // 监听路由变化
    navigation.addListener('state', (e) => {
      const routeEndTime = Date.now()
      const duration = routeEndTime - routeStartTime

      const entry = this.createEntry(
        'route',
        'navigation',
        routeStartTime,
        duration,
        { routeName: e.data.state.routes[e.data.state.index]?.name }
      )
      this.addEntry(entry)

      // 为下次路由变化重置开始时间
      routeStartTime = Date.now()
    })
  }
}

// 全局性能实例
let globalPerformanceInstance = null

// 主 API 实现 - 返回性能实例（用户只能调用这个）
function getPerformance () {
  if (!globalPerformanceInstance) {
    globalPerformanceInstance = new Performance()
  }
  return globalPerformanceInstance
}

// 只导出用户需要的 API
export {
  getPerformance
}
