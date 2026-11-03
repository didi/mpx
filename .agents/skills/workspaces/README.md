# Mpx Skill 评测工作区

五个工作区统一存放在本目录，保留原目录名：

| 工作区 | 当前保留轮次 |
| --- | --- |
| [mpx-workplace](mpx-workplace/README.md) | iteration-3 / iteration-2（仅报告） |
| [mpx2ali-workplace](mpx2ali-workplace/README.md) | iteration-3 |
| [mpx2rn-workspace](mpx2rn-workspace/iteration-18/README.md) | iteration-18 |
| [mpx2skyline-workspace](mpx2skyline-workspace/README.md) | iteration-8 |
| [mpx2web-workspace](mpx2web-workspace/iteration-13/README.md) | iteration-13 |

mpx-workplace 仅保留结果报告与可复用宿主配置；其余测试集保留执行器、配置、输入与评分逻辑；依赖统一安装在 workspaces 顶层，工具可共用，不依赖其他评测工作区或旧轮次。Skyline iteration-7 已删除。

从工作区根目录访问被测 Skill 使用 `../../mpx*`；从 iteration 目录访问公共汇总/查看器使用 `../../../skill-creator`。各轮 README 提供执行与验证命令。保留顶层共享环境、被测 Skill 及公共工具后，可独立清理旧轮次。


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

## Git 归档与产物存放

统一规则见 [.gitignore](.gitignore)。用例输入（`eval-*/input/`）、`eval_metadata.json`、配置、可复用执行/评分脚本继续追踪；结果报告保留 Markdown 和结构化汇总 JSON（如 `benchmark.json`、`compile-report.json`、`grading-summary.json`）。

新执行产生的临时工程、探针、原始诊断和其他未约定产物放入每轮 `.artifacts/`；最终报告放在 iteration 根目录或 `reports/`。已有执行器仍可使用各 case 分组目录、`outputs/`、`run-*/`、`logs/`、`skill-snapshot(s)/`、`audit/`、`validation/` 等旧路径，这些过程和交付产物均忽略；audit/validation 下明确的汇总报告保留。`review.html` 可能嵌入完整交付代码，只在本地生成，不作为报告提交。

已追踪的快照、查看器和临时审计探针已取消 Git 追踪，本地文件保留。历史报告中的产物链接仅供原执行环境定位，在新检出环境中可能不存在。

使用依赖冻结快照的旧执行器前，需要从选定 Skill 版本重新准备本地快照。以下为 workspaces 根目录下现有两套执行器的路径示例（已有快照时不要覆盖；比较新版本应新建轮次）：

```bash
mkdir -p mpx2ali-workplace/iteration-3/skill-snapshots/.agents/skills
cp -R ../mpx ../mpx2ali mpx2ali-workplace/iteration-3/skill-snapshots/.agents/skills/
mkdir -p mpx2skyline-workspace/iteration-8/skill-snapshots
cp -R ../mpx ../mpx2skyline mpx2skyline-workspace/iteration-8/skill-snapshots/
```

历史轮次含 Skill 指纹的测试需要对应历史版本快照；复制当前版本只能用于新评测准备，不能冒充历史环境复现。
