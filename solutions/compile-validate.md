# 编译校验能力

## 需求描述

在 [.agents/skills/mpx-rn-style-guide/scripts/compile-validate.js](../.agents/skills/mpx-rn-style-guide/scripts/compile-validate.js) 中提供能力能够执行 `.mpx` 组件的真实编译过程，收集编译过程中产生的错误并分类返回，用于为 [.agents/skills/mpx-rn-style-guide](../.agents/skills/mpx-rn-style-guide) 这个 skill 的输出提供确定性的产物验证能力。

## 技术方案

### 总体思路

复用宿主项目本地安装的 mpx 工具链（`@mpxjs/mpx-cli-service` + `@mpxjs/vue-cli-plugin-mpx` + `@mpxjs/webpack-plugin`），生成项目真实的 webpack 构建配置，然后：
1. 将 entry 替换为目标 `.mpx` 组件（通过 `MpxWebpackPlugin.getComponentEntry` 构造独立组件入口，绕开 `app.mpx` 依赖）
2. 将 output 重定向到临时目录，避免污染项目产物
3. 以编程方式调用 webpack，收集并分类 `stats.errors` / `stats.warnings`

这样可以保证校验使用的 loader 链、预处理规则、条件编译、RN 平台限制等与开发者执行 `mpx-cli-service build --targets=android` 完全一致，是"真实编译"而不是轻量的 AST 扫描。

### 运行时定位宿主项目

`compile-validate.js` 不假设自己所在的目录就是项目根目录，而是从被校验的 `.mpx` 文件向上查找最近满足以下任一条件的目录作为 `projectRoot`：
- `package.json` 中 `dependencies` / `devDependencies` 含有 `@mpxjs/mpx-cli-service`
- 或 `node_modules/@mpxjs/mpx-cli-service` 存在

若未找到，直接抛错并提示"当前环境未安装 mpx-cli (@mpxjs/mpx-cli-service)，无法执行真实编译校验"。这符合需求中的"如不存在可以直接报错"。

### 依赖解析

所有依赖都使用 `require.resolve(pkg, { paths: [projectRoot] })` 从宿主项目 `node_modules` 加载，避免 skill 自身目录缺失依赖：
- `@mpxjs/mpx-cli-service` → `Service`（继承自 `@vue/cli-service`）
- `@mpxjs/vue-cli-plugin-mpx/config` → `resolveBuildWebpackConfigByTarget`
- `@mpxjs/vue-cli-plugin-mpx/config/base` → `addBuildWebpackConfig`
- `@mpxjs/cli-shared-utils` → `setTargetProcessEnv`、`getTargets`、`SUPPORT_MODE`
- `@mpxjs/webpack-plugin` → `MpxWebpackPlugin.getComponentEntry`
- `webpack`

### 目标平台（target）选择

默认 `ios`（RN 平台），因为 skill 本身就是 RN 样式适配指南，RN 编译链包含最严格的样式规则（不支持的选择器/属性在这里会报错）。支持通过 API 或 CLI 参数覆盖为 `android` / `web` / `wx` / `ali` 等；可以传多个 target 分别编译并合并错误。

调用 `setTargetProcessEnv(target)` 写入 `process.env.MPX_CLI_MODE`，与 `mpx-cli-service` bin 保持一致。

### webpack 配置生成

复用 `mpx-cli-service` 的 Service 流程：

```js
const service = new Service(projectRoot)
// 对齐 bin/mpx-cli-service.js 的插件过滤逻辑
const setPluginsToSkip = service.setPluginsToSkip.bind(service)
service.setPluginsToSkip = function (args) {
  setPluginsToSkip(args, rawArgv)
  let plugins = filterPluginsByPlatform(process.env.MPX_CLI_MODE)
  if (process.env.MPX_CLI_MODE !== 'web') {
    plugins = plugins.concat([
      'built-in:config/base',
      'built-in:config/app',
      'built-in:config/css'
    ])
  }
  plugins.forEach(p => this.pluginsToSkip.add(p))
}
await service.init('production')

// 注入 build 命令需要的链式修改
const api = /* 从 service.pluginAPIs 中获取 vue-cli-plugin-mpx 对应的 PluginAPI */
api.chainWebpack(config => addBuildWebpackConfig(api, options, config, target, args))
const webpackConfigs = await resolveBuildWebpackConfigByTarget(api, options, target, args)
await api.runAfterResolveWebpackCallBack(webpackConfigs)
```

