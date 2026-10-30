# mpx-workplace

面向统一 [mpx Skill](../../mpx/SKILL.md) 的多端兼容评测工作区，目录名按任务要求保留为 `mpx-workplace`。

当前版本：[iteration-1](iteration-1/README.md)，**8 个 case、48 条唯一计分断言**。全部 case 同时覆盖微信 Skyline（保留 WebView 回退）、支付宝、RN（ios/android/harmony）和 Web，其中一个额外覆盖 Web SSR。

比较分组固定为 `mpx`（使用 mpx Skill）与 `noskill`（不使用 Skill），两组使用相同输入和评分标准。

- [评测配置](iteration-1/evals.json)
- [Case 分工与能力去重表](iteration-1/README.md)
- [评分与验证协议](iteration-1/grading-guide.md)
- [后续执行提示词模板](iteration-1/prompt_templates.json)

当前已具备独立执行器与证据评分入口，尚未运行真实模型评测，没有模型得分或宿主验证结论。参考 mpx2rn-workspace 的组织方式，未复制其历史输出和 RN 专用评分逻辑。

执行与评分命令见 [iteration-1 独立入口](iteration-1/README.md#独立执行与评分入口)。各轮不依赖其他评测工作区或旧 iteration。

## 共享发布包测试环境

五个测试集共用 `workspaces/package.json`、本地生成的 `package-lock.json` 和唯一的 `node_modules/`。框架统一使用 npm 官方源 `@mpxjs/*@latest`，不引用仓库 `packages/` 或复制/修改框架源码。

在 `workspaces/` 顶层准备一轮评测环境：

```bash
npm install
npm run update-framework
npm run check-env
npm test
```

子测试集仅保留自己的 `mpx.config.js`、Babel/ESLint 配置和执行脚本，Vue CLI 通过 `vuePlugins.resolveFrom` 从顶层发现插件；编译命令显式传入当前测试集 `--project-root=.`。各组共用本轮锁定版本，运行期间不更新。`npm ci` 仅复现锁文件，不保证最新版本。Webpack 使用与当前 Mpx 发布编译器兼容的 5.104.1，避免旧模块路径回退到仓库 Webpack 导致混用。

Skill 快照仅用于两组隔离。已有最终汇总来自历史环境，不代表当前发布包已完成模型评测；产物回归检查需要重新生成已清理的模型产物。重新评测应新建轮次，保留历史汇总。
