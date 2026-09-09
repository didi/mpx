---
name: mpx2web
description: Mpx 输出 Web（Mpx2Web）的 Web-only 差异指南，聚焦 Web 配置、浏览器能力、H5 SDK、Vue 组件、Web CSS、路由部署、SSR/SEO 与 Web 运行时差异。用于把已有 Mpx 页面或组件适配到 Web、排查 Web 构建或运行问题，以及核对跨端业务是否退化。
metadata:
  version: "1.9.4"
  author: wangcuijuan
---

# Mpx2Web Web-only 差异指南

## 定位

本 SKILL 只保留 Mpx 输出 Web 时的 **Web-only** 内容。输入文件已经提供的普通 Mpx 结构与项目既有写法就是默认基线；不要为了补充通用背景而预读其它跨端 Skill，也不要把 RN-only 结论带入 Web 任务。仅当具体通用语法无法从输入与本仓库确定时，才查询对应 Mpx 官方资料或项目源码中的单个符号。

Web-only 内容包括：

- Web 运行时配置：路由、部署路径、挂载节点、分包、异步组件、SSR。
- 浏览器能力：DOM、`window` / `document`、HTML/SVG 原生标签、Web 标准无障碍属性。
- H5 生态：第三方 H5 SDK、Vue 组件、自定义 Web 内建组件。
- Web 样式：`rpx` 到 Web 单位转换、viewport、浏览器私有 CSS 与浏览器页面滚动差异。
- Web 降级：浏览器无法提供的宿主能力在 Web 下的替代方向。

## 知识归属原则

本入口只负责判断和路由，不重复维护各维度事实：

- 配置键、页面配置、路由、分包与挂载统一由 `web-json-reference.md` 维护。
- 模板语法、事件转换、内建组件属性/事件与缺失组件统一由 `web-template-reference.md` 维护。
- 实例、生命周期和宿主语义差异统一由 `web-script-reference.md` 维护。
- DOM、H5 SDK、Vue 组件和自定义内建组件统一由 `web-hybrid-dev.md` 维护。
- SSR 生命周期、服务端限制、状态注水与 hydrate 统一由 `ssr-reference.md` 维护。
- WebView 协议、白名单与来源安全统一由 `webview-bridge-reference.md` 维护。
- API 支持表与任务实例语义统一由 `web-api-reference.md` 维护。

遇到具体能力时读取唯一归属文件，不凭通用 Vue/Web 经验推断，也不要把摘要复制到其它 reference。

## 知识库索引

| 知识库 | 何时读取 |
| --- | --- |
| [条件编译](./references/conditional-compile.md) | 判断某段逻辑是否属于 Web-only，是否应隔离到 Web 输出 |
| [Web 模板能力参考](./references/web-template-reference.md) | 使用 HTML/SVG 原生标签、Web 标准属性、核对 Web 内建基础组件能力或处理 Web 缺失/降级组件时读取 |
| [Web 脚本能力参考](./references/web-script-reference.md) | 处理 Web 页面状态、生命周期、实例差异与宿主语义时读取；配置和 SSR 细节转到各自专项 |
| [Web 样式实践](./references/web-style-practice.md) | 处理 Web 下的 `rpx` 转换、viewport、浏览器私有 CSS 与页面滚动差异时读取 |
| [Web 环境 API 参考](./references/web-api-reference.md) | 核对 `@mpxjs/api-proxy` 在 Web 的浏览器实现与不可用能力时读取 |
| [Web JSON 配置参考](./references/web-json-reference.md) | 处理 Web 路由、tabBar、分包、异步组件、Web 配置时读取 |
| [H5 生态混合开发](./references/web-hybrid-dev.md) | 接入 DOM、H5 SDK、Vue 组件、自定义 Web 内建组件时读取 |
| [WebView Bridge 参考](./references/webview-bridge-reference.md) | 在 `web-view` 嵌入页中使用 `@mpxjs/webview-bridge`，处理消息、导航、自定义 API、宿主 SDK 与来源安全时读取 |
| [SSR 专项参考](./references/ssr-reference.md) | 处理 SSR、SEO、服务端数据预取、状态注水与切换竞态、同构请求层、异步分包 hydrate 时读取 |