以上与 [packages/vue-cli-plugin-mpx/commands/build/index.js](../packages/vue-cli-plugin-mpx/commands/build/index.js) 中 `build` 命令的行为一一对应。

### Entry / Output 重写

在拿到 `webpackConfigs`（可能是多配置数组，例如 RN 的 android + 主包/分包）后，对每一个 config：

1. **entry**：覆盖为
   ```js
   { component: MpxWebpackPlugin.getComponentEntry(absoluteMpxPath) }
   ```
   `getComponentEntry` 源码（[packages/webpack-plugin/lib/index.js:295](../packages/webpack-plugin/lib/index.js#L295)）仅在 request 上附加 `?isComponent=true`，使 webpack-plugin 将其视为独立组件，不会强制要求 `app.mpx`。多个目标文件则生成多个 entry key。

2. **output**：重定向到临时目录 `path.join(os.tmpdir(), 'mpx-compile-validate', hash(mpxPath, target))`，避免污染项目正式产物。**关键前提**：输入（entry）必须使用目标 `.mpx` 文件在项目中的真实绝对路径，`webpackConfig.context` 保持 `projectRoot` 不变 —— 这样 webpack 的 `resolve`、alias、`node_modules` 查找都会走项目真实环境，依赖解析错误会被真实触发并上报。output 目录的位置不影响模块解析的保真度，所以可以随意放置；校验完毕后 `fs.rmSync(outDir, { recursive: true, force: true })` 清理。

3. **关闭不必要的成本项**：
   - `config.devtool = false`
   - `config.cache = false`
   - `config.optimization.minimize = false`
   - 移除 `BundleAnalyzerPlugin` / `ESLintPlugin` / `HtmlWebpackPlugin` / `CopyPlugin` 等与校验无关的 plugin（按 `constructor.name` 过滤）
   - `config.performance = false`
   - `config.stats = 'errors-warnings'`

4. **bail 关闭**：保证单个错误不会短路收集。

### 执行编译

```js
webpack(webpackConfigs, (err, multiStats) => { ... })
```

`err` 代表配置级错误（通常直接抛出）；`multiStats` / `stats` 通过 `stats.toJson({ errors: true, warnings: true, moduleTrace: true, errorDetails: true })` 提取结构化的错误/告警列表。不进入 watch 模式。

### 错误分类

webpack 错误对象（`WebpackError` 子类）带有 `module.resource`、`loc`、`file`、`chunk`、`name` 等信息。分类规则按下列优先级匹配（命中即停）：

| 分类 | 判定规则 |
| --- | --- |
| `style` | 错误 stack / moduleIdentifier 含 `style-compiler`、`wxss-loader`、`postcss-loader`；或 module 的 query 含 `type=styles`；或 message 匹配 `^\\[mpx style` |
| `template` | 含 `template-compiler`；或 query 含 `type=template`；或 message 含 `RN only supports` + 选择器类关键字 |
| `script` | 含 `script-compiler` / `babel-loader` / `ts-loader`；或 query 含 `type=script` |
| `json` | 含 `json-compiler`；或 query 含 `type=json` |
| `dependency` | `ModuleNotFoundError` / `Can't resolve ...`：目标组件引用的模块、子组件、资源无法解析。作为**一等错误**上报，不做忽略 |
| `other` | 兜底 |

分类同时保留 `raw`（原始 webpack 错误 message）便于上层定位。

### 返回结构

```ts
interface ValidateResult {
  success: boolean            // errors.length === 0
  target: string              // 实际编译使用的 target
  projectRoot: string
  errors: CompileIssue[]
  warnings: CompileIssue[]
  summary: {
    total: number
    byCategory: Record<Category, number>
  }
  durationMs: number
}

interface CompileIssue {
  category: 'style' | 'template' | 'script' | 'json' | 'dependency' | 'other'
  message: string             // 清洗后的人类可读描述
  file?: string               // 源 .mpx 路径（按 moduleIdentifier 还原）
  block?: 'template' | 'style' | 'script' | 'json'
  loc?: { line: number; column: number }
  raw: string                 // stats.toJson 中的原始条目
}
```

### 忽略子组件编译（`ignoreSubComponents`）

Mpx 单文件组件的 `<script>` 配置或 `.json` 块中可通过 `usingComponents` 声明子组件，webpack 构建时会递归解析并编译这些子组件。对于只想验证"当前组件自身样式/模板/脚本是否 RN 兼容"的场景，把子组件也拉进来会带来干扰：子组件自身的问题会被算到本次校验里，且会显著拖慢速度。

因此提供 `ignoreSubComponents: boolean`（默认 `true`）选项：

- **实现方式**：注册一个**前置 loader**（`enforce: 'pre'`）匹配 `.mpx` 入口文件；loader 使用 `@mpxjs/webpack-plugin/lib/parser` 解析 SFC，在 `<script>` 块里将 `usingComponents` 字段置空（`{}`），在独立 `<config>` / JSON 块里同样移除 `usingComponents` 键，然后重新拼回源码产出。
  - 仅对"作为 entry 被编译的目标 `.mpx`"生效，避免误伤深层组件（实际上深层组件因 entry 已被裁剪，本就不会进入编译图）。
  - 保留 `componentPlaceholder`、`componentGenerics` 等其它字段不变。
- **关闭时（`false`）**：沿用 mpx-plugin 原生行为，子组件会被一同编译。子组件中的错误按照其所属文件正常分类返回，`CompileIssue.file` 会指向真实出错的子组件路径，便于 skill 层判断"错误是否来自目标组件自身"。

### 模块 API

```js
// .agents/skills/mpx-rn-style-guide/scripts/compile-validate.js
module.exports = async function compileValidate (input, options = {}) {
  // input: string | string[]  —— 一个或多个 .mpx 绝对路径
  // options: {
  //   target?: 'android' | 'ios' | 'web' | 'wx' | 'ali' | string[],   // 默认 'ios'
  //   projectRoot?: string,                                           // 覆盖自动探测结果
  //   ignoreSubComponents?: boolean,                                  // 默认 true，见上节
  //   cleanup?: boolean                                               // 默认 true，编译后删除 __mpx_compile_validate__ 子目录
  // }
}
module.exports.categorize = categorize            // 导出分类函数供单测
module.exports.resolveProjectRoot = resolveProjectRoot
```

### CLI 用法

文件入口同时具备 CLI 能力，便于 skill 执行期通过 `node` 直接调用：

```bash
node .agents/skills/mpx-rn-style-guide/scripts/compile-validate.js \
  <abs-path-to.mpx> [<abs-path-to.mpx> ...] \
  [--target=ios] [--no-ignore-sub-components] [--json]
```

- 默认 pretty 打印分类后的错误表；`--json` 输出上文 `ValidateResult` 结构。
- `--no-ignore-sub-components` 关闭默认的子组件忽略（等价于 `ignoreSubComponents: false`）。
- 进程退出码：`0` 无错误，`1` 存在错误，`2` 运行期异常（未找到 mpx-cli 等）。

### 与 skill 的对接

在 [.agents/skills/mpx-rn-style-guide/SKILL.md](../.agents/skills/mpx-rn-style-guide/SKILL.md) 的"检查与确认"阶段新增一步：改造完成后调用本脚本，对修改后的 `.mpx` 组件执行一次 `android` 目标编译，若返回 `success=false` 则将 `errors` 按分类反馈给模型用于二次修正；仅当校验通过才认为任务完成。

### 错误处理与边界

- `mpx-cli-service` 未安装：抛 `MpxCliNotFoundError`，exit 2。
- 目标 `.mpx` 不存在或不是文件：抛 `InvalidInputError`。
- 依赖解析失败（`Can't resolve ...`、`Module not found`、子组件路径错误、alias 未配置等）：**作为一等错误返回**，分类为 `dependency`，`success=false`，不做静默忽略。调用方需先修复依赖问题才能继续校验。
- `webpack` 回调 `err` 非空：抛原始错误。
- 多 target 场景：对每个 target 分别执行上述流程，结果按 `{ [target]: ValidateResult }` 返回。

### 不在本期范围

- 不做 watch 模式。
- 不尝试增量编译复用 webpack cache（首次正确性优先）。
- 不替代 lint / 单测，本工具只关心编译时错误。
