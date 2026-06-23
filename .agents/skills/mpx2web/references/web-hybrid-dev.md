# Mpx 与 H5 生态混合开发

Mpx 输出 Web 时会将 `.mpx` 改写为 `vue-loader` 可处理的 Vue 2.7 单文件组件，运行时基于真实 DOM。多数小程序基础组件会被编译为 `mpx-*` Web 内建组件；HTML / SVG 原生标签可作为 Web 原生节点使用；本地 `.mpx` / `.vue` 组件可通过 JSON `usingComponents` 注册后在模板中使用。

本参考用于处理三类场景：

1. 在 `.mpx` 内使用 Web 原生 DOM 能力。
2. 在 Web 输出中接入第三方 H5 SDK。
3. 复用 Vue 生态组件，或替换/扩展 Mpx Web 内建基础组件。

## 目录

- [使用原生 DOM 能力](#使用原生-dom-能力)
- [引入第三方 H5 SDK](#引入第三方-h5-sdk)
- [使用 Vue 生态组件](#使用-vue-生态组件)
- [替换 Web 内建基础组件](#替换-web-内建基础组件)
- [跨端兼容隔离](#跨端兼容隔离)

---

## 使用原生 DOM 能力

Web 输出基于真实 DOM，但跨端组件仍应优先使用 Mpx 模板、事件、样式和 `@mpxjs/api-proxy` 能力。只有在需要调用浏览器专属能力时，才直接访问 `window`、`document` 或 DOM 节点。

### 直接使用 HTML / SVG 标签

模板中可以使用 HTML / SVG 原生标签。它们不需要在 JSON 中注册，编译时会作为原生标签保留。

```html
<template>
  <view class="chart-card">
    <canvas wx:if="{{__mpx_mode__ === 'web'}}" id="salesCanvas" class="chart-canvas"></canvas>
    <svg wx:if="{{__mpx_mode__ === 'web'}}" class="chart-icon" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6"></circle>
    </svg>
  </view>
</template>
```

原生标签通常是 Web 专属内容，应使用 `wx:if="{{__mpx_mode__ === 'web'}}"` 隔离，避免小程序侧解析到不支持的节点。

### 获取 DOM 节点

需要读写节点尺寸、挂载第三方库或调用 DOM 方法时，优先使用 `wx:ref`、`createSelectorQuery` 或组件生命周期，在节点挂载后执行。

```html
<template>
  <view wx:if="{{__mpx_mode__ === 'web'}}" class="chart-host" wx:ref="chartHost"></view>
</template>

<script>
  import { createComponent } from '@mpxjs/core'

  createComponent({
    ready () {
      if (__mpx_mode__ !== 'web') return
      this.createSelectorQuery()
        .select('.chart-host')
        .node((res) => {
          const el = res && res.node
          if (!el) return
          // 在这里挂载只依赖 DOM 的逻辑
        })
        .exec()
    }
  })
</script>
```

在 SSR 场景下，不要在模块顶层、`setup` 同步阶段或服务端生命周期中直接访问 `window` / `document`；应放到客户端生命周期中，并用 `__mpx_mode__ === 'web'` 判断隔离。

---

## 引入第三方 H5 SDK

第三方 H5 SDK 通常依赖浏览器全局对象，只能在 Web 分支中加载和执行。不要在跨端公共代码顶层直接 `import` 只支持浏览器的 SDK，否则小程序构建或 SSR 可能提前解析失败。

推荐在 Web 条件分支内延迟加载：

```js
createComponent({
  async ready () {
    if (__mpx_mode__ !== 'web') return
    const sdk = await import('third-party-h5-sdk')
    sdk.init({
      container: document.getElementById('sdk-root')
    })
  }
})
```

如果 SDK 没有小程序等效能力，应保留小程序侧降级逻辑，例如展示占位内容、隐藏入口或调用小程序原有 API。Web 分支中引入的 SDK 配置、密钥、回调域名等仍应按业务安全要求处理，不能因为运行在 Mpx 组件内就省略浏览器侧校验。

---

## 使用 Vue 生态组件

Web 输出产物是 Vue 2.7 组件，本地 `.vue` 组件或兼容 Vue 2 的第三方 Vue 组件可以作为普通组件注册使用。推荐通过 JSON `usingComponents` 注册，让 Mpx 编译链统一解析依赖、生成组件映射并处理异步分包等能力。

```html
<template>
  <view>
    <h5-chart
      wx:if="{{__mpx_mode__ === 'web'}}"
      data="{{ chartData }}"
      bindchange="handleChartChange"
    />
  </view>
</template>

<script>
  import { createComponent } from '@mpxjs/core'

  createComponent({
    data: {
      chartData: []
    },
    methods: {
      handleChartChange (e) {
        this.triggerEvent('change', e.detail)
      }
    }
  })
</script>

<script name="json">
  const config = {}
  if (__mpx_mode__ === 'web') {
    config.usingComponents = {
      'h5-chart': './H5Chart.vue'
    }
  }
  module.exports = config
</script>
```

注意事项：

- `.vue` 组件应兼容项目当前 Vue 2.7 运行时；依赖 Vue 3-only 能力的组件不能直接使用。
- 组件事件在 Web 侧由 Mpx 事件规则转为 Vue 事件；为了跨端一致，业务模板中仍优先使用 `bindxxx` / `catchxxx`。
- 若该 Vue 组件只服务 Web，模板节点与 JSON 注册都应通过条件编译或文件维度隔离，避免小程序侧解析该依赖。

---

## 替换 Web 内建基础组件

当需要扩展某个小程序基础组件在 Web 侧的实现，例如替换 `view`、`scroll-view` 或补充框架默认未覆盖的属性/事件时，使用 `webConfig.customBuiltInComponents`。

```js
// mpx.config.js
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

- key 使用微信小程序原始基础标签名，如 `view`、`text`、`scroll-view`，不要写 `mpx-view`。
- value 建议使用绝对路径或以 npm 包名开头的模块路径。
- 命中的基础标签会优先使用自定义模块；属性、事件、子节点语义需要自定义组件自行对齐微信基础组件。
- 该配置只影响 Web 输出；小程序侧不会读取。

该能力适合替换基础组件实现，不适合普通业务组件复用。普通业务组件优先使用 JSON `usingComponents`。

---

## 跨端兼容隔离

Web 混合开发引入的 DOM、H5 SDK、Vue 组件通常无法在小程序侧运行。根据差异大小选择隔离方式：

### 局部差异：模板 / 脚本条件编译

少量 Web 专属节点或属性，用模板条件编译隔离。

```html
<template>
  <view>
    <view class="fallback" wx:if="{{__mpx_mode__ !== 'web'}}">暂不支持</view>
    <div wx:if="{{__mpx_mode__ === 'web'}}" class="web-panel"></div>
  </view>
</template>
```

脚本中只在 Web 分支访问浏览器对象。

```js
if (__mpx_mode__ === 'web') {
  window.addEventListener('resize', handleResize)
}
```

### 差异较大：文件维度条件编译

如果组件大部分逻辑都依赖浏览器或第三方 H5 SDK，优先拆成平台文件：

```text
components/
├── map-panel.mpx      # 小程序 / 通用实现
└── map-panel.web.mpx  # Web 实现，可安全引入 H5 SDK / Vue 组件 / DOM 逻辑
```

文件维度隔离可以避免小程序构建解析 Web 专属依赖，也能让 Web 组件按浏览器语义组织代码。

### 使用建议

- 优先保持小程序原有实现不变，在 Web 分支补充 H5 能力。
- Web 专属依赖不要放在跨端公共模块顶层静态引入。
- SSR 场景中，浏览器对象访问必须延后到客户端执行。
- 能用 Mpx 内建组件、统一环境 API 或 `usingComponents` 解决的问题，不要直接操作 DOM。
