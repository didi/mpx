# Mpx2Web Benchmark iteration 8

本轮包含 3 个常规与 3 个复杂业务化 eval。题目保留 iteration-4 原 case 的能力意图，但将问题组合到商城、社区、会员、订单、营销活动和商品平台中，评分只关注 Mpx2Web 的 Web 专属差异。

## 用例

- `eval-0-storefront-style-compat`：Web 样式隔离与特定 WebView 小字号补偿。
- `eval-1-community-publish-bridge`：Web 缺失宿主 API 的最小隔离与 TODO 边界。
- `eval-2-member-share-lifecycle`：Web 分享入口与无等价宿主生命周期移除。
- `eval-3-order-center-realtime`：WXS/Web 成对手势与 SocketTask 竞态。
- `eval-4-campaign-webview-sdk`：WebView Bridge 安全、H5 SDK 异步初始化与清理。
- `eval-5-ssr-product-platform`：SSR 请求隔离、注水复用、客户端 SDK 与部署路径。

## 校验与执行

```bash
python3 build_evals.py > evals.json
python3 validate_benchmark.py
python3 -m unittest test_benchmark.py
python3 run_full_benchmark.py
```

`run_full_benchmark.py` 默认对常规 eval 并行 2 组、对复杂 eval 串行执行，完成 6 × 2 组运行。它会动态创建每个 eval 下的 `no_skill/` 与 `has_skill/`，随后独立评分并生成根目录 `benchmark-results.json`。默认不限制单阶段超时，并对瞬时连接失败或评分格式错误重试 2 次。旧运行目录重跑前会移入各 eval 的 `previous-runs/`，旧汇总会复制到 `previous-results/`，不会直接删除；中断后可执行：

```bash
python3 run_full_benchmark.py --resume
```

`--resume` 只跳过输出、评分与当前 fixture/Skill 指纹一致的完整组；fixture 或 `has_skill` 使用的 Skill 变化后会重新运行并归档旧结果。可用 `--timeout 1800` 设置 30 分钟单阶段超时，`--timeout 0` 表示不限时；可通过 `--jobs 1` 将常规 eval 也降为串行。

先试跑单个用例：

```bash
python3 run_full_benchmark.py --evals 0
```

`run_evals.py` 仍可用于只生成 6 × 2 的 Agent dispatch，不直接调用模型。

## 当前结果

已有运行产物会原样保留。由于 eval-4 删除了题面未声明的请求—响应协议断言、eval-5 补充了第三方 SDK 的 `create/track/destroy` 外部契约，旧评分不能与新断言直接比较；重新执行时运行器会保留旧目录并生成新结果。`benchmark-results.json` 会区分 `completed`、`infrastructure_failed`、`generation_failed` 与 `grading_failed`，连接中断不再被计入能力得分。
