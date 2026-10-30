# 编译校验

> **脚本位置**：编译校验脚本随本 skill 一同分发，位于 **skill 目录下** 的 `scripts/compile-validate.js`（即 `<skill-root>/scripts/compile-validate.js`），下文所有命令示例均使用 **指向 skill 目录的路径**调用该脚本，不要尝试在宿主项目根目录或 `node_modules` 中查找它。

该脚本基于宿主项目内安装的 `@mpxjs/mpx-cli-service` 进行真实编译校验：会自动从输入 `.mpx` 文件向上探测宿主项目根目录、加载工程编译配置、按指定 `target` 进行编译，并按 `style / template / script / json / dependency / other` 分类聚合错误与警告。默认只验证目标 `.mpx` 文件：默认不检查子组件，因此结果不代表子组件路径、行为及完整依赖均已验证。SFC 改造或新建后在宿主支持时运行；必须显式传入本次实际目标，不能让 Web/微信任务误用默认 ios。

## 目录

- [命令行参数](#命令行参数)
- [使用示例](#使用示例)
- [校验边界](#校验边界)

## 命令行参数

| 属性 | 类型 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `<file.mpx>...` | `string[]` | - | 一个或多个待校验的 `.mpx` 绝对/相对路径 |
| `--target=<mode>` | `string` | `ios` | 编译目标，多个用逗号分隔（如 `wx,ios,web`） |
| `--type=<page\|component>` | `string` | `component` | 入口类型，按页面或组件进行校验 |
| `--project-root=<path>` | `string` | 自动探测 | 显式指定业务构建工程根目录，用于依赖解析与构建配置加载 |
| `--no-ignore-sub-components` | `boolean` | 关闭 | 保留 `usingComponents`，解析并递归编译所有子组件 |
| `--json` | `boolean` | 关闭 | 输出结构化 JSON 结果 |

退出码：`0` 校验通过（无错误、无警告）；`1` 存在编译错误或警告；`2` 运行期异常（如未找到 `@mpxjs/mpx-cli-service`）。

宿主工程是输入文件所属的业务构建工程，不一定是 Git 仓库根目录或 Skill 所在目录。默认从输入文件向上探测；显式指定的 `--project-root` 应能解析 `@mpxjs/mpx-cli-service` 并加载对应构建配置。依赖解析失败也可能由工程路径错误引起。

## 使用示例

> 先将下方 `skillRoot` 改为本 skill 的实际安装绝对路径（可能位于 `.agents/skills/mpx`、`.claude/skills/mpx` 等），并在业务工程根目录执行；`src/...` 相对该业务工程解析，不相对 Skill 目录。

```bash
skillRoot="/absolute/path/to/mpx-skill"

# 检查候选业务工程能否解析编译依赖
node -e "console.log(require.resolve('@mpxjs/mpx-cli-service', { paths: [process.argv[1]] }))" /absolute/path/to/app

# 单组件、显式 target=ios
node "$skillRoot/scripts/compile-validate.js" src/components/foo.mpx --target=ios

# 显式指定为页面
node "$skillRoot/scripts/compile-validate.js" src/pages/index.mpx --type=page --target=ios

# 跨端多目标校验
node "$skillRoot/scripts/compile-validate.js" src/components/foo.mpx --target=wx,ios,web

# 输出结构化 JSON 便于二次处理
node "$skillRoot/scripts/compile-validate.js" src/components/foo.mpx --target=ios --json

# 同时递归校验子组件（默认行为是仅校验目标自身）
node "$skillRoot/scripts/compile-validate.js" src/components/foo.mpx --target=ios --no-ignore-sub-components
```

校验失败时按错误或警告的 `category` 字段回到对应任务步骤定位与修正问题，修复本次变更相关问题后重跑。遵守宿主仓库的测试失败重试上限；本仓库单元测试最多尝试 3 次修复，仍失败时保留错误与分析。

## 校验边界

编译依赖宿主工程中兼容的 `@mpxjs/mpx-cli-service`；依赖不可用时无法完成真实编译，静态检查不能替代构建结果。

默认排除子组件，只校验目标文件；若变更涉及组件注册路径、抽象节点或子组件接口，使用 `--no-ignore-sub-components` 或宿主完整构建。真实运行、原生依赖、浏览器权限、SSR 双端构建不由单文件校验覆盖。
