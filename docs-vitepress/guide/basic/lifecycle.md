# Mpx 生命周期

Mpx 作为跨端小程序框架，提供了一套统一的生命周期系统，抹平不同小程序平台生命周期的差异。本章节详细介绍 Mpx 中的各种生命周期钩子及其使用方法。

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
| SERVERPREFETCH | serverPrefetch | onServerPrefetch | - |

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

组合式 API 使用统一的 Vue 风格生命周期钩子。


### 组件/页面通用生命周期

**组件和页面都可用的生命周期钩子：**
- `onBeforeMount` - 挂载开始之前被调用
- `onMounted` - 被挂载后调用
- `onBeforeUpdate` - 数据更新时调用，发生在虚拟 DOM 打补丁之前
- `onUpdated` - 数据更新导致的重新渲染和打补丁后调用
- `onBeforeUnmount` - 在卸载实例之前调用
- `onUnmounted` - 卸载实例后调用
- `onShow` - 页面显示/切入前台时触发
- `onHide` - 页面隐藏/切入后台时触发
- `onResize` - 页面尺寸变化时触发

> **注意**：`setup` 函数本身相当于 `beforeCreate` + `created`，可以直接在其中编写初始化逻辑。

**示例：**
```js
import { 
  createComponent, 
  onBeforeMount,
  onMounted, 
  onBeforeUpdate,
  onUpdated, 
  onBeforeUnmount,
  onUnmounted,
  onShow,
  onHide,
  onResize
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
    
    // 页面相关生命周期（组件中监听页面的生命周期）
    onShow(() => {
      console.log('页面显示时，组件需要处理的逻辑')
    })
    
    onHide(() => {
      console.log('页面隐藏时，组件需要处理的逻辑')
    })
    
    onResize((res) => {
      console.log('页面尺寸变化时，组件需要处理的逻辑', res)
    })
    
    return {
      // 暴露给模板的数据和方法
    }
  }
})
```

### 页面特有生命周期

**仅页面可用的生命周期钩子：**
- `onLoad` - 页面加载时触发，接收页面参数

**示例：**
```js
import { 
  createPage,
  onLoad,
  // 其他通用生命周期钩子请参考上面的"组件页面通用生命周期"部分
} from '@mpxjs/core'

createPage({
  setup() {
    // 页面特有生命周期
    onLoad((options) => {
      console.log('页面加载', options)
      // 处理页面参数
    })
    
    return {}
  }
})
```

### 应用生命周期

**注意：** 应用实例暂不支持 setup 语法，只能使用选项式 API。

## SSR 生命周期

Mpx 2.9+ 版本提供了专门的 [web SSR](/guide/advance/ssr.html)（服务端渲染）生命周期钩子：

### 通用生命周期

**[serverPrefetch](/guide/advance/ssr.html#serverprefetch) / [SERVERPREFETCH](/guide/advance/ssr.html#serverprefetch)**

> 可在应用/页面/组件中使用，仅在服务端执行

用于服务端数据预取，支持两种定义方式：

**选项式 API：**

```js
import { createPage, SERVERPREFETCH } from '@mpxjs/core'
import useStore from '../store/index'

createPage({
  data: {
    articleList: []
  },
  
  // 方式1：使用方法名
  serverPrefetch() {
    const store = useStore(this.$pinia)
    return store.fetchArticleList(this.$route.query.category)
      .then(data => {
        this.articleList = data
      })
  },
  
  // 方式2：使用内置生命周期常量（等价于上面）
  // [SERVERPREFETCH]() {
  //   // 与 serverPrefetch 完全等价
  // }
})
```

**组合式 API：**

```js
import { createPage, onServerPrefetch, ref } from '@mpxjs/core'
import useStore from '../store/index'

createPage({
  setup() {
    const articleList = ref([])
    const store = useStore()
    
    onServerPrefetch(() => {
      return store.fetchArticleList()
        .then(data => {
          articleList.value = data
        })
    })
    
    return { articleList }
  }
})
```

### 应用生命周期

**应用级别的 SSR 生命周期钩子：**
- [`onAppInit`](/guide/advance/ssr.html#onappinit) - 应用初始化（服务端和客户端都执行）
- [`onSSRAppCreated`](/guide/advance/ssr.html#onssrappcreated) - 应用创建完成（仅服务端执行）

```js
// app.mpx
import { createApp } from '@mpxjs/core'
import { createPinia } from '@mpxjs/pinia'

createApp({
  // 应用初始化，创建全局状态管理实例
  onAppInit() {
    const pinia = createPinia()
    return { pinia }
  },
  
  // 应用创建完成，进行路由匹配和状态同步
  onSSRAppCreated({ app, router, pinia, context }) {
    return router.push(context.url).then(() => {
      context.state = { pinia: pinia.state.value }
      return app
    })
  }
})
```

## 最佳实践

### 1. 选择合适的生命周期

#### 选项式 API（原生小程序生命周期）

```js
// ✅ 正确：在 attached 中初始化数据
attached() {
  this.fetchUserInfo()
}

// ✅ 正确：在 ready 中操作 DOM
ready() {
  // 操作组件节点
  this.createSelectorQuery().select('.chart').boundingClientRect().exec()
}

// ✅ 正确：在 detached 中清理资源
detached() {
  clearInterval(this.timer)
  // 移除事件监听，定时器等
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
// ❌ 错误：在 created 中操作 DOM（created 钩子时组件还未进入节点树）
created() {
  // 此时无法进行 DOM 操作
  this.selectComponent('.element') // 获取不到
}

// ✅ 正确：在 ready 中操作 DOM
ready() {
  // 此时可以安全地操作 DOM
  this.selectComponent('.element')
}
```