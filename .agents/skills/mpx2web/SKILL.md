---
name: mpx2web
description: Mpx 输出 Web（Mpx2Web）的 Web-only 差异指南，聚焦 Web 端特有配置、浏览器能力、H5 SDK、Vue 组件、Web CSS、路由部署、SSR/SEO 与 Web 运行时差异。当前尚无 mpx base skill，遇到通用 Mpx 基础语法、通用条件编译或通用组件开发问题时，先读取 mpx2rn skill 中可复用的公共部分，再回到本 skill 处理 Web-only 差异；未来有 mpx base skill 后替换该过渡指引。
metadata:
  version: "1.1.0"
  author: wangcuijuan
---

# Mpx2Web Web-only 差异指南

## 定位

本 SKILL 只保留 Mpx 输出 Web 时的 **Web-only** 内容。Mpx 单文件组件结构、模板基础语法、通用条件编译、通用节点访问、通用组件开发规范等能力当前先参考 `../mpx2rn` 公共部分。

> 过渡说明：当前仓库还没有 mpx base skill。遇到上述通用基础能力时，先读取 `../mpx2rn` 中可复用的公共部分作为临时 base；只借用 Mpx 通用写法与流程，不采纳 RN-only 能力结论。未来新增 mpx base skill 后，将本段替换为读取 mpx base skill。

Web-only 内容包括：

- Web 运行时配置：路由、部署路径、挂载节点、分包、异步组件、SSR。
- 浏览器能力：DOM、`window` / `document`、HTML/SVG 原生标签、Web 标准无障碍属性。
- H5 生态：第三方 H5 SDK、Vue 组件、自定义 Web 内建组件。
- Web 样式：`rpx` 到 Web 单位转换、viewport、安全区域、Web-only CSS、浏览器滚动、细线增强。
- Web 降级：浏览器无法提供的宿主能力在 Web 下的替代方向。

## 知识库索引

| 知识库 | 何时读取 |
| --- | --- |
| [临时公共基础：Mpx2RN 公共部分](../mpx2rn/SKILL.md) | 当前无 mpx base skill 时，读取其中 SFC、通用条件编译、通用模板/脚本/样式/JSON 开发约束；忽略 RN-only 适配结论 |
| [条件编译](./references/conditional-compile.md) | 判断某段逻辑是否属于 Web-only，是否应隔离到 Web 输出 |
| [Web 模板能力参考](./references/web-template-reference.md) | 使用 HTML/SVG 原生标签、Web 标准属性、Web 缺失/降级组件时读取 |
| [Web 脚本能力参考](./references/web-script-reference.md) | 处理 Web 路由、浏览器生命周期、Web 运行时实例差异、状态与 SSR 入口时读取 |
| [Web 样式实践](./references/web-style-practice.md) | 处理 Web 单位、viewport、安全区域、Web-only CSS、滚动与细线时读取 |
| [Web 环境 API 参考](./references/web-api-reference.md) | 核对 `@mpxjs/api-proxy` 在 Web 的浏览器实现与不可用能力时读取 |
| [Web JSON 配置参考](./references/web-json-reference.md) | 处理 Web 路由、tabBar、分包、异步组件、抽象节点、Web 配置时读取 |
| [H5 生态混合开发](./references/web-hybrid-dev.md) | 接入 DOM、H5 SDK、Vue 组件、自定义 Web 内建组件时读取 |
| [SSR 专项参考](./references/ssr-reference.md) | 处理 SSR、SEO、服务端数据预取、状态注水、异步分包 hydrate 时读取 |

## Web-only 判断

改造或新建前先判断问题是否真的属于 Web-only：

- 只是普通模板、普通脚本、普通样式或普通 JSON 配置：当前先读取 `mpx2rn` 公共部分，未来替换为 mpx base skill。
- 需要浏览器对象、DOM、H5 SDK、Vue 组件、Web-only CSS：使用本 skill。
- 需要 Web 路由、部署、分包、异步组件、SSR/SEO：使用本 skill。
- Web 下缺失某类宿主能力，需要 Web 替代方案：使用本 skill。

## 任务流程

1. 先读取 `mpx2rn` 公共部分补齐 Mpx 通用上下文；只使用公共基础，不沿用 RN-only 适配判断。
2. 定位 Web-only 差异点：能力缺失、浏览器增强、H5 生态接入、Web 配置或 SSR。
3. 优先保持通用 Mpx 实现不变，只把 Web-only 片段隔离出来。
4. Web-only 依赖不要放在通用模块顶层静态引入；差异较大时使用 `.web.mpx` 文件维度隔离。
5. SSR 场景下不要把“Web 编译目标”等同于“浏览器运行环境”，浏览器对象访问规则见 [SSR 专项参考](./references/ssr-reference.md)。
6. 完成后至少校验 Web 目标真实构建。

## 检查清单

- [ ] 文档或实现没有重复讲 `mpx2rn` 公共部分当前承接的基础语法、节点访问、条件编译语法或通用组件规范。
- [ ] Web-only 能力、Web-only CSS、H5 SDK、Vue 组件、SSR 客户端逻辑已被最小范围隔离。
- [ ] Web 路由、部署路径、资源路径、挂载节点、分包和异步组件配置符合 Web 输出要求。
- [ ] SSR 页面没有在服务端阶段访问浏览器对象。
- [ ] 已完成 Web 目标构建校验。

## 编译校验脚本

> 脚本位置：`<skill-root>/scripts/compile-validate.js`，其中 `<skill-root>` 是本 skill 的实际安装目录，例如 `.agents/skills/mpx2web`。

该脚本基于业务项目内安装的 `@mpxjs/mpx-cli-service`、`@mpxjs/cli-shared-utils` 与 `@mpxjs/vue-cli-plugin-mpx` 进行 Web 目标真实编译校验。Mpx 核心仓库本身不一定包含业务构建依赖，应在安装了 Mpx CLI 的业务项目中执行，或使用业务项目已有 Web 构建命令。

```bash
node <skill-root>/scripts/compile-validate.js src/components/foo.mpx --target=web
node <skill-root>/scripts/compile-validate.js src/pages/index.mpx --type=page --target=web
node <skill-root>/scripts/compile-validate.js src/components/foo.mpx --target=web --json
```
