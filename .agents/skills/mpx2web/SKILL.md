---
name: mpx2web
description: Mpx 输出 Web（Mpx2Web）的 Web-only 差异指南，聚焦 Web 配置、浏览器能力、H5 SDK、Vue 组件、Web CSS、路由部署、SSR/SEO 与 Web 运行时差异。用于把已有 Mpx 页面或组件适配到 Web、排查 Web 构建或运行问题，以及核对跨端业务是否退化。
metadata:
  version: "1.9.15"
  author: wangcuijuan
---

# Mpx2Web Web-only 差异指南

## 定位

本 Skill 聚焦 Mpx 输出 Web 的差异。普通 Mpx 结构、公共语法和项目既有写法沿用输入与同版本仓库文档，不为补充通用背景预读其他跨端 Skill，也不将 RN-only 限制套用到 Web。

已有项目适配时，先确认原目标端、构建入口和工作现状，保护原有业务行为；新建或排障任务按实际需求确定基线。只修改有需求、症状或源码证据的差异，不把预期解法假定为输入已经存在。

## 知识库索引

入口负责决策和路由，具体事实由对应参考维护。按当前问题读取相关小节；除 Web API 参考明确维护完整支持清单外，其它参考未列出某能力不等于不支持，缺失、冲突或版本不符时查询目标项目源码及测试。

| 知识库 | 何时读取 |
| --- | --- |
| [条件编译](./references/conditional-compile.md) | 判断某段逻辑是否属于 Web-only，是否应隔离到 Web 输出 |
| [Web 模板能力参考](./references/web-template-reference.md) | 使用 HTML/SVG 原生标签、核对组件整体缺失或局部属性缺失、选择 Web 替代方案时读取 |
| [Web 脚本能力参考](./references/web-script-reference.md) | 处理 Web 页面状态、生命周期、实例差异与宿主语义时读取；配置和 SSR 细节转到各自专项 |
| [Web 样式实践](./references/web-style-practice.md) | 处理 Web 下的 `rpx` 转换、viewport、浏览器私有 CSS 与页面滚动差异时读取 |
| [Web 环境 API 参考](./references/web-api-reference.md) | 核对 `@mpxjs/api-proxy` 在 Web 的浏览器实现与不可用能力时读取 |
| [Web JSON 配置参考](./references/web-json-reference.md) | 处理 Web 路由、tabBar、分包、异步组件、Web 配置时读取 |
| [H5 生态混合开发](./references/web-hybrid-dev.md) | 接入 DOM、H5 SDK、Vue 组件、自定义 Web 内建组件时读取 |
| [WebView Bridge 参考](./references/webview-bridge-reference.md) | 在 `web-view` 嵌入页中使用 `@mpxjs/webview-bridge`，处理消息、导航、自定义 API、宿主 SDK 与来源安全时读取 |
| [SSR 专项参考](./references/ssr-reference.md) | 处理 SSR、SEO、服务端数据预取、状态注水与切换竞态、同构请求层、异步分包 hydrate 时读取 |

## 阅读与验证

- 按实际问题从上表选择直接相关的参考，大型文件先搜索对应标题或能力；参考不足或与目标版本冲突时再查源码，不预读整套知识库。
- 同类型、同目标的受影响文件合并校验。存在条件分支或新增 `TODO(web)` 时先统一检查，再用一次 `compile-validate.js` 覆盖对应批次；页面与组件需要不同编译入口时才拆分。
- 只有相关文件或配置继续变化时才重跑校验。同一失败最多修复后重试两次；环境或依赖不足时记录待验证范围。
- 最终通过受影响文件清单、`git diff` 和针对性搜索复查，并分别说明静态检查、编译与运行验证的实际范围。

## 任务流程

1. 读取输入、症状和实际构建配置，确认需要保留的业务入口、事件与目标端。多入口或多能力改造可列出“需求、实现位置、验证方式”清单；简单修复无需额外台账或报告。
2. 按上节取证，确认每个差异在当前目标版本中的实际边界。
3. 隔离实际 Web 差异，优先保留通用实现。局部属性、事件、样式或客户端分支能清晰表达时无需新增平台副本；结构或依赖明显分叉时可采用平台文件，并说明原因。依赖加载的执行环境与 DOM 时机见条件编译参考。
4. 按实际调用契约完成适配。组件先区分能力完整、局部缺失和整体缺失；涉及 `selectComponent` / `selectAllComponents` 时，核对模板标识经 Web 编译后的形态和当前运行时 matcher。具体方法见 Web 模板与脚本能力参考，未解决项执行下方统一待接入规则。
5. 按上节规则批量验证实际目标，并确认受影响文件进入对应目标的依赖图；未被入口引用的文件可补充一次局部编译。原目标端按项目确定，不固定为微信。
6. 复查改动并说明实现结果、验证范围和未解决限制。编译通过不代表交互等价；布局、媒体、异步资源、SSR 和通信等行为按本次改动风险补充运行验证。环境不足时明确待验证项，不把未执行写成通过。

