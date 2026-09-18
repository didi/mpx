---
name: mpx2web
description: Mpx 输出 Web（Mpx2Web）的 Web-only 差异指南，聚焦 Web 配置、浏览器能力、H5 SDK、Vue 组件、Web CSS、路由部署、SSR/SEO 与 Web 运行时差异。用于把已有 Mpx 页面或组件适配到 Web、排查 Web 构建或运行问题，以及核对跨端业务是否退化。
metadata:
  version: "1.9.10"
  author: wangcuijuan
---

# Mpx2Web Web-only 差异指南

## 定位

本 Skill 聚焦 Mpx 输出 Web 的差异。普通 Mpx 结构、公共语法和项目既有写法沿用输入与同版本仓库文档，不为补充通用背景预读其他跨端 Skill，也不将 RN-only 限制套用到 Web。

已有项目适配时，先确认原目标端、构建入口和工作现状，保护原有业务行为；新建或排障任务按实际需求确定基线。只修改有需求、症状或源码证据的差异，不把预期解法假定为输入已经存在。

## 知识库索引

入口负责决策和路由，具体事实由对应参考维护。按当前问题读取相关小节；参考未列出某能力不等于不支持，缺失、冲突或版本不符时查询目标项目源码及测试。

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

## 任务流程

1. 读取输入、症状和实际构建配置，确认需要保留的业务入口、事件与目标端。多入口或多能力改造可列出“需求、实现位置、验证方式”清单；简单修复无需额外台账或报告。
2. 按索引定位相关参考和实现。只涉及路由配置时先读 JSON 参考；涉及导航标签或 EventChannel 时再补充模板或 API 参考，不固定要求同时读取多份文档。
3. 隔离实际 Web 差异，优先保留通用实现。局部属性、事件、样式或客户端分支能清晰表达时无需新增平台副本；结构或依赖明显分叉时可采用平台文件，并说明原因。依赖加载的执行环境与 DOM 时机见条件编译参考。
4. 按实际调用契约完成适配。基础组件需区分“标签可编译”“属性/事件有实现”和“满足业务语义”；参考有遗漏时查源码，不将参考表当作封闭白名单。
5. 验证覆盖所有受影响文件及实际目标。一次项目构建可覆盖多个文件，需确认它们进入对应目标依赖图；未被入口引用的文件可补充局部编译。原目标端按项目确定，不固定为微信，也不要求每个文件分别启动完整构建。
6. 复查改动并说明实现结果、验证范围和未解决限制。编译通过不代表交互等价；布局、媒体、异步资源、SSR 和通信等行为按本次改动风险补充运行验证。环境不足时明确待验证项，不把未执行写成通过。

## 行为保护

- 保留原有 API、事件载荷、路由通信及目标端行为，不因命名偏好替换已工作的调用方式。
- 不为参考未覆盖的能力删除功能。确有缺失时先核实兼容方案，降级需符合用户需求或取得确认；沿用已有方案，不把某个示例写成唯一实现。
- 样式隔离取决于目标端支持情况与业务需求，不能按 `safe-area` 等关键词一律划为 Web-only。媒体尺寸变化需确认现有布局和刷新机制是否足够，仅对实际缺口补充处理。
- 使用 `autoVirtualHostRules` 前，先确认具体组件的 Web 宿主节点确实中断了 flex、滚动或样式关系；只匹配产生问题的组件，不因它位于 `scroll-view`、组件链或相邻组件中就扩大到父子链。
- SDK、滚动、弹层、请求和通信仅检查本次实际涉及的生命周期、资源身份及业务契约，具体处理见专项参考，不为未使用能力补造完整实现。
- WebView 安全以 Bridge 专项说明和实际接收入口为准；业务 ID 检查不能代替来源校验，也不能假定内建组件已完成严格实例隔离。

## 编译校验脚本

`<skill-root>` 表示本 Skill 的实际安装目录，例如 `.agents/skills/mpx2web`。以下工具分别提供有限检查，不能替代项目构建和运行验证。

### 条件注释检查

`validate-conditional-compile.js` 使用 Vue SFC、Babel 和 PostCSS 解析区块及真实注释，检查 `@mpx-*` 的位置、配对和条件表达式语法，不执行表达式。解析依赖从目标文件所在项目或 Skill 环境获取；依赖缺失、语法或预处理语言无法解析时返回“待验证”，不当作通过。它不验证条件运行结果、平台 API 或依赖图隔离，仍需项目构建及运行验证。

```bash
node <skill-root>/scripts/validate-conditional-compile.js src/components/foo.mpx src/pages/index.mpx
```

### WXS 事件检查

存在 WXS 事件绑定时，使用 `validate-wxs-web-events.js` 检查实际 Web 模板是否仍直接绑定 WXS。它使用目标项目安装的 `@mpxjs/webpack-plugin`，默认从输入目录解析依赖；需要时指定 `--project-root`。

发现同名平台文件时，先按项目解析规则确认 Web 实际入口，再传入 `--web-file`，此时一次检查一个输入。该参数是调用方确认，不是脚本自动解析的证明。依赖、入口或外部模板无法确认时返回“待验证”；自定义 env/defs 和交互等价性仍需项目构建与运行验证。

```bash
node <skill-root>/scripts/validate-wxs-web-events.js src/components/foo.mpx --project-root=/path/to/project
node <skill-root>/scripts/validate-wxs-web-events.js src/components/foo.mpx --web-file=src/components/foo.web.mpx --project-root=/path/to/project
```

### 局部编译与项目构建

`compile-validate.js` 使用业务项目内的 `@mpxjs/mpx-cli-service`、`@mpxjs/cli-shared-utils` 与 `@mpxjs/vue-cli-plugin-mpx` 执行真实编译器，但默认是页面/组件局部编译：

- 默认 `ignoreSubComponents = true`，非目标组件使用占位实现；旧版本回退仅剥离静态 JSON 区块顶层的 `usingComponents`，遇到动态或外联 JSON 时明确返回待验证，不改写普通业务脚本。
- 替换项目入口、关闭拆包并移除部分构建插件，因此不能证明完整依赖集成、路由、部署资源或 SSR/hydrate 正确。
- 脚本内部也执行条件注释检查；遇到误报可核实后使用项目已有构建命令验证，不把辅助检查结果当作编译器结论。

```bash
node <skill-root>/scripts/compile-validate.js src/components/foo.mpx --target=web
node <skill-root>/scripts/compile-validate.js src/pages/index.mpx --type=page --target=web
node <skill-root>/scripts/compile-validate.js src/components/foo.mpx --target=web --json
```

在安装了业务构建依赖的项目中执行。模块调用结束时会恢复进程环境变量；构建本身使用进程级环境和工作目录，同一进程中应串行调用。涉及应用集成时使用项目原有构建命令，确认实际平台文件与依赖覆盖情况。分别记录辅助检查、局部编译、项目构建及运行测试结果，不将其中一项通过等同于全部验证完成。
