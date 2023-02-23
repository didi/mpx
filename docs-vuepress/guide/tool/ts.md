# 使用TypeScript开发小程序

## 什么是TypeScript

TypeScript 是一个开源的编程语言，通过在 JavaScript（世界上最常用的语言之一） 的基础上添加静态类型定义构建而成。

类型提供了一种描述对象形状的方法。可以帮助提供更好的文档，还可以让 TypeScript 验证你的代码可以正常工作。

在 TypeScript 中，不是每个地方都需要标注类型，因为类型推断允许您无需编写额外的代码即可获得大量功能。

## TypeScript优势

1. 静态类型检查
   静态类型检查可以避免很多不必要类型的错误，在编译阶段提前发现问题；

2. 强大的类型推断能力
   除了类型声明外，`TypeScript` 提供了强大的类型推断能力，该能力能够大大减少我们需要编写的类型声明，有效地减少我们使用 `TypeScript` 的额外压力；

3. IDE 智能提示
   目前主流的 IDE 都对 `TypeScript` 提供了良好的支持，基于 `TypeScript` 的类型系统提供友好准确的编码提示与错误检查。


## 使用方式

### 编写ts前的准备工作

由于对 store 做类型推导使用了最新的 `TypeScript` 特性，因此需要将编辑器的 `TypeScript` 版本升级至 **4.1.3** 及以上版本。以下是 VSCode 配置示例：

1. 更新项目中的TypeScript为 4.1.3 及以上版本。

2. 在VSCode中打开一个 .js/.ts/.tsx 后缀的文件，使用 `Shift+Command+P` 唤出 VSCode 命令行，输入 `TypeScript` ，选择 `Select TypeScript Version`，选择使用工作区版本，将版本切换至 4.1.3 及以上版本。

<img src="https://gift-static.hongyibo.com.cn/static/kfpub/3547/select-ts-version.png" style="border-radius: 6px"/>

3. 在 VSCode 编辑器中安装 mpx 插件，来支持在.mpx单文件中编写 ts 时的代码提示和实时报错等优秀体验。

::: warning
使用 @typescript/eslint-plugin 对 ts 代码进行检查，当在.mpx文件中使用全局类型时，eslint 会抛出 no-undef 错误，可以关闭相关 eslint 规则校验
:::

### .mpx中编写ts（推荐）

目前 Mpx 已经支持在.mpx文件的 script 标签中编写 ts 代码，需要在 script 标签上添加 ` lang="ts" ` 属性，在编译时会自动这部分 script 中的内容进行 ts 类型检查。

```html
<script lang="ts">
// 内联编写ts代码
</script>
```

当然，由于大部分IDE对 ts 的语法支持都只对 .ts 和 .d.ts 文件生效，因此 Mpx 也支持创建一个 .ts 文件进行 ts 代码编写，在.mpx文件中，通过 src 的方式引入。

```html
<script lang="ts" src="./index.ts"></script>
```

### 为.ts文件添加loader

在 Webpack 配置中添加如下 rules 以配置 ts-loader

```js
{
  test: /\.ts$/,
  use: [
    'babel-loader',
    'ts-loader'
  ]
}
```

### 编写tsconfig.json文件

对相关配置不熟悉的同学可以直接采用下面配置，能够最大限度发挥 Mpx 中强大的 ts 类型推导能力

```json
{
  "compilerOptions": {
    "target": "es6",
    "allowJs": true,
    "noImplicitThis": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "moduleResolution": "node",
    "lib": [
      "dom",
      "es6",
      "dom.iterable"
    ]
  }
}
```

### 增强类型

如果需要增加 Mpx 的属性和选项，可以自定义声明 `TypeScript` 补充现有的类型。

例如，首先创建一个 types.d.ts 文件

```ts
// types.d.ts

import { Mpx } from '@mpxjs/core'

declare module '@mpxjs/core' {
  // 声明为 Mpx 补充的属性
  interface Mpx {
    $myProperty: string
  }
}
```

