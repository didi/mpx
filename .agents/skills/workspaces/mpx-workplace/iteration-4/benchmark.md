# iteration-4 · DSH 复测结果

执行环境：DeepSeek Harness 0.2.1-rc.5（desktop profile）subagent，provider `deepseek-official`，模型 `DeepSeek-V4.1-Flash`（构建 1017，别名 `deepseek-flash`），推理等级 High，执行日期 2026-11-03。
DSH 仅暴露别名 `deepseek-flash` 与构建号 `1017`，无更细的权重版本串。

## 逐场景得分

| 场景 | mpx（通过/总数） | noskill（通过/总数） |
| --- | --- | --- |
| 构建目标、条件文件与配置归属 | 6/6 | 4/6 |
| 图文布局、间距与样式作用范围 | 7/7 | 6/7 |
| 刷新、吸顶与节点定位 | 7/7 | 5/7 |
| 弹层、键盘与窗口尺寸 | 5/5 | 4/5 |
| 登录适配、任务句柄与请求取消 | 6/6 | 3/6 |
| 响应式动态组件与首次渲染能力 | 7/7 | 3/7 |
| 路由参数、部署与异步分包 | 5/5 | 1/5 |
| 共享业务的 Web SSR 请求隔离 | 5/5 | 3/5 |
| **合计** | **48/48** | **29/48（60.4%）** |

## 单任务平均用量

| 指标 | mpx | noskill |
| --- | ---: | ---: |
| Token | 563.00 万 | 260.31 万 |
| 耗时 | 497.7 秒 | 516.6 秒 |

## 说明

- 这是 48 条断言的静态设计符合率，不是构建或真机通过率；独立 ESLint/编译结论见 [validation/checks-summary.md](validation/checks-summary.md)。
- 执行隔离为独立目录 + 提示词白名单 + 事后会话日志审计，弱于文件工具级白名单。
- 与 [iteration-2](../iteration-2/README.md) 的对照数据以该归档为准，本报告不重复。