## Web-only 判断

改造或新建前先判断问题是否真的属于 Web-only：

- 只是普通模板、普通脚本、普通样式或普通 JSON 配置：沿用输入与仓库现有写法，不加载 Web 专项 reference。
- 需要浏览器对象、DOM、H5 SDK、Vue 组件、Web-only CSS：使用本 skill。
- 需要 Web 路由、部署、分包、异步组件、SSR/SEO：使用本 skill。
- Web 下缺失某类宿主能力，需要 Web 替代方案：使用本 skill。
- 需要判断某个基础组件在 Web 下是否可用：读取 Web 模板能力参考中的组件说明，按其中明确列出的能力使用。

## 既有行为保护线

- 不因命名偏好批量把 `wx.xxx` 改成 `mpx.xxx`，也不做反向替换；先按输入项目的 API Proxy 安装方式和现有可编译写法判断。只有目标端确实不支持当前调用契约时才改 API。
- 标准 `wx:ref` 可以继续跨端使用；只有 ref 名称或调用链本身存在平台差异时才使用 `ref@web`。平台隔离应落在真正有差异的能力上，而不是装饰所有属性。
- 保留仍有业务语义的 `navigator` 和 `open-type`。`navigateTo` 是脚本 API，声明式 `navigator` 对应值是 `navigate`；只有 EventChannel 等声明式标签无法表达的回调契约才改成脚本导航。
- 视口悬浮元素应保持 `position: fixed` 并移出带 transform 的滚动内容；不要为了绕开 transform 改成相对容器的 `absolute`。
- `.mpx` 模板使用 `bindscroll` / `bindscrolltoupper` / `bindscrolltolower`，Vue 2 自定义实现内部才使用 `@scroll` / `v-on`；不要把两套模板语法互换。

## 任务流程

