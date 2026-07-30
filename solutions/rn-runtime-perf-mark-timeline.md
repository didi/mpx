# Mpx Perf Mark 时间线能力与测量 API 重命名方案

## 背景

`@mpxjs/perf` 当前提供两类耗时 API：

- `scopeStart(name)` / `scopeEnd(id)`：通过数字句柄记录同步代码段耗时。
- `mark(startName)` / `measure(name, startName)`：通过具名起点记录跨作用域代码段耗时。

当前 `mark` 只是 `measure` 的起点缓存，单独调用不会进入 reporter。这个语义与业界对 mark 的常见理解不一致：mark 更适合表示“某个时间点发生了什么”，例如数据返回、首次渲染、页面可交互等时间线里程碑。

本方案调整 API 职责：

| 能力 | 目标 API | 语义 |
| --- | --- | --- |
| 录制窗口 | `start()` / `end()` | 打开、结束采集窗口，并自动生成同名边界 MarkEvent |
| 同步耗时 | `scopeStart()` / `scopeEnd()` | 通过数字句柄记录同步 scope |
| 跨作用域耗时 | `measureStart()` / `measureEnd()` | 通过具名起点记录一段耗时 |
| 时间线标记 | `mark()` | 记录一个独立、有序的瞬时事件 |

`point` 不再作为公开 API；原方案中的时间线能力统一使用 `mark` 命名。

## 目标

1. `mark(name)` 专门记录时间线事件，每次调用都保留，同名 mark 不合并。
2. 原 `mark/measure` 耗时配对更名为 `measureStart/measureEnd`，明确表达开始与结束。
3. 保持 `scopeStart/scopeEnd`、录制窗口 `start/end` 的函数签名和 `AggResult` 不变。
4. `start()` 与 `end()` 自动生成名为 `start` 和 `end` 的边界 MarkEvent，使每个完成的窗口形成闭合时间线。
5. 时间线事件记录相对当前 `start()` 的毫秒偏移，并保持真实调用顺序。
6. 使用有界时间线避免业务忘记 `end()` 或误在高频路径 mark 时导致内存无界增长。
7. 延续现有编译期开关与 DCE 机制，关闭对应分组后 API 调用、名称字符串和实现依赖均不进入最终产物。
8. 本次直接完成 `mark/measure` breaking change，不保留旧 API alias 或过渡阶段。

## 非目标

1. 不对 mark 做聚类分析，不产出次数、均值或首末时间聚合。
2. 不携带任意业务 metadata。
3. 不用 mark 替代 measure；需要耗时统计时仍使用 scope 或 measure API。
4. 不修改 webpack-plugin 的 perf 配置与分组结构。
5. 不提供线上动态开关。
6. 不替代业务 APM 埋点体系。

## 目标 API

### `mark`：时间线事件

```ts
export function mark (name: string): void
```

每次调用产生一条独立事件：

```ts
import { start, mark, end } from '@mpxjs/perf'

if (__mpx_perf__) start()

loadPageData().then(() => {
  if (__mpx_perf_user__) mark('goods:data-ready')
})

onFirstContentRendered(() => {
  if (__mpx_perf_user__) mark('goods:first-render')
})

onPageInteractive(() => {
  if (__mpx_perf_user__) mark('goods:interactive')
  if (__mpx_perf__) end()
})
```

Reporter 得到的时间线为：

```text
0.00ms    start
86.20ms   goods:data-ready
112.73ms  goods:first-render
145.06ms  goods:interactive
145.11ms  end
```

同名 mark 也必须作为独立事件保留：

```ts
mark('request:retry')
mark('request:retry')
```

时间线中应出现两行，而不是一个聚合桶。

`start` 与 `end` 是内建边界名称，业务 mark 应避免使用这两个名称。实现不增加运行时名称校验；内建 start 永远位于 events 首位，内建 end 永远位于完整窗口的末位，因此 reporter 仍能可靠识别边界。

### `measureStart` / `measureEnd`：跨作用域耗时

