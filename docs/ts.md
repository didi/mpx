# Typescript支持

### 为什么要使用Typescript

>  `TypeScript` 是 `JavaScript` 的强类型版本，就然后在编译期去掉类型和特有语法，生成纯粹的 `JavaScript` 代码。由于最终在浏览器中运行的仍然是 `JavaScript`，所以 `TypeScript` 并不依赖于浏览器的支持，也并不会带来兼容性问题。

> `TypeScript` 是 `JavaScript` 的超集，这意味着他支持所有的 `JavaScript` 语法。并在此之上对 `JavaScript` 添加了一些扩展，如 `class` / `interface` / `module` 等。这样会大大提升代码的可阅读性。

### 总体上好处可以归纳成下面4点：

1.  静态类型检查

    静态类型检查可以避免很多不必要类型的错误，不用在调试的时候才发现问题。

2.  IDE 智能提示
    在 `TypeScript` 这一类语言之前， `JavaScript`  的智能提示基本完全依赖 IDE 提供的猜测。局限性就是，这种猜测可能并不正确。并且也缺乏更多的辅助信息, 所以要正确使用一个类库, 得不断地在文档和 IDE 之间切换，影响心情和效率， 而 `TypeScript` 不仅自己写的类库有丰富的类型信息。

3. 代码重构

    有时候的确需要修改一些变量/属性/方法名，牵涉到属性和方法的时候，很多改动是跨文件的，不像普通变量可以简单定位 `scope` ， 属性方法名的重命名对于 `JavaScript`来说异常痛苦， 一方面是修改本身就不方便, 另一方面是改了还不确定该改的是不是改了，不该改的是不是也改了。而 TypeScript 的静态类型系统就可以较为完美的解决这个问题。

4. 可读性

    对于阅读代码的人来讲，各种便利的类型一目了然，更容易明白作者的意图。

## 使用方式

### .mpx中编写ts

.mpx文件中script标签声明lang为ts，在编译时会自动这部分script中的内容进行ts类型检查

```html
<script lang="ts">
// 内联编写ts代码
</script>
```

由于大部分IDE对ts的语法提示支持都只对.ts和.d.ts文件生效，上述在.mpx文件中编写ts代码虽然能在编译时进行ts类型检查，但是无法享受IDE中编写ts时的代码提示和实时报错等优秀体验，所以，我们更建议大家创建一个.ts文件进行ts代码编写，通过src的方式引入到.mpx当中

```html
<script lang="ts" src="./index.ts"></script>
```

### 为.ts文件添加loader

在webpack配置中添加如下rules以配置ts-loader

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

对相关配置不熟悉的同学可以直接采用下面配置，能够最大限度发挥mpx中强大的ts类型推导能力

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

如果需要增加 Mpx 的属性和选项，可以自定义声明 TypeScript 补充现有的类型。

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

Mpx基于泛型函数提供了非常方便用户使用的反向类型推导能力，简单来说，就是用户可以用非常接近于js的方式调用Mpx提供的api，就能够获得大量基于用户输入参数反向推导得到的类型提示及检查。但是由于ts本身的能力限制，我们在mpx的运行时中添加了少量辅助函数和变种api，便于用户最大程度地享受反向类型推导带来的便利性，具体的注意事项和使用方法如下述demo

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

更加具体的使用方法和实现原理我们会在后面的文档和文章中补充完整