1. 先读输入和任务症状，建立“能力台账”：逐项列出任务要求、原有业务不变量、对应输出文件、实现入口和验证方式。优先保留可工作的代码，只修改能解释症状的最小范围。不得把多个独立要求合并成一句笼统的“已兼容”。
2. 使用知识库目录或文本搜索定位对应小节，只读取解决当前问题需要的段落；不要整篇读取大型 reference，不要扫描整个运行时源码。reference 仍不明确时，只查询对应组件、配置键或 API 的实现符号。
3. 定位 Web-only 差异点：能力缺失、浏览器增强、H5 生态接入、Web 配置或 SSR。
4. 优先保持通用 Mpx 实现不变，只把 Web-only 片段隔离出来；浏览器私有 CSS 的每一次出现都必须位于 Web-only 样式块或完整配对的 Web 条件块中。条件语法必须与所在区块匹配：模板节点使用 `@web` / `@wx` 或 `wx:if="{{__mpx_mode__ === 'web'}}"`，模板属性和事件使用 `属性@mode`，脚本使用真实的 `if (__mpx_mode__ ...)`，动态 JSON 使用 `<script name="json">` 中的 JS 表达式并以 `module.exports` 导出可序列化对象，不能直接放裸 JSON 对象；`@mpx-if` 注释只允许出现在 `<style>` 中。严禁在脚本写 `// @mpx-if` / `// @mpx-else` / `// @mpx-endif`，也严禁在模板写 `<!-- @mpx-if -->` 一类伪指令，因为它们只是普通注释，不会删除任何分支。
5. 通用 `.mpx` 中的 Web-only 依赖不要放在模块顶层静态引入，默认在 Web 客户端分支动态加载；差异较大时使用 `.web.mpx` 文件维度隔离。只有依赖图确定只进入 Web、且模块顶层 DOM-safe 时才允许静态 import。
6. 路由任务同时读取 [Web 环境 API 参考](./references/web-api-reference.md)、[Web 模板能力参考](./references/web-template-reference.md) 与 [Web JSON 配置参考](./references/web-json-reference.md)：区分 API 名与 `navigator` 的 `open-type` 值，并让 runtime route base 与构建 publicPath 对齐。输入若使用 EventChannel 双向通信，必须同时保留 `events` 接收“新页面 → 打开者”的消息，以及 `success(res).eventChannel.emit(...)` 发送“打开者 → 新页面”的初始化数据；新页面继续通过 `this.getOpenerEventChannel()` 通信，不得用 `history` 或全局变量代替。
7. SSR 场景下不要把“Web 编译目标”等同于“浏览器运行环境”；涉及数据预取时读取并完成 [SSR 专项参考](./references/ssr-reference.md) 的对应检查清单。
8. 第三方 SDK、Observer、播放器或图表实例必须覆盖实际存在的异步边界、组件卸载和业务主键切换。每次 `await import()`、`await create()` 返回后、给实例赋值或绑定监听之前，立即复核“仍挂载 + 当前代际 + 当前业务主键”；检查失败时立即销毁本次晚到实例并返回。Observer 回调还要捕获本次代际、业务主键或实例，并在上报前确认仍属于当前资源。切换与卸载共用幂等清理链，断开 Observer、销毁实例并移除监听。资源可安全更新时无需无条件重建。
9. 使用 `scroll-view`、`video` 等 Web 内建组件时，只采用对应参考明确列出的 Web 属性和事件；Web-only 与小程序-only 属性做最小平台隔离。内建滚动观察能覆盖 DOM 增删和容器尺寸变化，但图片固有尺寸晚到时，应在图片 load/metadata 后 `nextTick` 调用组件 ref 的真实刷新能力；不要用未被运行时消费的 `observeDOM`、`update-refresh` 当作完成证据。
10. Web-only 弹层需要把浏览器 `role="dialog"`、`aria-modal`、`tabindex` 和键盘监听留在 `.web.mpx` 或真实 Web-only 节点中；通用文件保留小程序可识别的 `aria-role` 与触摸链路。打开前记录真实触发元素，渲染后移入焦点，Tab/Shift+Tab 首尾循环，Escape 关闭；关闭时仅对仍连接文档的元素恢复焦点，并成对清理键盘监听。
11. 连续触摸手势与 `tap` 共存时，按 [Web 模板能力参考](./references/web-template-reference.md) 使用与当前手势绑定的一次性误触标记；禁止用固定时间窗吞掉之后的合法点击。
12. 用 `transform: scale()` 兼容小字号时，按 [Web 样式实践](./references/web-style-practice.md) 同时校正变换原点和布局占位；不能只让视觉字号变小。
13. WebView 消息安全按 [WebView Bridge 参考](./references/webview-bridge-reference.md) 核对。优先使用内建 `bindmessage`；若 Web 与小程序消息协议不同，用 `bindmessage@web` / `bindmessage@wx` 分开处理，或在同一处理器内写真实平台分支。Web 处理器在领券、跳转等副作用前严格拒绝缺失或不等于当前值的业务主键；不要写成“字段存在时才比较”。不得反向要求既有小程序协议新增 Web-only 的 origin/source/业务字段。只有额外监听全局 `message` 时才同时校验完整可信 origin 与当前 iframe `contentWindow`。
14. 存在 WXS 事件绑定时，先运行 `node <skill-root>/scripts/validate-wxs-web-events.js <file.mpx>` 检查小程序与 Web 事件是否成对。
15. 自定义 Web 内建组件必须使用原始组件 key（例如 `scroll-view`）。先枚举所有调用点实际使用的属性、事件、子节点与业务回传，再逐项实现；Vue 组件仍应保留 `$attrs`、`$listeners` 和默认 slot，但这些结构透传不能替代 `scroll-x/y`、初始与更新后的 `scroll-top/left`、容器内 `scroll-into-view`、完整 scroll detail、双轴边界事件和跨界去重。向根 DOM 透传 `$listeners` 时要排除由组件 `$emit` 重发的 `scroll` / 边界事件，避免同一监听收到一次原生事件和一次兼容事件。不要为未使用能力重写整套内建组件，也不能丢失点击等原有业务事件链。
16. 页面滚动锁必须保存并恢复实际被锁定的每个目标。若任务或 HTML 模板要求同时锁定 `body` 与挂载容器，就两者都处理；关闭、切页、卸载必须幂等恢复原值。
17. 重新读取所有输出文件，按第 1 步能力台账逐项回填“文件 + 符号/节点 + 验证结果”；任何一行缺少实现证据都不能宣称完成。先执行 `node <skill-root>/scripts/validate-conditional-compile.js <file.mpx>...`，确认脚本和模板没有伪条件编译、样式条件块完整配对、声明文件齐全和业务不变量，再对每个修改过的 `.mpx` 页面/组件执行 Web 目标真实构建；不要只编译一个入口推断其余文件可用。静态语义检查与真实构建必须都通过，构建成功不能替代条件编译检查。

