# 框架交付验证

验证日期：2026-10-28。以下验证针对评测框架和输入素材，**不是两组 Skill 的实际评测结果**。

| 检查 | 结果 | 范围 |
| --- | --- | --- |
| Python unittest | 9 项通过 | 用例与 metadata 一致、6 次调度、旧断言不重复归属、依赖复制、执行记录、缺失交付、Token、未评审拦截、加权/逐 case 统计区分、模型一致性 |
| ESLint | 通过 | 新增 JS / MJS / MPX；在临时副本中使用本工作区 ESLint 配置 |
| 相关现有 Jest | 3 套件、39 项通过 | ali-compat-style、scroll-view、页面 JSON 转换 |
| wx / ali 编译冒烟 | 两端通过，0 error / 0 warning | 合并后的 product-card.mpx、address-dialog.mpx 输入；验证可编译，不判定待修复的行为正确 |
| 调度 CLI | 通过 | dry-run 生成 6 条调度，不生成模型指标 |
| 报告查看器 | 通过 | 临时模拟运行数据经评分汇总后生成静态 HTML；模拟数据随临时目录清理 |

框架回归命令（仓库根目录）：

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover \
  -s .agents/skills/mpx2ali-workplace/iteration-1 -p 'test_*.py' -v

node_modules/.bin/jest --watchman=false --runInBand --runTestsByPath \
  packages/webpack-plugin/test/ali-compat-style.spec.js \
  packages/webpack-plugin/test/platform/wx/template/scroll-view.spec.js \
  packages/webpack-plugin/test/platform/wx/json/page.spec.js
```

编译与 ESLint 使用临时工作区副本，复用 RN 工作区已安装依赖：`@mpxjs/core`、`@mpxjs/api-proxy`、`@mpxjs/webpack-plugin` 均为 `2.11.1`，`@mpxjs/mpx-cli-service` 为 `2.2.30`，ESLint 为 `9.39.5`。没有在交付目录安装依赖或生成锁文件；首次使用应按 README 安装并保留锁文件。此处已安装编译器与仓库 Jest 使用的源码不是同一版本，分别记录，不互相替代能力证据。

初次 Jest 启动受本机 Watchman 状态目录权限影响，关闭 Watchman 后正常通过。现有 Jest 配置仍提示 `testTimeout` 未识别警告。

尚未执行：6 次真实模型任务、逐条输出评审、完整业务 App 的兼容样式集成，以及微信/支付宝在 iOS/Android 上的真机回归。未生成正式 benchmark.json 或模型输出。