之后在任意文件只需引用一次 types.d.ts 声明文件即可，例如在 app.mpx 中引用

```ts
// app.mpx

/// <reference path="./types.d.ts" />
import mpx from '@mpxjs/core'

mpx.$myProperty = 'my-property'
```

## 类型推导及注意事项

Mpx 基于泛型函数提供了非常方便用户使用的反向类型推导能力，简单来说，就是用户可以用非常接近于 js 的方式调用 Mpx 提供的 api ，就能够获得大量基于用户输入参数反向推导得到的类型提示及检查。但是由于 ts 本身的能力限制，我们在 Mpx 的运行时中添加了少量辅助函数和变种api，便于用户最大程度地享受反向类型推导带来的便利性，简单的使用示例如下：

```typescript
import {createComponent, getMixin, createStoreWithThis} from '@mpxjs/core'

// createStoreWithThis作为createStore的变种方法，主要变化在于定义getters，mutations和actions时，
// 获取自身的state，getters等属性不再通过参数传入，而是通过this.state或者this.getters等属性进行访问，
// 由于TS的能力限制，getters/mutations/actions只有使用对象字面量的方式直接传入createStoreWithThis时
// 才能正确推导出this的类型，当需要将getters/mutations/actions拆解为对象编写时，
// 需要用户显式地声明this类型，无法直接推导得出。

const store = createStoreWithThis({
  state: {
    aa: 1,
    bb: 2
  },
  getters: {
    cc() {
      return this.state.aa + this.state.bb
    }
  },
  actions: {
    doSth3() {
      console.log(this.getters.cc)
      return false
    }
  }
})

createComponent({
  data: {
    a: 1,
    b: '2'
  },
  computed: {
    c() {
      return this.b
    },
    d() {
      // data, mixin, computed中定义的数据能够被推导到this中
      return this.a + this.aaa + this.c
    },
    // 从store上map过来的计算属性或者方法同样能够被推导到this中
    ...store.mapState(['aa'])
  },
  mixins: [
    // 使用mixins，需要对每一个mixin子项进行getMixin辅助函数包裹，支持嵌套mixin
    getMixin({
      computed: {
        aaa() {
          return 123
        }
      },
      methods: {
        doSth() {
          console.log(this.aaa)
          return false
        }
      }
    })
  ],
  methods: {
    doSth2() {
      this.a++
      console.log(this.d)
      console.log(this.aa)
      this.doSth3()
    },
    ...store.mapActions(['doSth3'])
  }
})
```

### getMixin

为 ts 项目提供的反向推导 mixin 的辅助函数，getMixin 接收一个对象作为参数，使用 mixins 时，支持嵌套 mixin。具体用法见[getMixin](../../api/global-api.md#getmixin)。

### createStoreWithThis

为了在 ts 项目中更好的支持 store 的类型推导，提供了 createStoreWithThis 进行 store 的创建，createStoreWithThis 接收一个 options 对象作为参数。通过 createStoreWithThis 创建 store 时，使用` this.state `，` this.getters `，` this.commit `, ` this.dispatch `对自身的相关属性进行获取。具体用法见[createStoreWithThis](../../api/store-api.md#createstorewiththis)。

### createStateWithThis

创建一个 state，支持 state 类型推导的辅助函数，具体用法见[createStateWithThis](../../api/store-api.md#createstatewiththis)

### createGettersWithThis

创建一个 getters，支持 getters 类型推导的辅助函数，具体用法见[createGettersWithThis](../../api/store-api.md#creategetterswiththis)

### createMutationsWithThis

创建一个 mutations，支持 mutations 类型推导的辅助函数，具体用法见[createMutationsWithThis](../../api/store-api.md#createmutationswiththis)

### createActionsWithThis

创建一个 actions，支持 actions 类型推导的辅助函数，具体用法见[createActionsWithThis](../../api/store-api.md#createactionswiththis)