```ts
export function measureStart (name: string): void
export function measureEnd (name: string): void
```

API 保持原 `mark/measure` 的具名配对能力，只调整命名：

```ts
import { measureStart, measureEnd } from '@mpxjs/perf'

if (__mpx_perf_user__) measureStart('goods:request')

loadPageData().finally(() => {
  if (__mpx_perf_user__) {
    measureEnd('goods:request')
  }
})
```

`measureStart` 和 `measureEnd` 使用同一个 `name`。这个名称既是起止配对键，也是最终的聚合桶名，不再分别传递“起点名”和“结果名”。

旧 API 分开传递两个名称的唯一收益，是允许起点缓存名与结果桶名不同；调用方完全可以在 `measureStart` 时直接使用期望的结果名。统一名称可以减少一次参数传递，避免起止名称拼写不一致，也让调用代码一眼可见配对关系。由于底层本来就是 `Map<string, number>`，同名并发测量仍会覆盖前一个起点，这一点与现有能力一致。

`measureEnd(name)` 命中后：

1. 读取 `name` 对应的时间戳。
2. 计算当前时刻与起点的差值。
3. 将耗时样本聚合到同名的 `name` 桶。
4. 删除已消费的起点，避免重复结束。

`measureStart` 不产生时间线事件，`mark` 也不注册 measure 起点。两套状态严格分离，避免测量内部标记污染可见时间线。

### 完整导出面

目标版本的主要导出为：

```ts
import {
  mark,
  measureStart,
  measureEnd,
  scopeStart,
  scopeEnd,
  start,
  end,
  setReporter,
  clearReporter,
  createConsoleReporter,
  consoleReporter
} from '@mpxjs/perf'
```

不再导出旧 `measure`，也不导出 `point`。

## 时间线数据结构

```ts
export interface MarkEvent {
  /** mark 名称 */
  name: string
  /** 相对本次 start() 的毫秒偏移 */
  at: number
}

export interface MarkTimeline {
  /** 首项为 start、末项为 end，中间按 mark 调用顺序排列 */
  events: MarkEvent[]
  /** 达到容量上限后被丢弃的尾部事件数 */
  dropped: number
}
```

数组顺序是权威顺序。即使低精度时钟让两个 mark 的 `at` 相同，reporter 仍可通过数组下标确定先后，无需额外 sequence 字段。

`at` 使用相对时间：起点与 mark 都使用同一个 `now()`，避免 `performance.now()`、Hermes `nativePerformanceNow()` 与 `Date.now()` 的绝对原点差异。

## Reporter 扩展

现有类型：

```ts
export type Reporter = (agg: Map<string, AggResult>) => void
```

调整为：

```ts
export type Reporter = (
  measures: Map<string, AggResult>,
  timeline?: MarkTimeline
) => void
```

第二个参数在类型上设为可选，但 `bus.end()` 实际调用 reporter 时始终传入当前窗口的 timeline：

- 现有 `(agg) => {}` reporter 可以继续使用，JavaScript 会忽略第二个参数。
- 现有代码手动调用 `reporter(agg)` 时仍可通过 TypeScript 检查。
- 新 reporter 可以读取 timeline，但需兼容外部手动调用时为 `undefined` 的情况。

```ts
if (__mpx_perf__) {
  setReporter((measures, timeline) => {
    MyAPM.reportMeasures(measures)
    if (timeline) MyAPM.reportTimeline(timeline)
  })
}
```

Reporter 的扩展是兼容变更；breaking change 只来自原 `mark/measure` API 的重命名和 `mark` 语义调整。

## 运行时实现

### 1. 拆分 measure 起点与时间线状态

`impl.ts` 当前的内部 `marks` Map 更名为 `measureStarts`，只服务 `measureStart/measureEnd`：

```ts
const measureStarts = new Map<string, number>()

export function measureStart (name: string): void {
  measureStarts.set(name, now())
}

export function measureEnd (name: string): void {
  const startedAt = measureStarts.get(name)
  if (startedAt === undefined) return
  measureStarts.delete(name)
  bus.pushMeasure(name, now() - startedAt)
}
```