## 统一待接入规则

只在确认 Web 能力整体或局部缺失、且项目没有可直接接入的现成方案时添加待接入说明：

- 保留原目标端实现并做真实平台隔离；局部缺失只隔离缺失项，继续共用其余属性、事件和状态链。组件整体缺失时还要隔离模板与 `usingComponents`、模块导入等依赖入口。
- 同一业务边界合并为一条相邻的 `TODO(web)`，不要按每个属性、方法或平台分支重复书写。内容写清缺少的能力、业务需要接入的实际组件、数据源、SDK 或交互方案，以及需要复用的关键状态或事件；已经实现的能力不留 TODO。
- 模板、script、style 分别使用 `<!-- TODO(web): 具体业务接入说明 -->`、`// TODO(web): 具体业务接入说明`、`/* TODO(web): 具体业务接入说明 */`。TODO 只写在对应语言的注释中，不渲染为页面文字，也不放进字符串。
- 可以在 Web 边界单独展示真实的“未接入”状态，但不能用临时按钮、静态列表、手写遮罩、固定结果或伪 API 声称能力已经完成。只有用户明确要求并给出可接受的降级目标时，才新增替代 UI。

## 行为保护

- 保留原有 API、事件载荷、路由通信及目标端行为，不因命名偏好替换已工作的调用方式。
- 除 Web API 参考明确维护的完整支持清单外，不为参考未覆盖的能力删除功能；先用目标版本源码或实际消费者确认能力边界，示例不代表唯一实现。
- 样式隔离取决于目标端支持情况与业务需求，不能按 `safe-area` 等关键词一律划为 Web-only。媒体尺寸变化需确认现有布局和刷新机制是否足够，仅对实际缺口补充处理。
- 使用 `autoVirtualHostRules` 前，先确认具体组件的 Web 宿主节点确实中断了 flex、滚动或样式关系；只匹配产生问题的组件，不因它位于 `scroll-view`、组件链或相邻组件中就扩大到父子链。
- SDK、滚动、弹层、请求和通信仅检查本次实际涉及的生命周期、资源身份及业务契约，具体处理见专项参考，不为未使用能力补造完整实现。
- SSR 任务涉及旧 `createStore`、共享 store 或服务端首屏状态复用时，读取 SSR 专项的迁移决策，优先核对 `onAppInit` 创建请求级 Pinia、页面使用同一 store、服务端预取等待和框架默认注水链；不要在官方链之外并行拼装另一套恢复协议。
- WebView 安全以 Bridge 专项说明和实际接收入口为准；业务 ID 检查不能代替来源校验，也不能假定内建组件已完成严格实例隔离。

## 编译校验脚本

`<skill-root>` 表示本 Skill 的实际安装目录，例如 `.agents/skills/mpx2web`。这些脚本只检查对应范围；输出“待验证”表示工具无法确认，不算通过。

### 条件注释与 TODO 检查

检查 `@mpx-*` 条件注释的语法与配对，以及 `TODO(web)` 的注释格式。可一次传入多个文件或目录；业务正确性和依赖隔离仍由源码评审与构建确认。

```bash
node <skill-root>/scripts/validate-conditional-compile.js src/components/foo.mpx src/pages/index.mpx
```

### WXS 事件检查

存在 WXS 事件绑定时，检查编译后的 Web 模板是否仍直接绑定 WXS。传入项目根目录；存在平台文件、非微信源语法或环境区块时，再提供实际的 `--web-file`、`--src-mode` 和 `--env`。该检查不验证交互等价性。

```bash
node <skill-root>/scripts/validate-wxs-web-events.js src/components/foo.mpx --project-root=/path/to/project
node <skill-root>/scripts/validate-wxs-web-events.js src/components/foo.mpx --web-file=src/components/foo.web.mpx --src-mode=ali --env=production --project-root=/path/to/project
```

### 局部编译与项目构建

将多个同类型文件放入一次 `compile-validate.js` 调用；`--target=web,wx` 可同时覆盖两端，页面使用 `--type=page` 单独成批。该脚本只做局部编译，不能证明完整依赖、路由、部署或 SSR/hydrate 正确，涉及这些能力时继续执行项目构建和对应运行验证。

```bash
node <skill-root>/scripts/compile-validate.js src/components/foo.mpx src/components/bar.mpx --target=web,wx
node <skill-root>/scripts/compile-validate.js src/pages/index.mpx --type=page --target=web
```
