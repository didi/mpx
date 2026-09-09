# Mpx2Web 条件编译口径

本文档给出 Mpx2Web 场景下必须遵守的条件编译边界。不要凭其它平台 Skill 或注释外形推断语法。

## 语法边界

| 所在位置 | 正确写法 | 禁止写法 |
| --- | --- | --- |
| 模板节点 | `<view @web>`、`wx:if="{{__mpx_mode__ === 'web'}}"` | `<!-- @mpx-if (...) -->` |
| 模板属性/事件 | `open-type@wx="share"`、`bindtap@web="shareOnWeb"` | 用 HTML 注释包围属性或节点 |
| 普通脚本 | 真实的 `if (__mpx_mode__ === 'web') { ... }` | `// @mpx-if`、`// @mpx-else`、`// @mpx-endif` |
| 动态 JSON | `<script name="json">` 中使用 `__mpx_mode__` 表达式并导出对象 | 在静态 JSON 中写条件注释 |
| 样式 | `<style mode="web">` 或 `<style>` 内的 `@mpx-if` 条件注释 | 把样式条件注释复制到 template/script/json |
| 大块平台差异 | `.web.mpx`、`.web.js` 或 `mode="web"` 区块 | 用大量局部伪注释模拟文件隔离 |

`@mpx-if` 是样式编译器识别的条件注释，不是 `.mpx` 所有区块共用的预处理器。下面两种写法在模板和脚本中都只是普通注释，分支内容仍会保留并可能同时执行：

```html
<!-- 错误：两个 button 都会留在模板中 -->
<!-- @mpx-if (__mpx_mode__ === 'wx') -->
<button open-type="share">小程序分享</button>
<!-- @mpx-endif -->
```

```js
// 错误：两个调用都会留在脚本中
// @mpx-if (__mpx_mode__ === 'web')
shareOnWeb()
// @mpx-else
shareOnMiniProgram()
// @mpx-endif
```

对应的模板应直接在节点上声明平台：

```html
<button @wx open-type="share">小程序分享</button>
<button @web bindtap="shareOnWeb">Web 分享</button>
```

对应的脚本必须使用真实分支：

```js
if (__mpx_mode__ === 'web') {
  shareOnWeb()
} else {
  shareOnMiniProgram()
}
```

## 什么时候需要 Web-only 条件编译

Web 兼容度高，大多数模板、脚本、样式和 JSON 配置无需为 Web 输出增加条件编译。只有出现以下 Web-only 差异时才考虑隔离：

- Web-only 能力：DOM、浏览器对象、HTML/SVG 原生标签、H5 SDK、Vue 组件、Web-only CSS、SSR 客户端逻辑。
- Web 部署或运行配置：Web 路由、异步分包、SSR、挂载节点、资源路径等只影响 Web 的配置。
- Web 体验增强：滚动条、hover、sticky、细线、安全区域等只在 Web 侧增强的片段。

## 使用原则

- 先判断是否真有 Web 差异；没有差异就不要加条件编译。
- 优先保持通用 Mpx 写法，条件编译只包裹最小 Web-only 片段。
- Web-only 依赖不要放在通用模块顶层静态引入；差异较大时优先使用 `.web.mpx` 文件维度隔离。
- SSR 场景下，编译目标是 Web 不代表当前运行在浏览器；浏览器对象访问规则见 [SSR 专项参考](./ssr-reference.md)。
- 涉及 `async` / `await` 和平台专属依赖时，优先使用 `.web.*` 文件或 `mode="web"` 区块隔离依赖图；不要假设普通 `if` 一定能在 Babel 转换后删除 false 分支中的模块引用。

## 样式隔离与配对

整段样式都只服务 Web 时，优先使用独立的 `<style mode="web">`；只有局部声明属于 Web-only 时，才在通用 style 块中使用样式条件注释：

```css
/* @mpx-if (__mpx_mode__ === 'web') */
.card:hover {
  transform: translateY(-2px);
}
/* @mpx-endif */
```

`@mpx-if`、可选的 `@mpx-else` 与 `@mpx-endif` 必须位于同一个 style 块并完整配对。完成修改后重新检查每个 style 块的开闭数量，并逐个真实编译所有修改过的 `.mpx` 文件；不能因为一个入口编译成功就推断其他文件中的条件注释也正确。

交付前还必须执行：

```bash
node <skill-root>/scripts/validate-conditional-compile.js <修改过的文件.mpx>...
```

该检查专门拦截模板和脚本中的伪 `@mpx-*` 注释。真实 Web 构建仍需执行，因为两者覆盖的错误类型不同。
