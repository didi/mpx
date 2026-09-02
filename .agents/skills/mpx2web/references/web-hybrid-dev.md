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

Mpx 输出 Web 时运行在真实 DOM 环境中。只有在需要浏览器专属能力时，才直接访问 `window`、`document` 或 DOM 节点。

典型 Web-only 场景：

- 挂载图表、地图、播放器、编辑器等 H5 SDK。
- 使用 HTML / SVG 原生标签承载浏览器能力。
- 调用 Canvas、Web Audio、IntersectionObserver、ResizeObserver 等浏览器 API。

节点访问方式当前先参考 `../mpx2rn` 公共部分，未来替换为 mpx base skill。Web 侧额外注意：DOM 操作必须发生在客户端挂载后；SSR 场景见 [SSR 专项参考](./ssr-reference.md)。

---

## 第三方 H5 SDK

第三方 H5 SDK 通常依赖浏览器全局对象，应延迟到客户端加载，不要在通用模块顶层静态引入。

```js
createComponent({
  async ready () {
    const sdk = await import('third-party-h5-sdk')
    sdk.init({})
  }
})
```

如果 SDK 需要容器节点，当前按 `../mpx2rn` 公共部分中的节点访问规则在客户端挂载后获取；未来替换为 mpx base skill。SDK 配置、密钥、回调域名、跨域和 CSP 仍需按 Web 安全要求处理。

### 异步初始化与卸载清理

动态 `import()` 和 SDK 自身初始化都可能在组件卸载后才完成。在每个异步边界后
检查组件是否已卸载；卸载时销毁 SDK 实例、Observer 和事件监听。

```js
createComponent({
  async ready () {
    if (__mpx_mode__ !== 'web' || typeof window === 'undefined') return
    this.sdkDetached = false
    const { default: sdk } = await import('third-party-h5-sdk')
    if (this.sdkDetached) return
    const instance = await sdk.init({})
    if (this.sdkDetached) {
      instance.destroy && instance.destroy()
      return
    }
    this.sdkInstance = instance
  },
  detached () {
    this.sdkDetached = true
    if (this.sdkInstance && this.sdkInstance.destroy) this.sdkInstance.destroy()
    if (this.resizeObserver) this.resizeObserver.disconnect()
  }
})
```

不要只处理顶层静态引入，还要处理快速切页、异步返回晚于卸载和重复进入造成的资源泄漏。

清理要沿资源所有权追踪到底：组件负责销毁它持有的 SDK/图表实例并断开自己创建的 Observer；SDK/helper 若在内部注册 DOM、window、AbortSignal 等事件，应由它返回实例的 `destroy()` 成对移除。调用侧不必重复移除 SDK 私有监听，但必须在正常卸载与异步晚到两条路径都调用该 `destroy()`。验收时同时检查组件文件和 SDK/helper 文件，不能只在组件生命周期方法中搜索 `removeEventListener`。

---

## Vue 生态组件

Web 输出产物基于 Vue 2.7，本地 `.vue` 组件或兼容 Vue 2 的第三方 Vue 组件可作为 Web-only 组件接入。

注意事项：

- `.vue` 组件需兼容项目当前 Vue 2.7 运行时。
- `.vue` 组件属于 Web-only 依赖，差异较大时优先放入 `.web.mpx` 或 Web-only 入口中。

### Vue 3 不作为 Mpx Web 组件支持

Mpx2Web 当前 Web 输出运行时基于 Vue 2.7，不支持 Vue 3 SFC / Vue 3 组件作为 Mpx Web 子组件直接注册、解析或挂载。

---

## 自定义 Web 内建组件

当需要替换或扩展某个 Web 内建基础组件实现时，使用 `webConfig.customBuiltInComponents`。

```js
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

业务使用到对应能力时，至少核对：

- `scroll-x` / `scroll-y` 分别控制横纵滚动，不要只实现纵向 overflow。
- `scroll-top` / `scroll-left` 在首次挂载和后续变化时都同步到真实滚动节点。
- `scroll-into-view` 在子节点更新后查找当前滚动容器内的目标 id，并滚动到该节点；不要用未限定范围的全局节点作为完成证据。
- 原生滚动时对外触发 `scroll`，`detail` 保留 `scrollTop`、`scrollLeft`、`scrollHeight`、`scrollWidth`、`deltaX`、`deltaY`。
- 结合 `upper-threshold` / `lower-threshold` 和启用的轴触发 `scrolltoupper` / `scrolltolower`，方向分别覆盖 `top` / `left` 与 `bottom` / `right`，并避免停留在阈值内时重复泛滥触发。
- 保留默认 slot 和业务实际使用的其它 slot；若内部接管 `scroll` 监听，应在合成 Mpx 事件后继续把事件交给调用方，而不是覆盖丢失。

如果业务确实只使用 `scroll-y` 和默认子节点，可以只实现这一子集；但必须以调用点证据为准，不能删除输入中已有的受控滚动、边界通知或点击回传链路。

---

## 文件维度隔离

如果组件主体逻辑依赖浏览器或第三方 H5 SDK，优先使用 Web 文件维度隔离：

```text
components/
└── map-panel.web.mpx  # Web 实现，可安全引入 H5 SDK / Vue 组件 / DOM 逻辑
```

文件维度隔离可以避免 Web-only 依赖进入通用模块，也能让 Web 组件按浏览器语义组织代码。
