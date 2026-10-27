# Mpx2RN 精简评测集（iteration-18）

基于 iteration-17 整合 case 设计：**9 → 6 个 case，110 → 61 条计分断言**。三组对比每轮由 27 次降为 18 次运行。当前仅完成设计与本地校验，尚未执行模型评测，没有新的通过率、耗时或 Token 结果。

## Case 分工

| 新 case | 原 case | 交付文件 | 独立计分断言 | 保留的重点 |
| --- | --- | --- | ---: | --- |
| 0 style-layout-adaptation | 0 + 4，接收 5 的字体检查 | data-panel.mpx | 16 | 选择器、Grid、伪元素、文字、粘性布局、节点查询、单位注释、三种 margin 场景 |
| 1 template-api-adaptation | 1 + 2 | order-list.mpx | 9 | 动态绑定、事件传参、页面滚动、宿主 API、生命周期与 Hover 分支复用 |
| 2 dynamic-capability-adaptation | 3 + 5 | carousel-card.mpx | 15 | 动态背景/动画/CSS 变量、同步注册、组件引用、setup 属性响应性、平台样式和 JSON |
| 3 new-rating-component | 6 | rating-selector.mpx | 8 | 选项式 API、实例本地状态、事件、动态组件 range、普通 CSS 与按压态 |
| 4 new-segmented-control | 7 | segmented-control.mpx | 5 | script setup 宏、props 响应性、ref/watch、computed、整体与单项禁用 |
| 5 new-task-board-page | 8 | task-board.mpx | 8 | 原子 CSS、完整 token、alpha、页面参数解码、筛选与任务状态、页面 JSON |

前三个适配 case 均合并为一个 SFC，不要求分别改造原来的两个文件。依赖只保留在 input 并由 runner 复制到 outputs。保留后三个新建 case，是为了分别验证选项式组件、组合式组件和原子 CSS 页面，避免将不同 API/样式范式当作重复业务删除。

## 去重规则与旧断言去向

`evals.json` 的 `assertions[].checks` 引用 iteration-17 原始检查 ID。同一条断言包含的子检查全部通过才计 1 分；每个子检查最多出现在一条计分断言中。61 条断言复用 86 个不同的底层检查，另移除 24 个重复检查。

| 不再独立执行的旧检查 | 新计分位置 | 原因 |
| --- | --- | --- |
| s3、u12 | case 3 n11；case 2 g8 | 普通 CSS 按压态只计一次；透明点击目标单独保留 |
| s13 | case 0 s0 | 与 s5 是完全相同的相邻兄弟选择器检查 |
| t7、n9、u10 的选择器部分 | case 0 s0 | 选择器适配集中检查 |
| j5、j8、n5、u6、a6 | case 1 t1 | 模板传参与脚本读取属于同一链路，合并 t1+t6 |
| n6、u7 | case 1 t0 | 普通动态类绑定只计一次；原子类完整 token 的 a7 继续单列 |
| n7、u8、a8 的表达式部分 | case 1 t2 | Mustache 不调用普通方法只计一次 |
| g6 | case 0 l5 中的 l7 | 简单选择器规则集中到节点查询 case；relativeTo 素材仍保留 |
| c0 | case 0 s9 中的 s10 | 与跨平台空规则检查重复，错误条件编译素材移入 case 0 |
| c10 | case 5 a2 | decodedQuery 统一由页面初始化场景检查 |
| u9、a8 的文字部分 | case 3 n8 | 显式 text 包裹集中到评分组件 |
| u10 的普通 CSS 部分、u11 | case 3 n10 | 语义化 class、显式横向 Flex 与支持的 CSS 合并检查 |
| n12、u13 | case 5 a14 | 不直接调用宿主 API、不添加无必要平台分支只计一次 |
| a1 | case 4 u0/u3/u4；case 5 a2 | 宏、ref/computed 和 onLoad 已有对应检查 |

三种 margin 断言 l10/l11/l12 分别检查兄弟折叠、父子折叠和 Flex 不折叠，保持独立。Hover 分支 t9 与 CSS 变量分支 g10 保持独立。普通 setup 属性解构 c6 与 defineProps 属性解构 u2 保持独立。原子类与普通 class 的约束也分别计分。

断言减少意味着通用规则不再对每份输出重复计分，原业务需求仍保留。新总分不能直接与历史 110 分口径比较，也不能将旧 outputs 重新计分冒充本轮结果。

## 执行与维护

在本目录执行：

```bash
python3 run_evals.py --execute --model <父会话模型> --reasoning-effort <父会话思考强度>
python3 grade.py
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s . -p 'test_*.py' -v
```

可用 `--evals 0 1`、`--groups mpx2rn mpx2rn_simple no_skill` 筛选。省略 `--execute` 只生成调度信息并复制依赖，不启动模型。模型、思考强度、工作目录与三组隔离方式沿用 iteration-17。

运行和评分入口直接复用 `../iteration-17/run_evals.py` 与 `../iteration-17/grade.py`，避免复制一套调度器和 1600 多行检查逻辑。因此需要保留 iteration-17，修改旧检查也应运行两个版本的测试。case 名称、输出文件、断言与子检查映射以本轮 `evals.json` 为准；修改 prompt/断言时同步对应的 `eval_metadata.json`。

本轮评分额外要求非空模板和脚本，避免空文件靠“不包含坏写法”得分。滚动断言不再将单纯出现 scroll-view 当作触底事件已实现；事件传参同时检查内联调用。其余评分仍沿用静态检查，不等同于真机功能验证。

## 本地验证

- 本轮 6 项一致性/调度/评分测试通过；原评分器 51 项回归测试通过。
- 5 个输入 SFC 的脚本通过 ESLint（使用 html 插件并声明 `.mpx` 扩展）。
- RN 模板与样式相关 Jest：2 个套件、96 项测试通过。
- 未运行模型生成或比较评测；输入保留待适配问题，不以输入在 RN 上编译通过作为验收条件。
