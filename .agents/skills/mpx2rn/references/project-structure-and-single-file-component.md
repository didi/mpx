# 项目结构与单文件组件 {#project-structure-and-single-file-component}

## 项目结构 {#project-structure}

Mpx 项目的业务源码通常放在 `src` 目录中，由应用入口、页面、组件，以及按需创建的公共模块和分包组成：

```text
src/
├── app.mpx                 # 应用入口与全局配置
├── pages/                  # 页面
│   └── index.mpx
├── components/             # 可复用组件
│   └── hello-card.mpx
├── packages/               # 分包（按需创建，目录名可自定义）
│   └── package-a/
│       ├── app.mpx         # 分包入口
│       └── pages/
│           └── detail.mpx
├── utils/                  # 公共工具（按需创建）
├── store/                  # 状态管理（按需创建）
└── styles/                 # 公共样式（按需创建）
```

- `app.mpx`：注册应用实例、页面和全局配置；页面通过其 JSON 区块中的 `pages` 字段注册。
- `pages`：存放页面级 `.mpx` 文件。
- `components`：存放可复用组件；组件通过页面或父组件 JSON 区块中的 `usingComponents` 字段注册。
- `packages`：示例中的分包目录，按项目需要创建且名称不固定；每个分包可通过自己的 `app.mpx` 管理分包页面。
- `utils`、`store`、`styles`：分别存放公共工具、状态和样式，按项目需要创建。

跨端输出 RN 时，业务代码仍在 `src` 中维护；CLI 创建的项目通常还包含 `ReactNativeProject` 原生工程目录，编译产物输出到 `dist/react-native`。一般业务开发无需直接修改编译产物。

应用入口通过 JSON 区块注册主包页面；存在分包时，推荐通过 [`packages`](./rn-json-reference.md#使用-packages-定义分包) 注册分包入口：

```html
<!-- src/app.mpx -->
<script type="application/json">
  {
    "pages": [
      "./pages/index"
    ],
    "packages": [
      "./packages/package-a/app.mpx?root=package-a"
    ]
  }
</script>
```

分包入口再通过自身的 JSON 区块注册分包页面：

```html
<!-- src/packages/package-a/app.mpx -->
<script type="application/json">
  {
    "pages": [
      "./pages/detail"
    ]
  }
</script>
```

从上述结构可以看到，Mpx 中的 App（`app.mpx`）、页面和组件都使用 `.mpx` 单文件语法组织代码。三者的职责和包含的区块略有不同，但都遵循相同的单文件组织方式，下面将具体介绍 `.mpx` 单文件组件的结构。

## 单文件组件 {#single-file-component}

原生小程序使用 WXML、JS、WXSS 和 JSON 四个文件描述一个页面或组件。Mpx 将这些内容集中在扩展名为 `.mpx` 的单文件组件（SFC）中：

| 区块 | 职责 | 对应原生文件 |
| --- | --- | --- |
| `<template>` | 视图结构和数据绑定 | `.wxml` |
| `<script>` | 页面或组件逻辑 | `.js` |
| `<style>` | 局部样式，可使用 CSS 预处理器 | `.wxss` |
| `<script type="application/json">` | 页面或组件配置 | `.json` |

`app.mpx` 通常包含应用逻辑、全局样式和应用配置，不需要 `<template>`；页面和组件通常包含上述四个区块。

下面以首页为例展示一个精简的完整 SFC：

```html
<!-- src/pages/index.mpx -->
<template>
  <view class="page">
    <text>{{title}}</text>
    <hello-card />
  </view>
</template>

<script>
  import { createPage } from '@mpxjs/core'

  createPage({
    data: {
      title: 'Hello Mpx'
    }
  })
</script>

<style>
  .page {
    padding: 32rpx;
  }
</style>

<script type="application/json">
  {
    "usingComponents": {
      "hello-card": "../components/hello-card"
    }
  }
</script>
```

Mpx 编译时会从 `app.mpx` 开始解析已注册页面和组件的依赖，并将各 `.mpx` 文件转换为目标平台所需的代码。涉及 RN 平台时，还需继续按模板、脚本、样式和 JSON 配置四个维度查阅对应能力参考。
