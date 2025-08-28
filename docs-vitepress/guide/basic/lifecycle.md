# Mpx 生命周期详解

Mpx 作为跨端小程序框架，提供了一套统一的生命周期系统，抹平不同小程序平台生命周期的差异。本文详细介绍 Mpx 中的各种生命周期钩子及其使用方法。

## 生命周期概述

Mpx 的生命周期体系包含以下几个层面：

- **组件生命周期**：组件实例的创建、挂载、更新、销毁过程
- **页面生命周期**：页面的加载、显示、隐藏、卸载过程  
- **应用生命周期**：应用的启动、显示、隐藏、错误处理等
- **SSR 生命周期**：服务端渲染特有的生命周期钩子

## 生命周期体系概览

Mpx 提供了两套生命周期使用方式：

- **选项式 API**：使用原生小程序生命周期或框架内置生命周期常量
- **组合式 API**：使用统一的 Vue 风格生命周期钩子

### 生命周期对应关系

| 框架内置生命周期 | 选项式 API 用法 | 组合式 API 钩子 | 微信原生生命周期 |
|:--------------|:-------------|:-------------|:-------------|
| BEFORECREATE | created/attached | - (setup 中编写） | attached|
| CREATED | created/attached  | - (setup 中编写） | attached |
| BEFOREMOUNT | 页面：onReady <br>组件：ready | onBeforeMount | 页面：onReady <br>组件：ready |
| MOUNTED | 页面：onReady <br>组件：ready | onMounted | 页面：onReady <br>组件：ready |
| BEFOREUPDATE | - | onBeforeUpdate | - |
| UPDATED | - | onUpdated | - |
| BEFOREUNMOUNT |  页面：onUnload <br> 组件：detached | onBeforeUnmount |  页面：onUnload <br> 组件：detached|
| UNMOUNTED |  页面：onUnload <br> 组件：detached | onUnmounted |  页面：onUnload <br> 组件：detached|
| ONLOAD | onLoad | onLoad | onLoad |
| ONSHOW | onShow | onShow | onShow |
| ONHIDE | onHide | onHide | onHide |
| ONRESIZE | onResize | onResize | onResize |

> **说明**：
> - 选项式 API 主要使用原生小程序生命周期（如 `attached`、`ready`、`detached`）
> - 也可以使用框架内置生命周期常量（如 `[CREATED]() {}`、`[MOUNTED]() {}` ）来保持跨平台一致性
> - 组合式 API 提供了统一的 Vue 风格生命周期钩子

## Options 语法（选项式 API）

选项式 API 支持两种生命周期写法：
1. **原生小程序生命周期**：直接使用各平台的原生生命周期名称
2. **框架内置生命周期常量**：使用统一的框架内置生命周期常量

> **重要**：选项式 API **没有** `mounted`、`beforeUnmount` 等 Vue 风格的生命周期名称，只能使用原生小程序生命周期或框架内置生命周期常量。

### 组件生命周期

**原生小程序生命周期：**
- `created` - 组件实例刚被创建时执行，此时不能调用 setData
- `attached` - 组件实例进入页面节点树时执行
- `ready` - 组件在视图层布局完成后执行
- `detached` - 组件实例被从页面节点树移除时执行
- `pageShow` - 组件所在页面显示时执行（等同于 pageLifetimes.show）
- `pageHide` - 组件所在页面隐藏时执行（等同于 pageLifetimes.hide）

**示例：**
```js
import { createComponent } from '@mpxjs/core'

createComponent({
  data: {
    message: 'Hello Mpx'
  },
  
  // 微信小程序原生组件生命周期
  created() {
    console.log('组件实例刚被创建')
    // 此时不能调用 setData，通常用于给组件 this 添加一些自定义属性字段
  },
  
  attached() {
    console.log('组件实例进入页面节点树时')
    // 可以访问 data，相当于 Vue 的 created + mounted
    console.log(this.data.message) // 'Hello Mpx'
  },
  
  ready() {
    console.log('组件在视图层布局完成后')
    // 可以访问 DOM 元素，类似 Vue 的 mounted
  },
  
  detached() {
    console.log('组件实例被从页面节点树移除时')
    // 清理定时器、事件监听器等，类似 Vue 的 beforeUnmount
  },
  
  // 在组件中监听页面生命周期
  pageShow() {
    console.log('组件所在页面被展示时')
  },
  
  pageHide() {
    console.log('组件所在页面被隐藏时')
  }
})
```
**组件生命周期常量：**
- `BEFORECREATE` - 实例初始化之后，数据观测之前
- `CREATED` - 实例创建完成，数据观测已完成
- `BEFOREMOUNT` - 挂载开始之前被调用
- `MOUNTED` - 实例被挂载后调用
- `BEFOREUPDATE` - 数据更新时调用，发生在视图更新之前
- `UPDATED` - 数据更新导致的重新渲染和更新完毕之后被调用
- `BEFOREUNMOUNT` - 实例销毁之前调用
- `UNMOUNTED` - 实例销毁后调用

**示例：**

```js
import { createComponent, CREATED, MOUNTED, BEFOREUNMOUNT } from '@mpxjs/core'

createComponent({
  data: {
    timer: null
  },
  
  [CREATED]() {
    console.log('组件创建完成 - 映射到 attached/onInit')
    // 初始化数据
  },
  
  [MOUNTED]() {
    console.log('组件挂载完成 - 映射到 ready/didMount')
    // 启动定时器
    this.timer = setInterval(() => {
      console.log('定时任务执行')
    }, 1000)
  },
  
  [BEFOREUNMOUNT]() {
    console.log('组件即将销毁 - 映射到 detached/didUnmount')
    // 清理定时器
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
})
```

### 页面生命周期

- `onLoad` - 页面加载时触发，只会调用一次
- `onReady` - 页面初次渲染完成时触发，只会调用一次
- `onShow` - 页面显示/切入前台时触发
- `onHide` - 页面隐藏/切入后台时触发
- `onUnload` - 页面卸载时触发
- `onResize` - 监听页面尺寸变化

**示例：**
```js
import { createPage, ONLOAD, ONSHOW, ONHIDE } from '@mpxjs/core'

createPage({
  data: {
    userInfo: null
  },
  
  // 使用原生页面生命周期
  onLoad(options) {
    console.log('页面加载', options)
    // 获取页面参数，初始化数据
  },
  
  onShow() {
    console.log('页面显示')
    // 页面显示时的逻辑
  },
  
  onHide() {
    console.log('页面隐藏')
    // 页面隐藏时的逻辑
  },
  
  onReady() {
    console.log('页面初次渲染完成')
    // 可以进行 DOM 操作
  },
  
  onUnload() {
    console.log('页面卸载')
    // 清理资源
  },
})
```

**页面生命周期常量：**
- `ONLOAD` - 页面加载
- `ONSHOW` - 页面显示
- `ONHIDE` - 页面隐藏
- `ONRESIZE` - 页面尺寸变化

**示例：**
```js
import { createPage, ONLOAD, ONSHOW, ONHIDE, ONRESIZE } from '@mpxjs/core'

createPage({
  data: {
    userInfo: null
  },
  
  // 使用框架内置生命周期常量
  [ONLOAD](options) {
    console.log('使用内置常量 - 页面加载', options)
    // 获取页面参数，初始化数据
  },
  
  [ONSHOW]() {
    console.log('使用内置常量 - 页面显示')
    // 页面显示时的逻辑
  },
  
  [ONHIDE]() {
    console.log('使用内置常量 - 页面隐藏')
    // 页面隐藏时的逻辑
  },
  
  [ONRESIZE](res) {
    console.log('使用内置常量 - 页面尺寸变化', res)
    // 处理页面尺寸变化
  }
})
```

### 应用生命周期

应用生命周期用于 App 实例：

**原生应用生命周期：**
- `onLaunch` - 应用初始化完成时触发，全局只触发一次
- `onShow` - 应用启动，或从后台进入前台显示时触发
- `onHide` - 应用从前台进入后台时触发
- `onError` - 应用发生脚本错误或 API 调用报错时触发

**示例：**
```js
import { createApp } from '@mpxjs/core'

createApp({
  // 应用生命周期
  onLaunch(options) {
    console.log('应用启动', options)
    // 应用初始化
  },
  
  onShow(options) {
    console.log('应用显示', options)
    // 应用从后台进入前台显示
  },
  
  onHide() {
    console.log('应用隐藏')
    // 应用从前台进入后台
  },
  
  onError(error) {
    console.log('应用错误', error)
    // 应用发生脚本错误或 API 调用报错时触发
  }
})
```

**注意：** 应用生命周期暂不支持框架内置生命周期常量，只能使用原生小程序应用生命周期。

## Setup 语法（组合式 API）

组合式 API 使用统一的 Vue 风格生命周期钩子，所有平台都使用相同的 API。

> **优势**：组合式 API 的生命周期钩子在所有平台上都保持一致，无需考虑平台差异。

### 组件生命周期

```js
import { 
  createComponent, 
  onBeforeMount,
  onMounted, 
  onBeforeUpdate,
  onUpdated, 
  onBeforeUnmount,
  onUnmounted
} from '@mpxjs/core'

createComponent({
  setup() {
    console.log('setup 执行 - 相当于 beforeCreate + created')
    
    // 组件挂载前
    onBeforeMount(() => {
      console.log('组件即将挂载')
    })
    
    // 组件挂载后
    onMounted(() => {
      console.log('组件已挂载')
      // 可以访问 DOM 元素和 refs
    })
    
    // 数据更新前
    onBeforeUpdate(() => {
      console.log('数据即将更新')
    })
    
    // 数据更新后
    onUpdated(() => {
      console.log('数据更新完成')
      // 注意：onUpdated 不保证所有子组件都重新渲染完毕
      // 如果需要等待整个视图渲染完毕，使用 nextTick
    })
    
    // 组件卸载前
    onBeforeUnmount(() => {
      console.log('组件即将卸载')
      // 清理定时器、事件监听器等
    })
    
    // 组件卸载后
    onUnmounted(() => {
      console.log('组件已卸载')
    })
    
    return {
      // 暴露给模板的数据和方法
    }
  }
})
```

### 页面生命周期

```js
import { 
  createPage,
  onBeforeMount,
  onMounted,
  onUnmounted,
  onLoad,
  onShow,
  onHide,
  onResize
} from '@mpxjs/core'

createPage({
  setup() {
    // 页面特有生命周期
    onLoad((options) => {
      console.log('页面加载', options)
      // 处理页面参数
    })
    
    onShow(() => {
      console.log('页面显示')
      // 页面显示时的逻辑
    })
    
    onHide(() => {
      console.log('页面隐藏')
      // 页面隐藏时的逻辑
    })
    
    onResize((res) => {
      console.log('页面尺寸变化', res)
    })
    
    // 通用组件生命周期
    onBeforeMount(() => {
      console.log('页面即将挂载')
    })
    
    onMounted(() => {
      console.log('页面挂载完成')
    })
    
    onUnmounted(() => {
      console.log('页面即将卸载')
    })
    
    return {}
  }
})
```

### 应用生命周期

应用实例暂不支持 setup 语法，只能使用选项式 API。

### 组件中监听页面生命周期

组件也可以在 setup 中监听页面生命周期：

```js
import { 
  createComponent,
  onMounted,
  onShow,
  onHide
} from '@mpxjs/core'

createComponent({
  setup() {
    // 组件自身生命周期
    onMounted(() => {
      console.log('组件挂载完成')
    })
    
    // 监听页面生命周期
    onShow(() => {
      console.log('页面显示时，组件需要处理的逻辑')
    })
    
    onHide(() => {
      console.log('页面隐藏时，组件需要处理的逻辑')
    })
    
    return {}
  }
})
```

### 使用注意事项

1. **同步调用**：生命周期钩子注册函数只能在 `setup()` 期间同步使用
2. **实例绑定**：它们依赖于内部的全局状态来定位当前活动的实例
3. **自动清理**：在生命周期钩子内同步创建的侦听器和计算属性会在组件卸载时自动删除

```js
import { createComponent, onMounted, watch, computed } from '@mpxjs/core'

createComponent({
  setup() {
    // ❌ 错误：异步调用
    setTimeout(() => {
      onMounted(() => {
        // 这将会出错，因为没有活动的组件实例
      })
    }, 100)
    
    // ✅ 正确：同步调用
    onMounted(() => {
      // 在生命周期钩子内创建的侦听器会自动清理
      watch(() => {
        // 监听逻辑
      })
      
      // 计算属性也会自动清理
      const result = computed(() => {
        // 计算逻辑
      })
    })
    
    return {}
  }
})
```

## SSR 生命周期

Mpx 2.9+ 版本提供了专门的 SSR（服务端渲染）生命周期钩子：

**特殊生命周期常量：**
- `SERVERPREFETCH` - 服务端预取数据（SSR 相关）
- `REACTHOOKSEXEC` - React Hooks 执行（内部使用）

### onAppInit

> 仅在 App 中使用，服务端和客户端都会执行

用于在应用创建前进行初始化操作，常用于创建全局状态管理实例：

```js
// app.mpx
import { createApp } from '@mpxjs/core'
import { createPinia } from '@mpxjs/pinia'

createApp({
  onAppInit() {
    // 每个请求都会创建新的 pinia 实例，避免跨请求状态污染
    const pinia = createPinia()
    return {
      pinia
    }
  }
})
```

### serverPrefetch

> 可在 App/Page/Component 中使用，仅在服务端执行

用于服务端数据预取，类似于 Vue SSR 的 `serverPrefetch`：

**选项式 API：**

```js
import { createPage } from '@mpxjs/core'
import useStore from '../store/index'

createPage({
  data: {
    articleList: []
  },
  
  serverPrefetch() {
    // 获取路由参数
    const query = this.$route.query
    const store = useStore(this.$pinia)
    
    // 返回 Promise，预取数据并更新状态
    return store.fetchArticleList(query.category)
      .then(data => {
        this.articleList = data
      })
  }
})
```

**组合式 API：**

```js
import { 
  createPage, 
  onServerPrefetch, 
  getCurrentInstance,
  ref
} from '@mpxjs/core'
import useStore from '../store/index'

createPage({
  setup() {
    const articleList = ref([])
    const store = useStore()
    
    onServerPrefetch(() => {
      const instance = getCurrentInstance()
      const query = instance.proxy.$route.query
      
      // 返回 Promise，预取数据
      return store.fetchArticleList(query.category)
        .then(data => {
          articleList.value = data
        })
    })
    
    return {
      articleList
    }
  }
})
```

### onSSRAppCreated

> 仅在 App 中使用，仅在服务端执行

在应用实例创建后、渲染前执行，用于路由匹配和状态同步：

```js
// app.mpx
import { createApp } from '@mpxjs/core'

createApp({
  onSSRAppCreated({ app, router, pinia, context }) {
    // 设置路由路径
    return router.push(context.url).then(() => {
      // 等待路由匹配完成后，同步状态到客户端
      context.state = {
        pinia: pinia.state.value
      }
      
      // 返回应用实例
      return app
    })
  }
})
```

### SSR 生命周期执行顺序

在 SSR 环境下，生命周期的执行顺序如下：

```
服务端：
1. onAppInit      - 应用初始化
2. serverPrefetch - 数据预取
3. onSSRAppCreated - 应用创建完成

客户端（激活）：
1. onAppInit      - 应用初始化
2. created        - 组件创建
3. mounted        - 组件挂载（激活已有 DOM）
```

## 最佳实践

### 1. 选择合适的生命周期

#### 选项式 API（原生小程序生命周期）

```js
// ✅ 正确：在 attached/onInit 中初始化数据
attached() {
  this.fetchUserInfo()
}

// ✅ 正确：在 ready/didMount 中操作 DOM
ready() {
  // 微信小程序中操作组件节点
  this.createSelectorQuery().select('.chart').boundingClientRect().exec()
}

// ✅ 正确：在 detached/didUnmount 中清理资源
detached() {
  clearInterval(this.timer)
  // 小程序中移除事件监听
}
```

#### 组合式 API（Vue 风格生命周期）

```js
// ✅ 正确：在 setup 中初始化数据，onMounted 中操作 DOM
setup() {
  // 数据初始化可以直接在 setup 中进行
  const userInfo = ref(null)
  
  onMounted(() => {
    // DOM 操作
  })
  
  onBeforeUnmount(() => {
    // 清理资源
    clearInterval(timer)
  })
}
```

### 2. 避免在错误的生命周期中执行操作

```js
// ❌ 错误：在 created 中操作 DOM（小程序 created 钩子时组件还未进入节点树）
created() {
  // 此时无法进行 DOM 操作
  this.selectComponent('.element') // 获取不到
}

// ✅ 正确：在 ready/didMount 中操作 DOM
ready() {
  // 此时可以安全地操作 DOM
  this.selectComponent('.element')
}
```

### 3. 合理处理异步操作

```js
import { createComponent, onMounted, onBeforeUnmount } from '@mpxjs/core'

createComponent({
  setup() {
    let abortController = null
    
    onMounted(async () => {
      // 创建可取消的请求
      abortController = new AbortController()
      
      try {
        const data = await fetch('/api/data', {
          signal: abortController.signal
        })
        // 处理数据
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('请求失败', error)
        }
      }
    })
    
    onBeforeUnmount(() => {
      // 组件卸载时取消请求
      if (abortController) {
        abortController.abort()
      }
    })
    
    return {}
  }
})
```

### 4. 正确使用 nextTick

```js
import { createComponent, nextTick } from '@mpxjs/core'

createComponent({
  data: {
    list: []
  },
  
  methods: {
    async addItem() {
      this.list.push(newItem)
      
      // 等待 DOM 更新完成后再操作
      await nextTick()
      
      // 滚动到新增的元素
      this.$refs.container.scrollTop = this.$refs.container.scrollHeight
    }
  }
})
```

## 总结

Mpx 的生命周期系统提供了完善的组件和页面状态管理能力：

- **统一性**：抹平了不同小程序平台的生命周期差异
- **灵活性**：支持选项式 API 和组合式 API 两种写法
- **完整性**：覆盖了组件、页面、应用和 SSR 场景
- **易用性**：与 Vue 生命周期保持一致的设计理念

合理使用生命周期钩子能够帮助开发者更好地管理组件状态，提升应用性能和用户体验。
