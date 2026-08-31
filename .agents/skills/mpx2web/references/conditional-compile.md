# Mpx2Web 条件编译口径

本文档只补充 Mpx2Web 场景下的条件编译决策口径。条件编译的通用语法与基础规则当前先参考 `../mpx2rn` 公共部分，未来替换为 mpx base skill，不在本文重复描述。

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
