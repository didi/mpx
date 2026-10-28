# 分包与分包异步化

分包是 Mpx 的核心工程能力，包含分包入口组织、独立分包、跨分包组件与异步 JS 引用、分包预下载等。本页描述能力及基准声明；下载、执行、预加载与错误事件的支持情况由目标端实现决定。

## 目录

- [使用 `packages` 定义分包](#使用-packages-定义分包)
- [异步分包组件](#异步分包组件)
- [异步分包 JS 模块](#异步分包-js-模块)
- [分包预下载与运行时边界](#分包预下载与运行时边界)
- [异步规则配置](#异步规则配置)
- [独立分包](#独立分包)
  - [独立分包初始化](#独立分包初始化)

## 使用 `packages` 定义分包

在应用 JSON 的 **`packages`** 数组中声明依赖的分包入口（分包目录或 npm 包内的 `app.mpx` / `app.json`），支持嵌套。普通分包入口**只解析 JSON 部分**，且主要消费其中的 **`pages`**、**`packages`** 域；独立分包还支持执行入口脚本作为初始化逻辑，见下文。这种写法在跨团队开发跨端应用时非常方便，分包的维护方能够自行维护分包内的页面列表，无需修改主应用配置。

- **合并主包**：`packages` 路径上**不带** `root` query 时，分包入口内声明的 `pages` 会按原始路径合并到主包页面列表，与主包 `pages` 一起注册，这种方式当前已不再常用。
- **注册分包**：在 `packages` 路径上增加 **`?root=分包名`**时，该入口下的 `pages` 会注册到对应分包中，分包名 `root` 不得以 `.` 开头。
- **分包页面路径**：启用分包后，页面路径带有分包前缀，在分包配置发生变化时页面路径也会随之改变，建议使用资源 **`?resolve`** 动态获取正确的页面路径，避免写死。

**分包使用示例**

主应用的 app.mpx 中注册分包入口

```JSON5
// src/app.mpx 的 JSON 块（节选）
{
  pages: ["./pages/index"],
  packages: ["./packageA/app.mpx?root=packageA"]
}
```

分包入口的 app.mpx 中注册分包页面

```JSON5
// src/packageA/app.mpx 的 JSON 块（节选）
{
  pages: ["./pages/foo", "./pages/bar"]
}
```

使用 `?resolve` 获取分包页面路径

```js
// 主包页面 src/pages/index.mpx 的 script（节选）
import mpx from "@mpxjs/core"
import fooPageUrl from "../packageA/pages/foo.mpx?resolve"

mpx.navigateTo({
  url: fooPageUrl
})
```

**`subPackages` / `subpackages`** 写法仍支持，用于兼容微信原生写法；日常更推荐 **`packages` + `?root`**。

## 异步分包组件

跨分包组件在 `usingComponents` 路径添加 `?root=目标分包名`，在 `componentPlaceholder` 指定本地已注册的同步占位组件或基础组件，占位本身不能再是异步组件。

```json
{
  "usingComponents": {
    "heavy-card": "../../packageB/components/heavy-card?root=packageB",
    "loading-card": "../components/loading-card"
  },
  "componentPlaceholder": { "heavy-card": "loading-card" }
}
```

## 异步分包 JS 模块

在脚本中跨分包异步引用 JS 时，路径须带 **`?root=模块所在分包名`**，且使用 **`require.async('...').then(...)`** 的 Promise 风格（不能使用回调形式）。未带 `root` 时会触发构建告警。

`require.async(request: string): Promise<any>` 接收可在编译期确定的模块路径字符串，成功时兑现为所加载模块的导出值，失败时拒绝；使用 ES Module 默认导出的模块时通过 `mod.default` 读取，具名导出通过 `mod.名称` 读取。`.then((mod) => result)` 的回调返回值成为后续 Promise 的结果；`.catch((error) => result)` 接收加载或前序回调失败原因。

**示例：**

```js
// 当前脚本位于分包 A，异步引用分包 B 内的模块
require
  .async("../commonPackage/utils?root=packageB")
  .then((mod) => {
    mod.init()
  })
  .catch((err) => {
    console.error("分包 JS 加载失败", err)
  })
```

## 分包预下载与运行时边界

`preloadRule` 用于在进入指定页面时，按网络条件预下载指定分包。基准声明位于应用 JSON，以页面路径为键，通过 `network` 指定网络条件、`packages` 指定分包。

是否执行预下载由目标端决定：微信按宿主能力处理；RN 必须接入下载钩子；Web 不执行该配置。Web 的限制不影响此能力在 base 中的定义。普通分包声明不提供独立启动能力，独立分包须按[独立分包](#独立分包)章节显式声明且目标端支持。

| 目标 | 必须继续核对 |
| --- | --- |
| RN | [RN 分包差异](../rn/rn-json-reference.md#分包与分包异步化)：不支持独立分包；构建开关、下载执行、预下载、页面与组件错误处理。 |
| Web | [Web 分包差异](../web/web-json-reference.md#分包与分包异步化)：浏览器异步加载、不支持独立分包、无预下载、无 `onLazyLoadError`。 |

不要把 `rnConfig` 的加载钩子用于 Web，也不要因共享 JSON 写法而宣称所有平台都具备相同的分包运行时。

## 异步规则配置

以下为 `MpxWebpackPlugin` 顶层配置：

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `asyncSubpackageRules` | `object[]` | `[]` | 通过 `include` / `exclude`、`root` 与组件 `placeholder` 指定异步分包；路径 `?root` 与显式 `componentPlaceholder` 优先。 |
| `retryRequireAsync` | `boolean\|object` | `false` | `true` 等价于 `{ times: 1, interval: 0 }`，也可设置次数与间隔。 |
| `disableRequireAsync` | `boolean` | `false` | 关闭框架对 `require.async` 的处理，与 RN 页面/组件分包开关区分。 |

异步 store 也先等待模块加载成功，再挂载依赖它的组件。加载和执行行为仍受目标端实现约束。

## 独立分包

独立分包可以独立于主包和其他分包运行，从独立分包页面进入小程序时，主包的初始化逻辑不会执行。**RN 和 Web 均不支持独立分包**，不能将普通分包的异步加载等同于独立分包能力。

使用 `packages` 声明时，在 `root` query 后添加 `independent=true`：

```json
{
  "packages": ["./packageA/app.mpx?root=packageA&independent=true"]
}
```

也支持微信原生声明方式，在 `subPackages` / `subpackages` 的分包对象中设置 `independent: true`：

```json
{
  "subpackages": [
    {
      "root": "packageA",
      "pages": ["pages/foo", "pages/bar"],
      "independent": true
    }
  ]
}
```

### 独立分包初始化

通过 `packages` 引用 `.mpx` 入口并设置 `independent=true` 时，默认在独立分包初始化时执行该入口的 `script` 块。将分包内页面共用的初始化逻辑放在这里，不要依赖主包初始化；可通过全局变量 `isIndependent` 判断当前代码是否在独立分包环境中执行。

```html
<!-- src/packageA/app.mpx -->
<script>
import mpx from '@mpxjs/core'
import apiProxy from '@mpxjs/api-proxy'

mpx.use(apiProxy, { usePromise: true })
if (isIndependent) {
  // 独立分包专用初始化逻辑
}
</script>

<script type="application/json">
{
  "pages": ["./pages/foo", "./pages/bar"]
}
</script>
```

如需指定单独的初始化文件，可将 `independent` 配置为文件路径，替代默认入口脚本：

```json
{
  "packages": ["./packageA/app.mpx?root=packageA&independent=./common.js"]
}
```

原生分包声明也可使用 Mpx 扩展写法 `"independent": "./common.js"`。两种写法的初始化文件路径均相对于分包目录，此例为 `src/packageA/common.js`。
