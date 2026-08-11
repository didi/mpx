# Mpx2RN 编译校验脚本

编译校验脚本随 skill 分发，位于 `<skill-root>/scripts/compile-validate.js`。使用指向 skill 目录的实际路径调用，不要在宿主项目根目录或 `node_modules` 中查找。

脚本基于宿主项目安装的 `@mpxjs/mpx-cli-service` 进行真实编译：从输入 `.mpx` 文件向上探测项目根目录，加载工程编译配置，按指定 target 编译，并按 `style / template / script / json / dependency / other` 聚合错误与警告。

## 命令行参数

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `<file.mpx>...` | - | 一个或多个待校验的 `.mpx` 绝对或相对路径 |
| `--target=<mode>` | `ios` | 编译目标，多个用逗号分隔，如 `wx,ios,web` |
| `--type=<page\|component>` | `component` | 入口类型，决定使用 `getPageEntry` 还是 `getComponentEntry`，并影响 `partialCompileRules` 形态 |
| `--project-root=<path>` | 自动探测 | 显式指定宿主项目根目录 |
| `--no-ignore-sub-components` | 关闭 | 关闭默认子组件占位策略，递归编译所有子组件 |
| `--json` | 关闭 | 输出结构化 JSON 结果 |
| `-h, --help` | - | 查看命令帮助 |

退出码：`0` 表示校验通过（无错误、无警告）；`1` 表示存在编译错误或警告；`2` 表示运行期异常，例如未找到 `@mpxjs/mpx-cli-service`。

## 使用示例

```bash
# 单组件，默认 target=ios
node <skill-root>/scripts/compile-validate.js src/components/foo.mpx

# 页面入口
node <skill-root>/scripts/compile-validate.js src/pages/index.mpx --type=page --target=ios

# 跨端多目标校验
node <skill-root>/scripts/compile-validate.js src/components/foo.mpx --target=wx,ios,web

# 输出结构化 JSON
node <skill-root>/scripts/compile-validate.js src/components/foo.mpx --target=ios --json

# 递归校验子组件
node <skill-root>/scripts/compile-validate.js src/components/foo.mpx --target=ios --no-ignore-sub-components
```

校验失败时按错误或警告的 `category` 回到对应维度定位并修正，再次运行直至无错误、无警告。普通文本输出和 `--json` 结果都会包含警告；汇总中的 `total` 与 `byCategory` 同时统计错误和警告。