`mark` 只写入 bus 时间线：

```ts
export function mark (name: string): void {
  if (!bus.isRecording()) return
  bus.pushMark(name, now())
}
```

未录制时 mark 不读取时钟、不分配事件对象。

### 2. 录制窗口边界 MarkEvent

`impl.start()` 将当前时刻传入 bus；`impl.end()` 只在录制中读取结束时刻，再交给 bus：

```ts
export const start = () => bus.start(now())

export const end = (reporter?: Reporter) => {
  if (!bus.isRecording()) return
  bus.end(now(), reporter)
}
```

`bus.start(startedAt)` 只在真正开启新窗口时保存 `recordingStart = startedAt`，并直接初始化 start 事件：

```ts
timeline = {
  events: [{ name: 'start', at: 0 }],
  dropped: 0
}
```

`bus.end(endedAt, reporter)` 在关闭录制和触发 reporter 之前追加 end 事件：

```ts
timeline.events.push({
  name: 'end',
  at: endedAt - recordingStart
})
```

end 的 `at` 在调用 `end()` 时获取，不包含 avg 回填和 reporter 自身耗时。重复调用 `start()` 保持幂等，不清空数据、不改变窗口起点，也不追加第二个 start；未 start 或重复调用 `end()` 仍是 noop，不读取时钟、不追加 end。

### 3. 有界 MarkTimeline

`bus.ts` 增加窗口级时间线：

```ts
const MARK_LIMIT = 256

let recordingStart = 0
let timeline: MarkTimeline = {
  events: [],
  dropped: 0
}
```

`MARK_LIMIT` 表示包含 start/end 在内的总事件上限。`pushMark` 按调用顺序追加业务或框架显式 mark，并始终为 end 预留一个位置：

```ts
if (timeline.events.length < MARK_LIMIT - 1) {
  timeline.events.push({
    name,
    at: timestamp - recordingStart
  })
} else {
  timeline.dropped++
}
```

时间线固定最多保留 256 条：1 个 start、最多 254 个显式 mark、1 个 end。显式 mark 达到上限后保留已有前缀、丢弃后续事件并累计 `dropped`，end 不参与丢弃：

- 启动和首屏分析最关注从窗口起点开始的因果链，优先保留早期事件。
- 不使用 `Array.shift()`，避免满容量后每次 mark 产生线性移动成本。
- Reporter 明确知道时间线已截断，不会把不完整结果误判为完整链路。

本次不增加容量配置项。

### 4. 窗口结束

`end()` 增加以下行为：

1. 先追加 end，再将 `_recording` 置为 false，最后计算 measure avg 并触发 reporter。
2. 每个正常结束的窗口至少包含 start/end，因此即使没有显式 mark 和 measure 也会触发 reporter。
3. 全局 reporter 先于局部 reporter，二者收到同一份 measureMap 和 timeline 引用。
4. 下一次 `start()` 新建 measureMap、timeline 和 events，旧窗口引用不被覆盖。
5. Reporter 抛错仍被吞掉，不影响业务代码。

Reporter 不应修改 timeline 或 events；如需异步持有或改写，应自行复制。

### 5. 导出与关闭态

保持现有顶层三元分流：

```ts
export const mark = __mpx_perf__ ? impl.mark : noop.mark
export const measureStart = __mpx_perf__ ? impl.measureStart : noop.measureStart
export const measureEnd = __mpx_perf__ ? impl.measureEnd : noop.measureEnd
```

`noop.ts` 为三个 API 提供空实现，`MarkEvent` 与 `MarkTimeline` 从 `types.ts` 透出。`@mpxjs/perf` 仍不感知 framework / user 分组。

无需修改 `normalize-perf-options.js`、DefinePlugin 常量或 `MpxWebpackPlugin` 配置。

## Console Reporter

`createConsoleReporter` 增加独立 timeline 区块，严格按 events 数组顺序展示，不排序、不聚合：

