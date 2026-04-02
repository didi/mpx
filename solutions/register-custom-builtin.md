# 输出 Web 和 RN 时支持用户注册自定义的内建基础组件

## 需求描述

当前 Mpx 框架内在 `webpack-plugin/lib/runtime/components/react|web` 中维护了同微信小程序基础组件一致的内建组件，在编译时将模版中的用户编写的基础组件映射转换为框架内建组件实现（如 `view` → `mpx-view`），现在希望通过开放 `webpack-plugin` 中的配置，提供用户注册自定义内建组件的能力，对应配置可以提供到 `webpack-plugin` 的 `webConfig` 和 `rnConfig` 中，配置名为 `customBuiltInComponents`，key 为基础组件 tag 名，value 为自定义内建实现路径（约定见下文 **Value（文档约定）**，插件侧不做校验）。

## 1. 现状与数据流

### 1.1 编译侧

- 各基础组件在 `packages/webpack-plugin/lib/platform/template/wx/component-config/*.js` 中通过 `el.isBuiltIn = true` 及 `web` / `ios` / `android` 等钩子把源码标签（如 `view`）转换为输出端标签（Web 下多为 `mpx-view`，RN 下为 `mpx-view` / `mpx-simple-view` 等）。
- `packages/webpack-plugin/lib/template-compiler/compiler.js` 中 `processBuiltInComponents` 在遇到 `el.isBuiltIn` 时，向 `meta.builtInComponentsMap` 写入 **当前节点上的 `el.tag`（已是转换后的标签名）** 到默认实现路径的映射：
  - RN：`@mpxjs/webpack-plugin/lib/runtime/components/react/dist/${tag}`
  - Web：`@mpxjs/webpack-plugin/lib/runtime/components/${mode}/${tag}`
- `packages/webpack-plugin/lib/web/processTemplate.js` 与 `packages/webpack-plugin/lib/react/processTemplate.js` 在 `parse` 完成后，把 `meta.builtInComponentsMap` 与用户 `customBuiltInComponents` 合并后写入 `builtInComponentsMap`（经 `addQuery(..., { isComponent: true })`），再交给 `processScript` → `buildComponentsMap`，生成 `getComponent(require(...), { __mpxBuiltIn: true })` 形式的注册代码。

### 1.2 RN 子模版

- `packages/webpack-plugin/lib/react/template-loader.js` 对内联/引入的 `.wxml` 模版再次调用 `templateCompiler.parse`，并单独生成内建映射。自定义内建必须在 **主链路 processTemplate 与 template-loader** 两处一并处理。

## 2. 配置设计

### 2.1 字段位置与类型

在 **`MpxWebpackPlugin` 插件选项**（编译期）中已有 `webConfig`、`rnConfig`（见 `packages/webpack-plugin/lib/index.js` 初始化）。在其上增加可选字段：

```ts
customBuiltInComponents?: Record<string, string>
```

- **Web**：`webConfig.customBuiltInComponents`
- **RN**：`rnConfig.customBuiltInComponents`

**与运行时配置区分**：`mpx.config.webConfig` / `mpx.config.rnConfig` 为运行时使用；插件选项里的 `webConfig` / `rnConfig` 为编译期对象，二者不是同一引用。`customBuiltInComponents` **仅**在插件侧读取。

### 2.2 Key 的约定

配置 key 为 **运行时内建标签名**（如 `mpx-view`、`mpx-text`），与 `meta.builtInComponentsMap` 及 `processBuiltInComponents` 中 `el.tag` 一致，而非微信侧 `view`、`text`。

### 2.3 Value（文档约定，插件不校验）

**约定**（由业务与文档遵守；**`@mpxjs/webpack-plugin` 不对 value 做格式校验**，错误配置由 webpack 解析失败等方式暴露）：

| 类型 | 说明 | 示例 |
|------|------|------|
| 绝对路径 | POSIX 下以 **`/`** 开头的绝对路径；Windows 下 **`path.isAbsolute` 为真**的路径（盘符路径等） | `/Users/proj/src/a.vue`、`C:\proj\src\a.vue` |
| npm 包路径 | **作用域包**：以 **`@scope/pkg/`** 形式开头（`@` + scope + `/` + 包名 + `/` + 子路径） | `@acme/ui-rn/MpxView.mpx` |
| npm 包路径 | **无作用域包**：字符串以 **npm 包名** 开头，即首段为合法包名片段，后可跟 `/子路径`；避免写成易被误认为工程目录相对路径的形式（如不要用 `src/...` 冒充包名） | `my-builtin-pkg/MpxText.mpx` |

**明确不支持 / 禁止写入约定**：

- **不支持**以 **`~`** 开头的 webpack 模块前缀（不要使用 `~pkg/...`）。
- **不要使用** **`./`、`../`**（及 **`.\\`、`..\\`**）等相对路径。

合并方式：**`Object.assign({}, meta.builtInComponentsMap, customBuiltInComponents || {})`**，再对合并结果逐项 **`addQuery(..., { isComponent: true })`**。

## 3. 实现方案（已落地）

### 3.1 总体策略

- **不改变** `compiler.js` 中默认 `meta.builtInComponentsMap` 的生成。
- **Web app**（`ctorType === 'app'`）：仅注入固定的 **`mpx-keep-alive`**，**不**读取 **`webConfig.customBuiltInComponents`**。
- **Web 非 app / RN**：在拿到 **`meta`** 后（Web 在 `parse` 回调内；RN 主链路与 `template-loader` 各一处）做上述合并并写入产物。

### 3.2 修改文件

| 文件 | 行为 |
|------|------|
| `packages/webpack-plugin/lib/web/processTemplate.js` | app 只写 keep-alive；非 app 在 parse 后 `Object.assign` + `addQuery`。 |
| `packages/webpack-plugin/lib/react/processTemplate.js` | 有 `template.content` 且 parse 后同上（`rnConfig.customBuiltInComponents`）。 |
| `packages/webpack-plugin/lib/react/template-loader.js` | parse 后同上。 |

### 3.3 自定义实现组件契约

替换实现应尽可能与被替换内建在 props、事件、子节点等行为上一致；导出形态需与 web/vue 或 react 内建兼容，以便 `getComponent(..., { __mpxBuiltIn: true })` 与样式、事件代理正常工作。

## 4. 错误处理

- 插件 **不对** `customBuiltInComponents` 的 value 做合法性校验；路径无法解析等问题由 **webpack 构建**暴露。

## 5. 测试建议

- Web / RN：按 §2.3 约定配置绝对路径、`@scope/pkg/...`、无作用域包名路径，断言产物 `require` 目标正确。

## 6. 用户示例

```js
const path = require('path')

new MpxWebpackPlugin({
  mode: 'web',
  webConfig: {
    customBuiltInComponents: {
      'mpx-view': path.resolve(__dirname, 'src/builtin/web/MpxView.vue'),
      'mpx-text': '/abs/path/to/MpxText.vue'
    }
  },
  rnConfig: {
    customBuiltInComponents: {
      'mpx-view': '@your-org/mpx-rn-builtin/MpxView.mpx',
      'mpx-scroll-view': '@your-org/mpx-rn-builtin/MpxScrollView.mpx'
    }
  }
})
```

## 7. 风险与后续扩展

- RN 上同一微信标签可能对应 `mpx-simple-view` 等，需按实际 AST 中的 tag 配置。
- `mode` 为小程序原生输出时不走上述 Web/RN 合并逻辑。
- 若需支持「微信 tag 为 key」的别名，需另做映射层。
