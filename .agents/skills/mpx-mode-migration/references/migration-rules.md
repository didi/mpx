# 迁移规则与判定矩阵

## 核心语义

升级后的职责固定为：

- `mode`：决定文件、SFC 区块、模板节点或属性是否在当前目标平台生效；
- `srcMode`：决定源码使用哪种平台方言，以及是否执行跨平台转换。

`env` 仍只负责业务环境筛选，`__mpx_mode__` / `__mpx_env__` 与样式 `@mpx-if` 的语义不变。

## 规则码

### `CONFIG_RULES_CONFLICT_CANDIDATE`

同一配置范围同时存在 `modeRules` 和 `srcModeRules` 时，新版插件会报配置冲突。

核实：

1. 确认两个 key 是否最终传入同一个 `MpxWebpackPlugin` 实例。
2. 如果只是注释、文档字符串或不同构建配置，不应判为冲突。

迁移：

- 合并为一个 `srcModeRules`；
- 保持每个 target 原有的 `include` / `exclude`；
- 删除旧 `modeRules`。

### `LEGACY_MODE_RULES`

`modeRules` 仍是兼容别名，不阻塞升级，但建议改名为 `srcModeRules`，让“源码方言规则”语义明确。

不要同时保留新旧两个 key。

### `CONDITIONAL_FILE_SOURCE_MODE`

旧版在非微信小程序目标下选中 `.ali.*`、`.swan.*` 等条件文件时，会把文件隐式视为目标平台源码；新版条件文件只负责筛选，默认继承项目 `srcMode`。

需要审计的小程序 target：

- `ali`
- `swan`
- `qq`
- `tt`
- `jd`
- `dd`
- `qa`
- `ks`

`.web.*`、`.ios.*`、`.android.*`、`.harmony.*` 文件在旧版已经是纯筛选，不因本次文件选择改动单独要求迁移。它们内部仍可能因 SFC 区块或 `@mode` 命中其他规则。

判定：

- 文件按项目 `srcMode` 编写：无需修改；
- 文件完整使用目标小程序原生语法：通过 `srcModeRules.<target>` 精确覆盖；
- 只有少量差异：优先改为项目 `srcMode` 语法或缩小原生资源范围。

### `SFC_BLOCK_SOURCE_MODE`

SFC 区块的 `mode` 不再隐式成为局部源码方言。

实际受影响矩阵：

| 区块 | 需要审计的 mode | 说明 |
| --- | --- | --- |
| `template` | 所有非 `wx` mode | 旧流程可能用 block mode 跳过模板平台转换 |
| `script` | 所有非 `wx` mode | 旧流程可能把 `global.currentSrcMode` 设为 block mode |
| JSON (`script name="json"` / application JSON) | 非微信小程序 mode | 小程序 JSON 编译曾读取 block mode |
| `style` | 无 | 旧流程未用 block mode 选择样式源码方言，不能仅因 `mode` 存在就判为迁移项 |

判定：

- 区块按项目 `srcMode` 编写：无需修改；
- 完整目标原生区块：增加 `src-mode="<target>"`；
- `src-mode` 仅在等于当前输出 `mode` 时生效，否则回退到资源 `srcMode`；
- RN 原生模板区块使用已注册的 `View`、`Text` 等组件；`src-mode` 不会把模板变成 JSX，也不会把 CSS 变成 `StyleSheet`。

### `AT_MODE_TRANSFORM_SEMANTICS`

显式 `@mode` 的节点或属性从“命中后跳过平台规则”变为“命中后正常执行平台规则”。

需要审计：

- `@ali`、`@ios|android|harmony` 等节点条件；
- `bindtap@ali`、`numberOfLines@ios`、`@click@web` 等属性条件；
- mode + env 组合，例如 `open-type@ali:didi`。

逐项判定：

- 先结合项目 `srcMode`、目标平台规则和完整节点上下文，确认节点名、属性名及属性值采用项目 `srcMode` 语法，还是目标平台原生语法；
- 采用项目 `srcMode` 语法、期望框架转换：无需修改；
- 采用目标平台原生语法，但没有命中任何源平台转换规则：可安全直通，无需修改；
- 采用目标平台原生语法，且会被源平台规则重命名、改值、删除或诊断：优先改成项目 `srcMode` 的等价写法；没有等价写法时移入 `src-mode` 区块或由 `srcModeRules` 覆盖的独立资源；
- `mpxTagName@mode`，旧版已经按转换路径处理；
- 纯 env 条件，例如 `@:didi`；
- 仅 `@wx` 且项目源平台为微信的写法。