```text
[mpx perf] 1 measure bucket / 7 marks
measures
name                count     sum     avg     max
------------------  -----  ------  ------  ------
view:render:total       12  8.20ms  0.68ms  1.42ms

timeline
index       at  name
-----  -------  ------------------------
    0   0.00ms  start
    1   0.08ms  app:start
    2  31.42ms  router:ready
    3  86.20ms  goods:data-ready
    4 112.73ms  goods:first-render
    5 145.06ms  goods:interactive
    6 145.11ms  end
```

兼容规则：

- Reporter 第二参数未传入时保持当前 console 输出格式；通过正常 `start/end` 完成的窗口始终带有 timeline。
- 没有 measure 时只输出 timeline，不输出空 measures 表格；最小时间线包含 start/end 两行。
- `filter` 同时过滤 measure 和显式 mark 名称；内建 start/end 不参与过滤，始终作为时间线边界输出。过滤后保留显式 mark 的原始 index 和相对顺序。
- `sortBy` 只控制 measure，不作用于 timeline。
- `timeline.dropped > 0` 时追加截断提示。

## API 直接变更与迁移

### Breaking change 说明

现有 `mark(name)` 与目标 `mark(name)` 参数完全相同，但语义不同：

- 旧语义：注册一个不可见的 measure 起点。
- 新语义：向 reporter 时间线追加一个可见事件。

运行时无法判断调用方意图，因此不能通过函数重载或参数检测兼容。让一个 `mark` 同时注册 measure 起点和写入时间线也不可取：现有业务的内部起点会全部污染时间线，时间线不再只包含显式里程碑。

此外，当前无 measure 的空窗口不会触发 reporter；目标行为会用 start/end 构成最小时间线并触发 reporter。这也是可观测行为变化。

本次直接落地目标 API，不设置兼容阶段：

1. `mark` 直接切换为时间线语义。
2. 原 `mark` 的具名起点能力直接替换为 `measureStart`。
3. 原 `measure` 直接替换为单参数 `measureEnd`，旧 `measure` 不再导出。
4. 不保留旧 API alias，不添加 deprecation 过渡实现。
5. 同步发布 MarkTimeline、reporter 第二参数和 start/end 自动边界事件。
6. 在同一次变更中完成仓库内调用、测试、文档与 Mpx2RN Skill 迁移。

调用方升级后必须同步修改旧 `mark/measure` 调用；未迁移的 `mark` 会被解释为时间线事件，旧 `measure` 导入则直接失败。release notes 需明确标注这一 breaking change。

### 调用迁移表

| 旧写法 | 新写法 |
| --- | --- |
| `mark('request:start')` | `measureStart('request:duration')` |
| `measure('request:duration', 'request:start')` | `measureEnd('request:duration')` |
| 无时间线 API | `mark('request:ready')` |

迁移示例：

```diff
- import { mark, measure } from '@mpxjs/perf'
+ import { measureStart, measureEnd } from '@mpxjs/perf'

- if (__mpx_perf_user__) mark('request:start')
+ if (__mpx_perf_user__) measureStart('request:duration')
  request().finally(() => {
-   if (__mpx_perf_user__) measure('request:duration', 'request:start')
+   if (__mpx_perf_user__) measureEnd('request:duration')
  })
```

## 生命周期与边界语义

| 场景 | 行为 |
| --- | --- |
| 未 `start()` 调用 `mark()` | noop，不读取时钟、不分配对象 |
| 首次 `start()` | 创建 `{ name: 'start', at: 0 }` 作为首事件 |
| 录制中重复 `start()` | noop，不生成额外 start，原窗口起点和时间线不变 |
| 未 start 或重复调用 `end()` | noop，不读取时钟、不生成 end |
| 同名 mark 重复触发 | 保留为多条独立事件 |
| 两个 mark 的 `at` 相同 | 以 events 数组顺序确定先后 |
| mark 与 measure 桶同名 | 分别进入 timeline 和 measureMap，不冲突 |
| `measureEnd` 找不到起点 | noop，沿用当前 measure 行为 |
| 同一 name 重复 `measureStart` | 后一次覆盖前一次，沿用当前具名起点行为 |
| 同一 name 重复 `measureEnd` | 第一次消费后删除，后续 noop |
| 正常调用 `end()` | 追加同名 end 末事件后触发 reporter |
| 无显式 mark 和 measure 的窗口 | 以 start/end 两事件触发 reporter |
| 显式 mark 超过 254 条 | 保留前 254 条，后续累计 dropped，end 仍保留 |
| 新窗口开始 | 重建 Map 与 timeline，重置窗口起点 |

