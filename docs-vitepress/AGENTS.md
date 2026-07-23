# 文档开发指南

`docs-vitepress/` 是 Mpx 官方文档站点，基于 [VitePress](https://vitepress.dev/zh/) 构建，部署后即 [https://mpxjs.cn/](https://mpxjs.cn/)。本文档面向 Agent，描述文档站点的整体组织结构、内容归档原则与索引位置，便于新增、修改、迁移文档时快速定位。

## 本地开发

```sh
# 写作时
npm run docs:dev

# 部署时构建静态产物（输出到 .vitepress/dist）
npm run docs:build
```

## 编写规范

参考 [desc.md](desc.md)。要点：

- 中英文混排时英文单词两侧加空格（标点边缘或句首可省略）；句首英文单词首字母大写
- 框架名统一写作 `Mpx`（首字母大写）
- 除英文段落外，标点统一使用中文半角
- 优先用示例代码说明（show me the code）
- 拓展说明用 `>` 引用块

### 中文标题哈希锚点

新增或修改中文标题时，使用 `{#simple-hash}` 语法显式指定英文锚点，避免默认生成的 `#中文标题` 形式：

```markdown
# 文档标题 {#simple-hash}
```

约束：

- 锚点只能包含小写字母、数字和短横线（`-`），不能含空格或其它特殊字符
- 不能以短横线开头或结尾
- 同一文档内不能重复
- 锚点应根据中文标题语义命名

## 顶层目录结构

| 目录 | 内容定位 | 备注 |
| --- | --- | --- |
| [.vitepress/](.vitepress/) | VitePress 配置：导航、侧边栏、主题、PWA、搜索翻译等 | 新增文档需同步更新 [.vitepress/config.ts](.vitepress/config.ts) 的 `sidebar` |
| [guide/](guide/) | 使用指南：基础、进阶、跨端、组合式 API、工具、拓展、原理、迁移 | 站点主入口，承载教程类内容 |
| [api/](api/) | 框架 API 参考：全局/实例/编译/响应式/组合式/选项式 API、指令、内建组件 | `@mpxjs/core` 与 `@mpxjs/webpack-plugin` 的 API 字典 |
| [api-proxy/](api-proxy/) | 环境 API 参考：`@mpxjs/api-proxy` 跨端宿主能力，按 base/route/interface/network/media/device/storage/location/open-api/payment/ext/canvas/wxml 分类 | 每个 API 一个 `.md` 文件 |
| [articles/](articles/) | 文章合辑：版本发布说明、技术揭秘、性能/包体积/单测等专题 | 时间线归档，包含历次 release 文章 |
| [assets/](assets/) | 文档内引用的图片、示意图等静态资源 | 仅用于文档内 `![]()` 引用 |
| [public/](public/) | 公共静态资源（logo、favicon、PWA icon 等） | 由 VitePress 直接复制到产物根目录 |
| [index.md](index.md) | 站点首页（`home: true`）：hero、特性、案例、生态、社区、资源 | 内容以 frontmatter 数据驱动主题渲染 |
| [desc.md](desc.md) | 面向人类作者的写作规范说明 | 与本文件互补，本文面向 Agent |

## 内容归档原则

新增或迁移文档时，先按"读者意图"判断归属，再决定落地目录：

### `guide/` —— 使用指南（教程视角）

教读者「怎么用 Mpx 完成某件事」。文件按主题分组，组与 `.vitepress/config.ts` 中的侧边栏分组一一对应：

- [guide/basic/](guide/basic/) —— 基础：项目结构、App/Page/Component、模板/样式/事件/绑定/生命周期
- [guide/advance/](guide/advance/) —— 进阶：状态管理、分包、i18n、SSR、TS、原子类、size-report、CLI、自定义路径等
- [guide/cross-platform/](guide/cross-platform/) —— 跨端基础：跨端配置、条件编译
- [guide/rn/](guide/rn/) —— 跨端 RN：RN 输出相关的快速开始、组件、模板、样式、应用能力、混编
- [guide/composition-api/](guide/composition-api/) —— 组合式 API、响应式 API
- [guide/tool/](guide/tool/) —— 工具：单元测试、E2E
- [guide/extend/](guide/extend/) —— 周边拓展：fetch、mock、webview-bridge
- [guide/understand/](guide/understand/) —— 原理：运行时增强、编译构建
- [guide/migrate/](guide/migrate/) —— 版本迁移指南

判断依据：内容是「面向场景的操作步骤」就放 `guide/`；如果是「字典式 API 罗列」放 `api/` 或 `api-proxy/`。

### `api/` —— 框架 API 参考（字典视角）

`@mpxjs/core` / `@mpxjs/webpack-plugin` 暴露的 API、配置项、指令、内建组件、生命周期钩子等。每个文件聚焦一类 API（如 [api/composition-api.md](api/composition-api.md)、[api/directives.md](api/directives.md)）。新增 API 时优先追加到既有文件，避免碎片化。

### `api-proxy/` —— 环境 API 参考

`@mpxjs/api-proxy` 提供的跨端宿主能力。组织遵循微信小程序 API 分类：

- `base/`（含 `app/`、`system/`）、`route/`、`interface/`（含 `interactive/`、`navigation-bar/`、`tab-bar/`、`pull-down-refresh/`、`scroll/`、`animation/`、`custom-component/`、`menu/`、`window/`）
- `network/`（含 `request/`、`download/`、`upload/`、`websocket/`）
- `media/`（含 `image/`、`audio/`、`video/`）、`device/`（含 `bluetooth-ble/`、`clipboard/`、`contacts/`、`keyboard/`、`network/`、`phone/`、`scan/`、`screen/`、`vibrate/`）
- `storage/`、`location/`、`open-api/`（含 `login/`、`setting/`、`user-info/`）、`payment/`、`ext/`、`canvas/`、`wxml/`

约定：一个 API 一个 `.md`，文件名与 API 同名（驼峰）。新增能力分类时同步在 `.vitepress/config.ts` 的 `'/api-proxy/'` 侧边栏树补充节点。

### `articles/` —— 文章与 release notes

按时间线归档的专题文章和版本发布说明（`2.x-release.md`、`mpx1.md`、`performance.md`、`unit-test.md` 等）。新增 release 文章时同步在 `.vitepress/config.ts` 的 `'/articles/'` 侧边栏补充入口。

### `assets/` 与 `public/`

- 文档正文引用的图片放 [assets/](assets/)
- 站点级静态资源（logo、favicon、PWA 图标）放 [public/](public/)，由 VitePress 直接复制到产物根目录

## 索引（必须同步维护）

新增、删除、重命名 `.md` 文件时，必须同步更新：

1. **[.vitepress/config.ts](.vitepress/config.ts)** —— `sidebar` 对象
   - `'/guide/'`、`'/api/'`、`'/api-proxy/'`、`'/articles/'` 四个侧边栏入口
   - 顶部导航 `themeConfig.nav` 中的相关链接（如有跨区跳转）
2. **目录内的 `index.md`**（部分目录有，如 [api/index.md](api/index.md)、[api-proxy/index.md](api-proxy/index.md)、[guide/extend/index.md](guide/extend/index.md)、[articles/index.md](articles/index.md)）—— 内部目录列表
3. **跨文档链接** —— 移动或重命名文件后，使用全局搜索更新引用：

   ```sh
   grep -r "/old/path" docs-vitepress
   ```

## 更新文档的标准动作

1. 判断内容归属（按上面的「内容归档原则」）
2. 在对应目录新增或修改 `.md`
3. 同步 [.vitepress/config.ts](.vitepress/config.ts) 的侧边栏与导航
4. 如新增子目录，同步对应目录的 `index.md`
5. 全局检查跨文档链接是否需要修正
6. `npm run docs:dev` 本地预览，确认侧边栏、链接、图片均渲染正常

## 路径指引

- 修改某个特性的使用方式 → `guide/` 对应分组
- 新增/修改框架 API → `api/` 中相应文件，避免新建零散文件
- 新增/修改环境 API → `api-proxy/<分类>/<apiName>.md`
- 撰写版本发布说明、技术专题 → `articles/`
- 调整侧边栏、导航、主题、搜索翻译、PWA → `.vitepress/`
- 调整首页 hero/特性/案例 → [index.md](index.md) 的 frontmatter
- 调整写作风格规范 → [desc.md](desc.md)
