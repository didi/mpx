# iteration-3 · mpx 分组编译观察报告

本轮仅执行 mpx 组：8 个用例，wx / ali / ios / android / harmony / web 六目标。仅保留本报告、[结构化诊断报告](compile-report.json) 和 [编译统计](benchmark.json)。原始输入、交付代码、Skill 快照、日志、逐组结果、临时脚本及 HTML 查看器已清理。JSON 中的 evidence/result 路径仅是历史证据标识，不能再直接访问。

## 原始执行结果

首次合计 25 errors、12 warnings；修复后 45/48 个 case-target 组合无编译诊断，残留 2 errors、3 warnings。Case 5 的首次错误包括多入口校验引起的重复注册，不能全部计为独立源码缺陷。原 48 条静态能力断言未重新评分。

| Case | 首次错误/警告 | 最终错误/警告 | 最终无诊断目标 | ESLint 错误/警告 |
| --- | ---: | ---: | --- | ---: |
| 0 · 构建目标、条件文件与配置归属 | 0/1 | 0/1 | wx, ios, android, harmony, web | 0/0 |
| 1 · 图文布局、间距与样式作用范围 | 0/1 | 0/0 | wx, ali, ios, android, harmony, web | 0/0 |
| 2 · 刷新、吸顶与节点定位 | 3/5 | 0/2 | wx, ios, android, harmony, web | 0/0 |
| 3 · 弹层、键盘与窗口尺寸 | 0/0 | 0/0 | wx, ali, ios, android, harmony, web | 0/0 |
| 4 · 登录适配、任务句柄与请求取消 | 0/2 | 0/0 | wx, ali, ios, android, harmony, web | 0/0 |
| 5 · 响应式动态组件与首次渲染能力 | 17/0 | 0/0 | wx, ali, ios, android, harmony, web | 0/0 |
| 6 · 路由参数、部署与异步分包 | 3/1 | 0/0 | wx, ali, ios, android, harmony, web | 0/0 |
| 7 · 共享业务的 Web SSR 请求隔离 | 2/2 | 2/0 | wx, ali, ios, android, harmony | 0/0 |

## 后续根因核实

- Case 0 支付宝 `navigationStyle` 的 1 条警告，以及 Case 2 `show-scrollbar` 的 2 条警告，来自评测依赖与仓库源码不一致。两份 webpack-plugin 均标记 2.11.1，但安装包尚未包含仓库已有的支付宝转换。相同输入在仓库规则下零诊断，相关 JSON 测试 28/28、scroll-view 测试 16/16 通过。
- Case 7 Web 的 2 条错误来自评测环境初始化：实际 Vue 为 2.7.16，vue-demi 0.14.10 却使用 Vue 3 入口，导致 Pinia 2.3.1 引用的 `hasInjectionContext` 缺失。同版本依赖在隔离编译中改用自带 Vue 2.7 入口后零错误、零警告。未修改共享环境、未完整重跑 Case 7。
- 以上是执行后的根因补充，不追溯修改原始统计；不能据残留诊断认定当前仓库缺少相关能力，或把环境错误计为 Skill 生成代码缺陷。

## 范围与验证边界

- 输入从 Git `0508ba54c` 的 iteration-1 恢复，iteration-2 原始输入已删除，不能称为逐字复现。
- 所有 case 使用启动时同一份当前 Skill 快照；执行期间四个端入口的后续修改未纳入。使用提示词级隔离，并明确要求保留编译诊断，不能据此衡量无人提示时的校验触发率。
- 清理前已独立解析日志，核对 96 条首次/最终目标记录；最终所有输出 ESLint 0/0，共享现有 Jest 5/5 通过。
- 依赖使用当时共享锁定发布包，未升级。单文件/组件树编译不等于完整 App、真机、浏览器或 SSR hydration 通过。
- 本目录仅保留报告，不能直接从归档重新运行或重新评分。
