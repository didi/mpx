# Web 脚本差异

本页按 [脚本基础](../base/script-reference.md) 的主题顺序组织，只描述 Web 相对基准在支持范围、参数、使用要求上的差异及专属扩展，不重复一致的用法，也不展开内部实现差异。状态管理见 [状态管理基准](../base/store-reference.md)。SSR 的请求隔离、首屏预取与状态恢复见 [SSR 参考](./ssr-reference.md)。

## 目录

- [构造选项](#构造选项)
  - [App 构造选项](#app-构造选项)
  - [页面与组件构造选项](#页面与组件构造选项)
  - [统一生命周期](#统一生命周期)
  - [关系能力](#关系能力)
  - [通过 implement 适配构造选项](#通过-implement-适配构造选项)
- [实例属性与方法](#实例属性与方法)
  - [页面与组件实例属性与方法](#页面与组件实例属性与方法)
  - [selector 查询要求](#selector-查询要求)
- [数据响应](#数据响应)
  - [强制更新](#强制更新)
- [组合式 API](#组合式-api)
- [script setup](#script-setup)

## 构造选项

### App 构造选项

| 选项 | Web 差异 |
| --- | --- |
| `onThemeChange` | 未内置支持，需自行适配主题变化通知。 |
| `onAppInit(): object \| void` | 无参数；返回对象同步合并到 Vue 根实例选项，不返回时不增加选项。SSR 中用于每次请求创建独立的 Pinia，不能返回 Promise。 |
| `onSSRAppCreated` | Web SSR 专属；接收 `{ pinia, router, app, context }`，自定义时须返回最终 resolve 为 `app` 的 Promise，并接管路由就绪与状态输出。具体职责见 [SSR 参考](./ssr-reference.md#自定义服务端入口逻辑)。 |

### 页面与组件构造选项

下表“通用”表示页面和组件均适用；页面包括通过 Component 构造的页面。

| 选项 | 适用 | Web 差异 |
| --- | --- | --- |
| `components` | 通用 | 可注册 Vue 2.7 组件，跨平台输出时需通过条件编译隔离引用与注册。 |
| `behaviors` 中的小程序内置 behavior | 组件 | 不支持字符串形式的小程序内置 behavior。 |
| `relations` | 组件 | 支持父子 / 祖先后代匹配及 `linked`、`unlinked`，不支持通过 `target` 按 behavior 匹配，匹配要求见下方关系能力。 |
| `onShareAppMessage` / `onShareTimeline` | 页面 | 未内置分享入口及分享信息处理，需自行适配。 |
| `onAddToFavorites` | 页面 | 未内置收藏入口及收藏信息处理，需自行适配。 |
| `onSaveExitState` | 页面 | 未内置退出状态保存与恢复，需自行适配。 |
| `onRouteDone` | 页面 | 未内置路由过渡动画完成通知，需自行适配。 |
| `definitionFilter` | 组件 / Behavior | 未内置定义预处理及过滤器调用链。 |
| `export` | 组件 | 未内置组件查询时的自定义返回值。 |

### 统一生命周期

| 生命周期 / 钩子 | Web 差异 |
| --- | --- |
| `moved` / `error` | 未内置组件节点移动通知、组件方法错误处理，需自行适配。 |
| `serverPrefetch` / `onServerPrefetch` / `SERVERPREFETCH` | Web SSR 专属；选项式回调为 `serverPrefetch(): Promise<unknown>`，组合式为 `onServerPrefetch(callback): void`，callback 为无参异步任务函数。SSR 等待回调返回的 Promise，不消费其 resolve 值；注册函数不返回任务或取消函数，浏览器端不执行回调。 |

SSR 的 `onLoad` 也会执行，但服务端渲染不会等待其异步返回值；首屏异步数据使用 `serverPrefetch` / `onServerPrefetch`。浏览器监听器、DOM 操作等副作用放在客户端挂载后，具体要求见 [SSR 参考](./ssr-reference.md#浏览器对象与副作用)。

### 关系能力

仅支持按组件路径关联，不支持通过 `target` 按 behavior 匹配。双方需要声明配对的 `parent` / `child` 或 `ancestor` / `descendant` 关系，并满足同一调用模板中的插槽嵌套条件；内建组件和模板包装组件会被跳过。`ancestor` 向上查找到首个匹配目标后停止。关系在挂载时建立、卸载前解除。

### 通过 implement 适配构造选项

被 Web 转换列为未支持的构造选项可以通过 `implement` 登记适配，并结合全局 mixin、Web SDK 或业务逻辑提供实际实现，复用原有的小程序声明。微信源码转 Web 时，未登记的这些声明会被移除，并在开发环境报错提示；App 的 `onThemeChange` 也需要单独适配。

基准登记时机、`processor` 执行和 `remove` 语义见 [implement](../base/script-reference.md#通过-implement-适配构造选项)，Web 适配指定 `modes: ['web']`。登记本身不实现能力，以下示例展示 Web 侧实际桥接。

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

该示例约定 `setWebShareHandler(handler?): void`，handler 接收 [分享回调参数](../base/script-reference.md#统一生命周期)，返回页面的分享配置对象；注册函数本身不返回分享数据。

分享适配层负责消费回调返回的信息：将小程序 `path` 转换为当前 Web 项目可访问的完整 URL，将 `title`、`imageUrl` 等字段映射到所接入分享 SDK，并处理钩子的 `promise` 返回值。SDK 初始化、默认分享配置和实际分享入口也由该适配层实现。

## 实例属性与方法

### 页面与组件实例属性与方法

| 名称 | 类型 | 适用 | Web 差异 |
| --- | --- | --- | --- |
| `setData` | 方法 | 通用 | 不提供该方法；使用响应式赋值更新数据。 |
| `triggerEvent(name, detail, options)` | 方法 | 组件 | 不支持第三个参数中的 `bubbles`、`composed`、`capturePhase` 传播选项。跨层通知使用 `provide/inject` 传递回调，或使用全局状态管理。 |
| `selectComponent(selector)` / `selectAllComponents(selector)` | 方法 | 通用 | 仅支持 id、class 及其组合、逗号分组，不支持关系选择器；无匹配时分别返回 `undefined` / `[]`。具体格式见下方 selector 查询要求。 |
| `$forceUpdate()` | 方法 | 通用 | 仅支持无参刷新，传入的数据、选项和回调均被忽略。 |

### selector 查询要求

`selectComponent` / `selectAllComponents` 的选择器不能包含空白字符，逗号分组应写为 `#foo,.bar`，不能写为 `#foo, .bar`；不支持后代、子代等关系选择器。

这些是组件实例查询的限制，不应用于 `createSelectorQuery` 等 DOM 节点查询 API。

## 数据响应

Web 不提供 `this.setData()`。应直接修改响应式数据，由框架自动更新视图，例如使用 `this.count = value`。

### 强制更新

`this.$forceUpdate(): void` 和 setup context 的 `forceUpdate(): void` 只能无参强制刷新，传入的数据、选项和回调都会被忽略，不返回 Promise。

视图更新回调可改用从 `@mpxjs/core` 导入的 `nextTick(callback)`，在修改数据或调用无参 `forceUpdate()` 后执行，也可以使用实例的 `this.$nextTick(callback)`。

## 组合式 API

- `setup` context 的 `forceUpdate()` 仅支持无参刷新；`triggerEvent` 不支持传播选项，组件查询遵循上述 selector 限制。
- Web SSR 使用 `onServerPrefetch(callback): void` 注册异步预取任务，由 callback 返回需要等待的 Promise；浏览器端不执行该回调。
- `onShareAppMessage` 等未内置支持的页面事件，即使通过组合式钩子注册，仍需适配层实际驱动，不能仅依赖 `implement` 登记。

`useI18n(options?)` 在 Web 返回 Vue I18n 的 composer；除 [基准参数](../base/script-reference.md#运行时导出)外，`useScope?: 'global' | 'parent' | 'local'` 可指定作用域。未传配置且没有组件局部 i18n 资源时使用全局作用域，非空配置未指定 useScope 时使用局部作用域。返回的 `messages` 是只读 computed ref，`locale` / `fallbackLocale` 是可写 computed ref；`getLocaleMessage(locale: string)` 未找到语言时返回 `{}`，`tm(key: string)` 未命中当前及回退词条时也返回 `{}`，不同于基准的 `undefined`。日期与数字格式化沿用 [i18n 模板基准](../base/template-reference.md#i18n-国际化)。

## script setup

`defineOptions({ components: { VueComponent } })` 可注册 Vue 2.7 组件；跨平台输出时需隔离 Vue 组件依赖与注册。`useContext()` 取得的 context 同样受上述参数和 selector 限制约束。
