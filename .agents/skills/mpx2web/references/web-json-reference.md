# 跨端输出 Web JSON 配置参考

> **填充说明（待补充，删除本块后正式发布）**：本文件为骨架。填充时**重点标注小程序专属、Web 不支持的字段**（如 `workers` / `plugins` / 云开发相关），以及与路由部署耦合的字段。注意 `tabBar` 在 Web **支持**（Mpx 渲染等效 tabbar）。

## 目录

- [应用配置](#应用配置)
- [页面配置](#页面配置)
- [组件配置](#组件配置)
- [分包与分包异步化](#分包与分包异步化)

---

## 应用配置

TODO 表格（字段 | Web 支持 | 说明）：
- `pages` —— ✅（与路由耦合，详见 [Web 路由、部署与 SEO/SSR](./web-routing-deploy.md)）
- `window`（`navigationBarTitleText` 等）—— TODO
- `tabBar` —— ✅ **Web 支持（Mpx 渲染等效 tabbar）**
- `subPackages` / `preloadRule` —— TODO（Web 打包行为）
- `networkTimeout` / `debug` —— TODO
- `workers` / `plugins` / 云开发 / `useExtendedLib` —— **小程序专属，Web 不支持，需隔离**

## 页面配置

TODO：`navigationBarTitleText`（→ document.title / 页面头部）/ `enablePullDownRefresh` / `onReachBottomDistance` / `disableScroll` / `backgroundColor` 等在 Web 的支持。

## 组件配置

TODO：`component: true` / `usingComponents` / `componentGenerics`（抽象节点）在 Web 的支持。

## 分包与分包异步化

TODO：分包在 Web 的打包/加载行为，异步分包 `async` 引用的支持。