## 高风险能力核对顺序

遇到下列能力时先完成对应闭环，再处理样式和代码整理：

| 能力 | 必须闭环 |
| --- | --- |
| SDK / Observer | 客户端隔离 → 每个异步边界身份复核 → 业务切换清理 → 卸载清理 → 旧回调拒绝上报 |
| API 行为保护 | 保留项目已工作的 `wx.xxx` / `mpx.xxx` 调用和回调契约 → 只修目标端真实不支持处 → 不用 `location` / `alert` / 原生 `fetch` 替换 `navigateTo` / `showToast` / `request` |
| EventChannel | `events` 接收新页面消息 → `success(res).eventChannel.emit` 发送初始化数据 → 新页面使用 `getOpenerEventChannel` → 保留事件名和载荷 |
| RequestTask | 按实际 `usePromise` 契约取得直接任务或 `promise.__returned` → 保存任务身份 → 新请求/卸载先废弃身份再 abort → 响应写入前复核任务和查询主键 |
| SocketTask | 只保存 `connectSocket()` 返回的局部任务，不使用全局 Socket API 或原生 `WebSocket` → 四类回调都核对捕获任务 → 替换/卸载先清空当前任务再 close → send 前核对当前任务与 `task.OPEN` |
| 分享生命周期 | 小程序原方法保留 → Web 对 `onShareAppMessage`、`onShareTimeline` 分别使用 `implement(remove: true)` 移除 → 未指定 Web 分享协议时只留 TODO |
| SSR / hydrate | 请求级状态隔离 → `serverPrefetch` 等待 → 注水按业务主键复用 → 首屏不依赖时间/随机数/视口 → 浏览器节点挂载后再出现 |
| 自定义滚动 | 原始 key 与结构透传 → 横纵轴 → 初始/更新位置 → 容器内目标定位 → scroll detail → 四方向边界与去重 → 原业务事件回传 |
| Web 弹层 | Web ARIA/键盘隔离 → 触发焦点记录 → 焦点进入与循环 → Escape/遮罩关闭 → 安全恢复 → 关闭和卸载清理 |

## 检查清单

