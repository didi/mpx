# Mpx2Web 脚本差异参考

本文档只记录 `<script>` 中 Web-only 运行时差异。构造选项、组合式 API、响应式 API、实例基础方法和通用生命周期沿用输入项目与仓库内 Mpx 文档，不从其它输出端 Skill 推导。

## 目录

- [与微信小程序的实例方法差异](#与微信小程序的实例方法差异)
  - [`setData` 与视图更新](#setdata-与视图更新)
  - [组件实例查询](#组件实例查询)
  - [`triggerEvent` 的传播选项](#triggerevent-的传播选项)
  - [`$forceUpdate` 与 setup `forceUpdate`](#forceupdate-与-setup-forceupdate)
- [与微信小程序的能力差异](#与微信小程序的能力差异)
  - [小程序内置 behavior](#小程序内置-behavior)
  - [关系能力](#关系能力)
  - [框架未内置支持的生命周期和能力](#框架未内置支持的生命周期和能力)
  - [通过 `implement` 抹平小程序能力差异](#通过-implement-抹平小程序能力差异)

---

## 与微信小程序的实例方法差异

### `setData` 与视图更新

输出 Web 时框架不提供 `this.setData()`。应直接修改响应式数据，由框架自动更新视图，例如使用 `this.count = value`。

### 组件实例查询

Web 的 `selectComponent` / `selectAllComponents` 仅支持 id、class 及其组合、逗号分组，不支持后代或子代等关系选择器。

选择器中不能包含空白字符，逗号分组应写为 `#foo,.bar`，不能写为 `#foo, .bar`。

### `triggerEvent` 的传播选项

Web 不支持 `bubbles`、`composed`、`capturePhase` 传播选项，不依赖它们实现跨层通知。

需要跨层通知时，使用 `provide/inject` 传递回调，或使用全局状态管理。

### `$forceUpdate` 与 setup `forceUpdate`

Web 中 `this.$forceUpdate()` 和 setup context 的 `forceUpdate()` 只能无参强制刷新，传入的数据、选项和回调都会被忽略。

视图更新回调可改用从 `@mpxjs/core` 导入的 `nextTick(callback)`，在修改数据或调用无参 `forceUpdate()` 后执行，也可以使用实例的 `this.$nextTick(callback)`。

---

## 与微信小程序的能力差异

### 小程序内置 behavior

Web 不支持小程序内置 behavior。

### 关系能力

Web 支持 `relations` 的父子/祖先后代匹配、`linked`、`unlinked` 和 `getRelationNodes()`，不支持 `target` 配置和 `linkChanged` 回调。

关系能力仅注入组件。双方需要按组件路径声明配对的 `parent` / `child` 或 `ancestor` / `descendant` 关系，并满足同一调用模板中的插槽嵌套条件；内建组件和模板包装组件会被跳过。`ancestor` 向上查找到首个匹配目标后停止。关系在挂载时建立、卸载前解除；`getRelationNodes(path)` 返回缓存的实例数组，没有该路径的关系缓存时返回 `null`，已有缓存中的节点全部移除后可能返回 `[]`。

### 框架未内置支持的生命周期和能力

除上述小程序内置 behavior 和关系能力限制外，Web 框架未内置支持以下生命周期和选项：

| 声明位置 | 生命周期或选项 | 未内置支持的能力 |
| --- | --- | --- |
| App | `onThemeChange` | 主题变化通知 |
| Page / Component 页面 | `onShareAppMessage`、`onShareTimeline` | 分享入口及分享信息处理 |
| Page / Component 页面 | `onAddToFavorites` | 收藏入口及收藏信息处理 |
| Page / Component 页面 | `onSaveExitState` | 退出状态保存与恢复 |
| Page / Component 页面 | `onRouteDone` | 路由过渡动画完成通知 |
| Component / Behavior | `moved`、`error` | 节点移动通知、组件方法错误处理 |
| Component / Behavior | `definitionFilter` | 定义预处理及过滤器调用链 |
| Component | `export` | 组件查询时的自定义返回值 |

### 通过 `implement` 抹平小程序能力差异

上表中的生命周期和选项可以通过 `implement` 登记适配，并结合全局 mixin、Web SDK 或业务逻辑提供实际实现，复用原有的小程序声明。微信源码转 Web 时，未登记的这些声明会被移除，并在开发环境报错提示；App 的 `onThemeChange` 在 Web 的 App 创建流程中单独检查。

在 App、页面或组件构造前调用 `implement`，指定 `modes: ['web']`，并在 `processor` 中初始化适配逻辑。只有当前输出平台包含在 `modes` 中时才执行登记；`processor` 在每次登记时执行，不接收页面实例，也不会自动去重。需要访问实例的逻辑应放在 mixin 的生命周期或方法中。

登记后默认保留原声明，设置 `remove: true` 则移除。需要调用原有钩子时应保留声明。`implement` 本身不会实现能力或自动触发回调，触发时机、参数和返回值处理均由适配层负责。

以 `onShareAppMessage` 为例，在 Web 页面显示时注册分享回调，在用户触发分享动作时调用原有分享钩子，将返回的信息交给业务分享适配层。

```js
// 在应用入口中先加载此适配模块，再构造页面
import mpx, { implement } from '@mpxjs/core'
import { setWebShareHandler } from './web-share'

implement('onShareAppMessage', {
  modes: ['web'],
  processor () {
    mpx.mixin({
      onShow () {
        if (this.onShareAppMessage) {
          setWebShareHandler(options => this.onShareAppMessage(options))
        } else {
          setWebShareHandler()
        }
      },
      onHide () {
        setWebShareHandler()
      }
    }, { types: 'page' })
  }
})
```

页面继续使用小程序的分享声明：

```js
import { createPage } from '@mpxjs/core'

createPage({
  onShareAppMessage () {
    return {
      title: '商品详情',
      path: '/pages/detail?id=123',
      imageUrl: 'https://example.com/share.png'
    }
  }
})
```

示例中的 `setWebShareHandler` 是业务自行实现的分享回调注册函数，不是 Mpx API。传入回调时替换当前页面的分享处理器，无参调用时清除处理器。页面显示时只注册回调，页面隐藏时清理；适配层在实际分享动作发生时才调用回调，并按入口传入 `{ from: 'menu' }` 或按钮分享所需的参数。

分享适配层负责消费回调返回的信息：将小程序 `path` 转换为当前 Web 项目可访问的完整 URL，将 `title`、`imageUrl` 等字段映射到所接入分享 SDK，并处理钩子的 `promise` 返回值。SDK 初始化、默认分享配置和实际分享入口也由该适配层实现。