需要迁移：

- 依赖旧版跳过转换，且新版规则会重命名、改值、删除或诊断该目标原生语法；
- 大段完整目标原生模板，应移入 `src-mode` 区块或由 `srcModeRules` 覆盖的独立资源。

目标平台原生属性是否安全直通，以它在当前项目 `srcMode -> mode` 转换规则中的实际命中结果为准，不能只根据属性来源平台推断。RN 场景还需以 `mpx2rn` Skill 的能力口径核对支持范围。

#### 从项目安装版本核对转换规则

以目标项目实际安装的 `@mpxjs/webpack-plugin` 为唯一判定依据，不要使用全局安装或在线最新版本代替。使用本 Skill 自带的定位脚本，并显式传入目标项目根目录：

```bash
node <skill-root>/scripts/resolve-platform.js <project-root>
```

脚本只解析包的公开入口，再向上定位包根目录，并验证 `lib/platform/index.js` 存在；因此不依赖包是否开放 `package.json` 子路径，也不依赖命令执行时的当前目录。定位失败时先确认 `<project-root>` 正确且项目已安装 `@mpxjs/webpack-plugin`，不要回退到其他版本的源码。

然后按实际安装包的加载链路核对：

1. 读取 `lib/platform/index.js`，确认当前 `type` 和项目 `srcMode` 最终选择的规则集。模板 `@mode` 对应 `type: 'template'`。
2. 读取被选中的 `lib/platform/template/<srcMode>/index.js`、其引入的组件配置，以及 `normalize-component-rules.js` / `run-rules.js`。目录和文件名以安装版本为准，不假设始终只有 `wx`。
3. 按完整节点上下文检查标签、指令、属性、事件和属性值规则。规则的 `test` 命中且存在当前目标 `mode` 的处理器时，才算实际命中；还要继续考虑 `waterfall` 规则。
4. 没有实际命中：原输入会安全直通，归入“无需修改”。
5. 实际命中：检查处理器是重命名、改值、返回 `false`、拆分属性，还是产生 warning/error，再决定是否迁移。

报告中为每个已核实的 `@mode` 候选记录插件安装版本、规则文件与行号、匹配的 `test`、目标 `mode` 处理器及最终判定。静态控制流难以确认时，使用同一安装版本的模板编译器构造最小输入验证，不要换用其他版本。

`@_mode` 与新版 `@mode` 行为一致，现有代码可继续工作。将其改成 `@mode` 只是兼容清理。

### `EXTERNAL_TEMPLATE_SOURCE_MODE`

小程序模板中的 `<import>` / `<include>` 不再继承引用方局部 `srcMode`，被引用资源必须独立决定源码方言。

需要沿引用链检查的场景：

- 非微信小程序条件模板文件；
- 带受影响 `mode` 的小程序 template SFC 区块；
- 新增了 `src-mode="<mini-target>"` 的 template 区块。

迁移：

- 被引用模板按项目 `srcMode` 编写：无需配置；
- 被引用模板使用目标原生语法：用 `srcModeRules.<target>` 覆盖被引用文件自身；
- 不要假设父级 `src-mode` 会向 `<import>` / `<include>` 传播。

## 配置示例

### 完整目标原生文件

```js
new MpxWebpackPlugin({
  mode: 'ali',
  srcMode: 'wx',
  srcModeRules: {
    ali: {
      include: [
        resolve('src/ali-native'),
        resolve('node_modules/vant-aliapp')
      ]
    }
  }
})
```

构建时只消费当前输出 `mode` 对应的规则；`srcModeRules.ali` 不会在其他 target 构建中生效。

### 完整目标原生区块

```html
<template mode="ali" src-mode="ali">
  <view onTap="handleTap">支付宝原生模板</view>
</template>
```

### 默认继续转换的条件区块

```html
<template mode="ali">
  <view bindtap="handleTap">仍按项目 srcMode 编写</view>
</template>
```

### RN 原生模板区块

```html
<template mode="ios" src-mode="ios">
  <View>
    <Text>RN 原生模板</Text>
  </View>
</template>
```

## 不应误报的能力

以下能力没有因本次升级改变：

- 脚本或 JSON 中的 `__mpx_mode__` / `__mpx_env__` 分支；
- 样式中的 `/* @mpx-if (...) */`；
- SFC 区块的 `env` 选择和优先级；
- Android / Harmony 条件文件回退到 `.ios.*` 文件；
- 未命中的文件、区块、节点和属性仍被排除；
- `@_mode` 的转换效果；
- `mpxTagName@mode` 的标签替换和转换路径。
