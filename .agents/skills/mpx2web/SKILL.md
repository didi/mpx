---
name: mpx2web
description: 将已有 Mpx 代码输出 Web 的差异适配指南。依据目标项目源码和构建配置处理实际涉及的模板、脚本、样式、JSON、构建及运行时差异，保留原目标端行为；只有项目实际涉及 SSR 时才读取 SSR 专项参考。
metadata:
  version: "1.9.48"
  author: wangcuijuan
---

# Mpx2Web Web-only 差异指南

## 定位

本 Skill 只处理 Mpx 输出 Web 时的实际差异。通用 Mpx 结构和语法按需查询 `mpx-development-guides`；Web 支持边界以本 Skill 的对应参考、目标项目版本源码和测试为准。

适配已有项目时，以原平台现有行为为基线。能共用的代码继续共用，只修改有需求、现象或源码证据的 Web 差异；不要根据其它输出端的限制推断 Web，也不要假定输入未提供的组件、服务或方案已经存在。

## 知识库索引

主文件只负责决策。具体能力只在对应参考维护；参考未列出某能力不等于不支持，缺失、冲突或版本不符时查询目标版本源码及测试。

| 知识库 | 何时读取 |
| --- | --- |
| [Web 模板能力参考](./references/web-template-reference.md) | 核对模板事件、样式、内建组件、Vue 组件和组件降级方案 |
| [Web 脚本能力参考](./references/web-script-reference.md) | 处理 Web 生命周期、实例差异和宿主能力 |
| [Web 环境 API 参考](./references/web-api-reference.md) | 核对 `@mpxjs/api-proxy` 的 Web 实现、参数差异和不可用能力 |
| [Web 配置参考](./references/web-config-reference.md) | 处理应用 JSON、Web 路由、构建期配置和运行时 `mpx.config.webConfig` |
| [SSR 专项参考](./references/ssr-reference.md) | 仅项目已启用或明确要求 SSR 时读取；处理请求级状态、数据预取和客户端恢复 |

## 工作流程

1. 确认原代码的运行平台、业务入口、状态与事件链，以及项目实际使用的构建配置。
2. 从上表读取本次涉及的参考。参考没有说清或与项目版本不符时，查看目标版本源码和测试后再判断差异。
3. 按下节选择最小转换范围；能共用的部分保持不变，只有已确认的 Web 差异才做平台隔离。
4. 确认修改进入实际依赖图，运行相关静态检查、局部编译和项目自身验证；复查原平台行为，并说明实际完成的验证范围和未解决项。

## 最小差异转换

先把差异归类为“单个属性或字段”“单个节点或调用”“整项组件或整段结构”，在能表达真实差异的最小层级处理：

- 单个属性、事件或配置字段存在差异时，只隔离该项，保留同一节点或公共配置中的其它内容。
- 宿主 API 只有局部选项不支持，但现有 Web 基础能力足以完成业务时，用这些能力继续维护同一状态和确认、取消结果；不要把整个功能标成未接入。具体参数差异查 Web API 参考。
- JSON 只有少数字段不同时，使用一个可序列化的公共配置对象，只对差异字段条件赋值；两端大部分结构确实不同时才拆分完整区块。具体写法查 Web 配置参考。
- 页面和组件选项默认直接写在 `createPage({ ... })`、`createComponent({ ... })` 中。能力登记放在构造调用前，单个方法的平台行为写在方法内部；只有大范围选项分叉时才使用平台文件。
- 完整 SFC 区块确实需要分叉时，让无 `mode` 的默认区块继续承载原实现，Web 实现使用 `mode="web"`。不要把 Web 实现放进默认区块，再只用 `mode="wx"` 保存原实现。
- 修改后逐项对照输入中的节点、属性、事件、配置和状态引用。每一项删除或隔离都必须对应已确认的 Web 差异；发现额外删除时先恢复。

## 待接入规则

只有确认 Web 能力缺失、且项目没有现成组件、SDK、数据源或交互方案时才添加 `TODO(web)`：

- 保留原平台实现，并同时隔离 Web 不可解析的模板节点、`usingComponents`、模块导入等入口；局部缺失时继续共用其余能力。
- 同一业务缺口只写一条相邻 TODO，说明缺少什么、需要接入什么，以及必须复用的状态或事件；已经实现的部分不留 TODO。
- 模板、script、style 分别使用 `<!-- TODO(web): ... -->`、`// TODO(web): ...`、`/* TODO(web): ... */`，不要把 TODO 渲染为页面文字或放进字符串。
- 可以显示真实的“未接入”状态，但不能用临时按钮、固定结果、伪 API 或静态列表声称能力已经完成。

## 验证

- 修改平台条件或新增 `TODO(web)` 时，运行条件注释检查。
- 存在 WXS 事件绑定时，检查 Web 编译结果是否仍直接绑定 WXS。
- 将同类型、同目标端文件合并做局部编译；页面和组件需要不同入口时再拆开。
- 局部编译只证明当前文件能生成，不能证明依赖、路由、部署、交互或 SSR 正确；按改动风险继续运行项目构建和对应行为验证。
- 同一失败修复后最多重试两次。文件未继续变化时不要重复运行；环境不足时记录待验证范围。

下面的 `<skill-root>` 指本 Skill 目录，例如 `.agents/skills/mpx2web`。

```bash
# 条件注释与 TODO 格式
node <skill-root>/scripts/validate-conditional-compile.js src/components/foo.mpx src/pages/index.mpx

# WXS 事件
node <skill-root>/scripts/validate-wxs-web-events.js src/components/foo.mpx --project-root=/path/to/project

# 局部编译；页面使用 --type=page
node <skill-root>/scripts/compile-validate.js src/components/foo.mpx src/components/bar.mpx --target=web,wx
node <skill-root>/scripts/compile-validate.js src/pages/index.mpx --type=page --target=web
```
