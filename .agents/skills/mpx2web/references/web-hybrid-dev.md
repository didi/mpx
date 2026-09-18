# Mpx2Web H5 生态混合开发

本文档只记录 Web-only 的 H5 生态接入方式。通用模板、通用组件注册、通用条件编译、通用节点访问不在本文维护。

## 目录

- [Web 原生 DOM 能力](#web-原生-dom-能力)
- [第三方 H5 SDK](#第三方-h5-sdk)
- [Vue 生态组件](#vue-生态组件)
- [自定义 Web 内建组件](#自定义-web-内建组件)
- [文件维度隔离](#文件维度隔离)

---

## Web 原生 DOM 能力

Mpx 的 Web 输出在浏览器中可访问 DOM，也可能在 SSR 服务端执行。只有确认处于浏览器环境且需要对应能力时，才访问 `window`、`document` 或 DOM 节点；`.web.mpx` 仅隔离平台，不保证代码只在浏览器执行。

典型 Web-only 场景：

- 挂载图表、地图、播放器、编辑器等 H5 SDK。
- 使用 HTML / SVG 原生标签承载浏览器能力。
- 调用 Canvas、Web Audio、IntersectionObserver、ResizeObserver 等浏览器 API。

节点访问优先沿用输入项目已有的 ref 或 selector 写法；Web 侧额外注意 DOM 操作必须发生在客户端挂载后，SSR 场景见 [SSR 专项参考](./ssr-reference.md)。

---

## 第三方 H5 SDK

第三方 H5 SDK 通常依赖浏览器全局对象。按[Web 条件隔离](./conditional-compile.md#web-边界)区分依赖图、浏览器执行环境和 DOM 就绪时机；纯客户端入口可保留静态 import，共享 SSR 入口中的浏览器依赖需在客户端加载。

SDK 配置、密钥、回调域名、跨域和 CSP 按项目安全要求处理。

### 异步初始化与卸载清理

下面仅演示每次组件挂载初始化一次 SDK，不包含资源切换或曝光上报。以组件根 DOM 为容器，初始化失败时通过 `sdkError` 交给业务展示；实际接入沿用项目的目标节点与错误处理方式。

`third-party-h5-sdk` 是占位模块：假定 `create({ container })` 返回实例或其 Promise，实例提供同步、不抛错的 `destroy()`；这些不是 Mpx API，接入时按真实 SDK 接口调整。

```js
createComponent({
  data: { sdkError: '' },
  ready () {
    if (__mpx_mode__ === 'web') {
      if (typeof window === 'undefined') return
      this.sdkDisposed = false
      return import('third-party-h5-sdk').then(async ({ default: sdk }) => {
        if (this.sdkDisposed) return
        const instance = await sdk.create({ container: this.$el })
        if (this.sdkDisposed) {
          instance.destroy()
        } else {
          this.sdkInstance = instance
        }
      }).catch(error => {
        if (!this.sdkDisposed) this.sdkError = error instanceof Error ? error.message : String(error)
      })
    }
  },
  detached () {
    this.sdkDisposed = true
    if (this.sdkInstance) this.sdkInstance.destroy()
    this.sdkInstance = null
  }
})
```

仅在实际涉及以下场景时增加对应机制，不把它们作为每次 SDK 接入的固定模板：

- **资源切换或重复初始化**：用任务身份、版本号或 SDK 的取消机制防止旧结果覆盖新实例，并释放迟到的实例。SDK 支持安全更新时优先复用；释放旧实例的时机按业务是否需要无缝替换决定。
- **曝光或尺寸观察**：有实际需求才创建 Observer，释放时断开；资源会切换时，还要防止排队的旧回调作用于新资源，身份检查不能代替 `disconnect()`。
- **创建过程本身有副作用**：创建失败前的内部资源由 SDK 或其取消接口清理。若异步创建会提前操作 DOM，需按 SDK 能力取消或隔离容器，返回后销毁实例不能撤销此前副作用。内部监听交给 SDK 释放接口处理，不重复移除私有监听。

示例将动态导入留在普通方法的 Web 分支中，异步创建放在回调内；仍需按 [Web 条件隔离](./conditional-compile.md#web-边界) 核验实际构建，不能仅凭运行时浏览器判断认定依赖已从其他目标产物中移除。

---

## Vue 生态组件

Web 输出产物基于 Vue 2.7，可接入兼容该运行时的本地 `.vue` 或第三方 Vue 组件，不支持 Vue 3 组件作为 Mpx Web 子组件直接注册。Web-only 依赖的隔离方式见 [文件维度隔离](#文件维度隔离)。

---

## 自定义 Web 内建组件

当需要替换或扩展某个 Web 内建基础组件实现时，使用构建配置中的 `pluginOptions.mpx.plugin.webConfig.customBuiltInComponents`。

```js
// mpx.config.js（Mpx CLI Service）
module.exports = {
  pluginOptions: {
    mpx: {
      plugin: {
        webConfig: {
          customBuiltInComponents: {
            view: require('path').resolve(__dirname, 'src/builtin/MpxView.vue')
          }
        }
      }
    }
  }
}
```

规则：

- key 使用原始基础标签名，如 `view`、`text`、`scroll-view`。
- value 建议使用绝对路径或以 npm 包名开头的模块路径。
- 命中的基础标签会优先使用自定义模块；属性、事件、子节点语义需要自定义组件自行对齐 Web 内建组件预期。
- 该配置只影响 Web 输出。

### 替换 `scroll-view` 时的契约核对

自定义模块会完全替代框架 Web 内建实现，不会自动继承其行为。先搜索业务调用点，列出实际使用的属性和事件，再实现对应子集；不能只写 `v-bind="$attrs"`、`v-on="$listeners"` 和 `<slot />` 就宣称兼容。Vue 已声明为 prop 的值不会继续留在 `$attrs` 中，浏览器原生 `div` 也不会理解 Mpx 的滚动属性。

具体属性、事件及滚动能力见 [Web 模板参考 · scroll-view](./web-template-reference.md#scroll-view)。按调用点保留实际使用的能力和业务回传链路，不为未使用能力重写整套实现。

---

## 文件维度隔离

局部隔离与平台文件的选择统一见 [Web 条件隔离](./conditional-compile.md#web-边界)，这里不重复维护文件命名示例和选择规则。
