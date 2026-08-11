# TaskBoard 页面需求

创建一个无外部依赖的任务看板页面。页面内置一组任务数据，每项包含 `taskKey`、`title`、`category` 和 `completed`，并提供“全部 / 工作 / 生活”三个筛选项。

页面需满足以下功能：

- 顶部展示页面标题和当前筛选结果数量。
- 点击筛选项后切换当前分类，并明显区分选中状态。
- 使用 `computed` 派生筛选后的任务列表；每个循环节点使用稳定的 `wx:key`。
- 点击任务卡片后切换其完成状态，并在视觉上区分已完成与未完成任务。
- 筛选结果为空时展示空状态文案。
- 页面可能通过 query 参数 `category` 指定初始分类。使用组合式 `onLoad(rawQuery, decodedQuery)` 同步注册生命周期，并优先读取已解码的 `decodedQuery.category`；非法分类回退到“全部”。
- RN 页面默认不可滚动，主体内容必须由纵向 `scroll-view` 承载。

项目已正确接入 `@mpxjs/unocss-plugin`、`@mpxjs/unocss-base` 和 `@mpxjs/webpack-plugin`，并使用 `presetMpx()`。请使用 `.mpx` 单文件页面完成，并满足以下实现约束：

- 必须使用 `<script setup>` 组合式 API，通过 `ref`、`computed` 和 `onLoad` 组织页面逻辑，并用 `defineExpose` 显式暴露模板绑定。
- 所有视觉样式都通过模板中的 UnoCSS 原子类实现，不要添加 `<style>` 区块，也不要手动引入 `uno.css`。
- 静态原子类写在 `class` 中；动态类使用 `wx:class` 并写出完整 token，不得在 class 字符串中通过 Mustache 或脚本片段拼接类名。
- 半透明背景或文字颜色至少使用一次斜杠 alpha 写法（如 `bg-blue-500/10`），不要组合 `bg-opacity-*`、`text-opacity-*` 等独立透明度工具类。
- 只使用 Mpx2RN 支持的工具类和 variants。不得使用 grid、sticky、line-clamp、space-x/space-y、transition-all、animation，或 `active:` / `focus:` / `data-*:` / `aria-*:` 等不支持的 variant。
- 事件参数使用内联传参，不使用 `data-*` / `dataset`；动态类使用 `wx:class`；Mustache 中不调用普通方法。
- 用户可见文字使用 `text` 组件显式包裹，点击目标使用 `hover-class`。
- 不使用外部组件、图片资源、平台专属 API 或不必要的条件编译。
- 通过页面 JSON 设置导航栏标题为“任务看板”，并设置 `disableScroll: true`，不要添加 RN 不支持的页面配置。
