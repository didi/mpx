# Skyline 评测工作区

每个 iteration 自带执行器与评分器；各测试集共享顶层依赖，不引用其他轮次。通用 `tools/` 属于测试集环境；依赖、锁文件和 node_modules 统一位于 workspaces 顶层，删除旧 iteration 时保留这些公共文件。所有现存轮次均可按各自 README 的入口运行；已有结果不可覆盖，应复制定义、输入与必要快照新建轮次。

`tools/compile-validate.js` 保留为编译入口，运行时和编译器均解析顶层共享安装的 npm 包。

Python 入口只依赖本轮脚本、定义和输入；报告仍使用公共 skill-creator。iteration-7 已按要求删除；保留的 iteration-8 使用本轮冻结 Skill；各 workspace 共用同一套发布依赖。各轮 source-snapshot.json 记录维护后的文件；仅保留最终汇总。

```bash
# 在需要执行的 iteration 目录中运行，不启动模型的准备检查：
PYTHONDONTWRITEBYTECODE=1 python3 run_evals.py --model <model-id> --reasoning-effort <effort>
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s . -p 'test_*.py'
```

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