## 性能与产物影响

| 状态 | `mark(name)` 成本 | 内存 |
| --- | --- | --- |
| 对应分组关闭 | 调用点经 Terser DCE 删除 | 0，名称字符串不残留 |
| perf 打开但未录制 | 一次 `isRecording()` 判断 | 0 |
| 录制中且未到上限 | 一次 `now()`、一次减法、一个 MarkEvent 对象和一次数组 push | 每次显式 mark 一个小对象，最多 254 个 |
| 已达到上限 | 一次 `now()`、容量判断和 `dropped++` | 不再增加事件对象 |

每个录制窗口固定增加 start/end 两个小对象；完整时间线与“每次调用零对象分配”不可同时满足。本方案优先保留时间线，接受低频 mark 每次分配一个小对象；高频 `scopeStart/scopeEnd` 和 measure 聚合路径保持不变。

mark 不应插入 render 循环等高频路径。需要频次和耗时统计时继续使用 scope/measure。

调用方仍必须使用字面量门禁：

```ts
if (__mpx_perf_user__) mark('goods:first-render')
```

最终构建依赖 `dist/index.js` 保留的顶层三元、`sideEffects: false` 和使用方 Terser 完成静态折叠。

## 变更范围

### 运行时代码

- `packages/perf/src/types.ts`
  - 新增 `MarkEvent` 与 `MarkTimeline`。
  - Reporter 增加可选第二参数。
- `packages/perf/src/bus.ts`
  - 保存窗口起点与有界 MarkTimeline。
  - 新增 `pushMark`，扩展 `start/end`。
- `packages/perf/src/impl.ts`
  - 原 `marks` 更名为 `measureStarts`。
  - 新增时间线 `mark` 和 `measureStart/measureEnd`。
- `packages/perf/src/noop.ts`
  - 对齐目标 API 空实现。
- `packages/perf/src/index.ts`
  - 按现有顶层三元导出目标 API 和类型。
- `packages/perf/src/reporters/console.ts`
  - 增加有序 timeline 输出和截断提示。

不修改 webpack-plugin 配置和已有框架 scope 探针；首期只提供 mark 能力，不额外预埋框架时间线事件。

### 文档与 Skill

该变更涉及用户 API 与 Mpx2RN 运行时能力，实现时需同步更新：

- `packages/perf/README.md`：目标 API、迁移表、Reporter、时间线和容量语义。
- `docs-vitepress/guide/advance/perf.md`：替换旧 mark/measure 示例，增加 mark 时间线与迁移说明。
- `packages/perf/AGENTS.md`：更新入口导出、impl 与 bus 调用链。
- `.agents/skills/mpx2rn/references/rn-script-reference.md`：补充 `@mpxjs/perf` 的新命名、时间线能力和 RN 字面量门禁。
- 迁移指南或 release notes：明确 `mark/measure` breaking change 与一次性迁移方式。

## 测试方案

### Measure 回归测试

1. `measureStart/measureEnd` 生成的 `count/sum/avg/max` 与旧 `mark/measure` 一致。
2. `measureEnd` 消费起点后删除，重复调用不重复聚合。
3. 不同具名起点互不干扰。
4. `measureStart/measureEnd` 不写入 timeline。

### Mark 时间线测试

