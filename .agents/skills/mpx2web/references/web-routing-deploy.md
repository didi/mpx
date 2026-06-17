# Web 路由、部署与 SEO/SSR

> **填充说明（待补充，删除本块后正式发布）**：本文件为 **Web 专属能力**参考（RN/小程序无对应），mpx2rn skill 中没有同类文档。填充时参考 `docs-vitepress/guide/advance/ssr.md`、`custom-output-path.md` 等仓库文档。

## 目录

- [路由模式](#路由模式)
- [部署路径 publicPath](#部署路径-publicpath)
- [页面标题与 meta](#页面标题与-meta)
- [SEO](#seo)
- [服务端渲染 SSR](#服务端渲染-ssr)

---

## 路由模式

> **重要**：Mpx 自带一套与微信小程序对齐的跨端路由逻辑。开发者**统一使用 `mpx.navigateTo` / `mpx.redirectTo` / `mpx.switchTab` / `mpx.navigateBack` / `mpx.reLaunch` 进行跳转**，由 Mpx 在编译到 Web 时内部映射到 Web 路由。**不要在 `.mpx` 中直接引入 `vue-router` 或手写 Web 路由跳转。**

TODO：
- Web 输出底层基于路由（history / hash 模式）实现页面跳转——属于框架内部机制，业务无需直接接触。
- 路由模式的配置位置与默认值。
- Mpx 导航 API（`navigateTo` 等）在 Web 的行为与小程序的差异（如 `switchTab` 与 tabBar 的关系）。

## 部署路径 publicPath

TODO：
- `publicPath` / 部署子路径配置，资源引用与路由 base 的关系。
- 非根路径部署的注意事项。

## 页面标题与 meta

TODO：
- 页面 `navigationBarTitleText` → `document.title` 的映射。
- 自定义 `<meta>`、分享卡片信息（小程序 `onShareAppMessage` 在 Web 的替代）。

## SEO

TODO：
- CSR 下的 SEO 局限与建议。
- 关键 meta / 结构化数据注入方式。

## 服务端渲染 SSR

TODO：
- Mpx 对 Web SSR 的支持（参见仓库 `docs-vitepress/guide/advance/ssr.md`）。
- SSR 下需规避的浏览器专属 API（`window` / `document` 直接访问）与生命周期注意事项。