- [ ] 没有为了通用背景加载 RN Skill 或整篇大型 reference；只读取当前症状对应的小节或源码符号。
- [ ] 修改保持最小范围，没有无关重写、重复平台抽象或为未使用能力补造完整实现。
- [ ] Web-only 能力、Web-only CSS、H5 SDK、Vue 组件、SSR 客户端逻辑已被最小范围隔离。
- [ ] 条件编译语法与区块匹配：模板用 `@mode` / `wx:if` / `属性@mode`，脚本用真实 `if`，动态 JSON 用 `<script name="json">` 并通过 `module.exports` 导出，只有样式可使用 `@mpx-if` 注释。
- [ ] 脚本中没有 `// @mpx-if` 等伪指令，模板中没有 `<!-- @mpx-if -->` 等伪指令；已通过 `validate-conditional-compile.js`。
- [ ] 涉及基础组件兼容性时，已区分“有 Web 内建实现”“属性/事件已实现”“完整对齐宿主能力”，没有仅凭标签可编译就宣称支持。
- [ ] 模板、脚本、样式、配置、API、SSR 与 WebView 已分别按知识库索引核对，没有跨文件复制事实表。
- [ ] 未指定实现的 Web 缺失 API 已预留 TODO。
- [ ] 涉及配置、SSR、异步 SDK 或 WebView 时，已完成对应专项 reference 的检查清单。
- [ ] 输入中的每个业务入口、事件、路由和小程序分支均已保留，全部声明输出文件都已生成。
- [ ] 能力台账中的每个独立要求都有对应文件、实现入口和验证证据，没有用单个代表性实现推断整组能力完成。
- [ ] 路由 API、`navigator open-type`、EventChannel、runtime route base 与构建 publicPath 已按各自语义核对。
- [ ] SDK/helper 的资源所有权闭环：晚到实例立即销毁，正常实例、Observer 与其内部事件监听均可清理。
- [ ] Web 内建组件只使用参考明确列出的 Web 属性和事件，未把“声明了 prop”误认为“运行时已实现”。
- [ ] 图片等媒体尺寸晚到时使用真实 load/metadata + nextTick/ref 刷新路径，没有用无效同名属性替代实现。
- [ ] Web-only 模块可在依赖图隔离且顶层 DOM-safe 时静态加载；只对真实异步边界逐次校验代际，晚到实例立即销毁。
- [ ] 数据更新可安全复用实例时不强制重建；卸载或最终释放时 Observer、实例与其拥有的监听全部清理。
- [ ] 自定义内建组件使用原始 key；调用点实际使用的每个属性、事件和默认子节点均有对应行为，未把 `$attrs` / `$listeners` / slot 透传误当作完整兼容。
- [ ] 滚动锁覆盖任务要求的全部真实目标，并在关闭、切页和卸载时幂等恢复各自原值。
- [ ] Web-only 弹层完成触发元素记录、焦点进入/恢复、Tab/Escape 与监听清理。
- [ ] `:hover`、浏览器私有伪元素和 safe-area 等浏览器 CSS 的所有出现位置均已隔离到 Web 输出。
- [ ] 样式条件编译的 `@mpx-if` / `@mpx-endif` 完整配对，没有跨 style 块或遗漏闭合。
- [ ] 连续手势后的误触抑制只消费当前手势产生的一次合成 `tap`，没有使用延时窗口。
- [ ] 视觉缩放后的 flex/inline 子项已校正布局占位与变换原点，并验证容器宽度和基线未漂移。
- [ ] 已逐个完成所有修改 `.mpx` 文件的 Web 目标构建校验。

## 编译校验脚本

> 脚本位置：`<skill-root>/scripts/compile-validate.js`，其中 `<skill-root>` 是本 skill 的实际安装目录，例如 `.agents/skills/mpx2web`。

先运行不依赖业务构建环境的条件编译语义检查，再运行真实 Web 构建：

```bash
node <skill-root>/scripts/validate-conditional-compile.js src/components/foo.mpx src/pages/index.mpx
```

`compile-validate.js` 基于业务项目内安装的 `@mpxjs/mpx-cli-service`、`@mpxjs/cli-shared-utils` 与 `@mpxjs/vue-cli-plugin-mpx` 进行 Web 目标真实编译校验。Mpx 核心仓库本身不一定包含业务构建依赖，应在安装了 Mpx CLI 的业务项目中执行，或使用业务项目已有 Web 构建命令。

```bash
node <skill-root>/scripts/compile-validate.js src/components/foo.mpx --target=web
node <skill-root>/scripts/compile-validate.js src/pages/index.mpx --type=page --target=web
node <skill-root>/scripts/compile-validate.js src/components/foo.mpx --target=web --json
```