1. 首次 start 自动生成首项 `{ name: 'start', at: 0 }`。
2. 正常 end 在 reporter 触发前生成末项 `{ name: 'end', at: elapsed }`。
3. 重复 start/end 不生成额外边界事件，未 start 的 end 不读取时钟。
4. 未录制时显式 mark 被丢弃且不读取时钟。
5. 多个显式 mark 按调用顺序进入 start/end 之间。
6. 同名 mark 保留为多条事件，不发生合并。
7. `at` 等于 mark 时间戳减 recordingStart。
8. 只有 start/end 的窗口也触发全局和局部 reporter。
9. 最多保留 254 个显式 mark；溢出后准确累计 dropped，end 仍是末事件且总长度不超过 256。
10. mark 不会成为 `measureEnd` 可消费的起点。

### Reporter 与 Console 测试

1. 单参数 reporter 仍可赋值给 Reporter 并手动单参数调用。
2. 全局与局部 reporter 收到同一份 measureMap 和 timeline。
3. Reporter 未传 timeline 时保持当前 console 输出。
4. 最小 start/end 窗口只输出两行 timeline，不输出空 measures 表格。
5. timeline 严格保持 events 顺序，同名 mark 不折叠。
6. filter 不隐藏内建 start/end，不改变剩余 mark 的原始顺序，dropped 会输出截断提示。

### 迁移与构建测试

1. 验证旧 `measure` 不再导出，仓库内不存在未迁移的旧 `mark/measure` 调用。
2. 验证 `measureStart/measureEnd` 的结果与迁移前具名耗时结果一致。
3. `perf.enable: false` 时，产物中不存在 mark 时间线实现和测试名称字符串。
4. `probes: ['framework']` 时，业务 `__mpx_perf_user__` mark 调用被移除。
5. `probes: ['user']` 时，mark 正常进入产物并输出时间线。

实现完成后执行：

```sh
npx eslint --ext .ts packages/perf/src packages/perf/__tests__
npm run test -w @mpxjs/perf -- --runInBand
npm run build -w @mpxjs/perf
npm run docs:build
git diff --check
```

## 验收标准

1. 公开 API 职责与命名表一致：时间线只用 mark，具名耗时只用 measureStart/measureEnd。
2. 每个正常窗口的首项固定为 `{ name: 'start', at: 0 }`，末项固定为名为 end、记录窗口总时长的事件。
3. 连续两次 `mark('retry')` 在 start/end 之间产生两条有序 timeline 事件。
4. `measureStart → measureEnd` 的聚合结果与现有 `mark → measure` 一致。
5. mark 与 measure 起点状态完全隔离，互不污染。
6. 无显式 mark 和 measure 的窗口仍以 start/end 触发全局与局部 reporter。
7. 最多 254 个显式 mark 全部保序；超出后保留前缀并准确报告 dropped，end 始终保留。
8. 旧 `measure` 和旧语义 `mark` 一次性迁移完成，不残留 alias 或 deprecation 实现。
9. perf 或对应分组关闭后的产物不包含 mark 调用、实现及名称字符串，包括内建 start/end 字面量。
10. 相关 ESLint、Jest、TypeScript 与文档构建全部通过。

## 方案取舍

### 选择 `measureStart/measureEnd`

这组名称与已有 `scopeStart/scopeEnd` 对称，并明确表达具名耗时的开始和结束。相比 `startMeasure/endMeasure`，名词在前也能与 API 列表中的 scope 分组保持一致；相比 `timerStart/timerEnd`，它延续了现有 measure 概念，迁移成本更低。

### `mark` 只做时间线，不承担双重语义

让 mark 同时写时间线和注册 measure 起点看似兼容，但会让所有旧测量起点自动出现在时间线中，破坏显式时间线的可读性。职责分离比隐式兼容更重要，因此本次直接替换旧 API。

### 不保留 `point` 别名

point 方案尚未实现，没有兼容负担。继续导出 point 只会形成两个含义完全相同的入口，增加文档和维护成本，因此目标 API 只保留 mark。

### 接受每个 mark 的对象分配

完整时间线必须保存每次调用的名称和时刻。本方案将 mark 定位为低频里程碑，并用包含边界在内的 256 条硬上限控制最坏内存；高频耗时采集继续走实时聚合路径。
