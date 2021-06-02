---
sidebarDepth: 2
---

# 使用Typescript新特性Template Literal Types完善链式key的类型推导

## 前言

在**Mpx框架**中我们采用了类似 `Vuex` 的数据仓库设计，这使得小程序的数据也可以在框架中得到**统一的管理**。但由于设计上的原因，这一部分在TS推导的实现上变得异常艰难，其中有一个明显的问题就是**链式key**的推导：

```ts
// 一段 mpx-store 代码实例

createStoreWithThis({
  // other options ...
  actions: {
    someAction() {
      // 下面这一个dispatch语句如何得到正确的推导？result的类型如何获取？
      let result = this.dispatch('deeperActions.anotherAction', 1)
      return result
    }
  },
  deps: {
    deeperActions: createStoreWithThis({
      actions: {
        anotherAction(payload: number) {
          // do something
          return 'result' + payload
        }
      }
    }),
    // other deps ...
  }
})
```

我们该如何获取 `this.dispatch('deeperActions.anotherAction', 1)` 的返回值？如何针对dispatch后续的参数类型做限制？这几乎是不可能解决的问题。

好消息是，在 2020.09.19，typescript团队release了一个[beta版本](https://github.com/microsoft/TypeScript/releases/tag/v4.1-beta)。这个版本新推出了一个特性：**模板字符串类型（Template Literal Types）**。

这让**链式key**的推导出现了曙光，不久后，我们开始尝试完善 `mpx-store` 的推导，此篇文章也是基于我们实践中所做的一些工作总结而来。

## 特性

这里可以直接看[官网](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html)例子，可以十分直观的感受到其特性：

```ts
type Color = "red" | "blue";
type Quantity = "one" | "two";

type SeussFish = `${Quantity | Color} fish`;
//   ^ = type SeussFish = "one fish" | "two fish" | "red fish" | "blue fish"
```

根据例子得知：模板字符串的使用方式几乎和ES6的字符串模板一致，可以做字符串的拼接，当接收字面量联合类型时，会做matrix操作，返回所有可能的拼接后的字面量联合类型。

另一个例子：

```ts
type A = '1' | '2'
type B = 'a' | 'b'
type C = 'C' | 'D'

type D = `${A}${B}${C}`
// type D = "1aC" | "1aD" | "1bC" | "1bD" | "2aC" | "2aD" | "2bC" | "2bD"
```

## 可以用来做什么

这个新特性的出现使得在js中常用的链式key取值，调用等，都能够使用ts进行完整的推导。

**第一个问题：**

```js
function getValueByPath(object, prop) {
  prop = prop || '';
  const paths = prop.split('.');
  let current = object;
  let result = null;
  for (let i = 0, j = paths.length; i < j; i++) {
    const path = paths[i];
    if (!current) break;

    if (i === j - 1) {
      result = current[path];
      break;
    }
    current = current[path];
  }
  return result;
}

// 调用例子
getValueByPath({ a: false }, 'a') // false
getValueByPath({ a: { b: { c: 1 } } }, 'a.b') // { c: 1 }
```

**如何将以上 getValueByPath 函数使用ts改写，使该函数的调用具有完备的类型推断？**

**第二个问题：**

```ts
type simpleActions = {
  actionOne(payload: number): Promise<number>
  actionTwo(payload: string): Promise<boolean>
}

declare function dispatch<K extends keyof simpleActions>(type: K): ReturnType<simpleActions[K]>

dispatch('actionOne')
// function dispatch<"actionOne">(type: "actionOne"): Promise<number>
```

**我们很容易为上面的 `simpleActions` 编写出其对应的 `dispatch` 函数，并具备完整推导，但针对下面这种深层次的actions，如何为其编写dispatch函数？**

```ts
const actions = {
  someAction(payload: number) {
    return payload
  },
  deeperActions: {
    anotherAction() {
      // do something
      return 'result'
    },
    otherActions: {
      finalAction(payload: string) {
        return !payload
      }
    }
  }
}

type Actions = typeof actions

// 编写一个 dispatch 方法，使得：
// let result = dispatch('deeperActions.anotherAction') // 返回类型为： Promise<string>
// let final = dispatch('deeperActions.otherActions.finalAction', 'hello world') // 返回类型为：Promise<boolean>
```

在typescript发布4.1之前，这几乎是不可能完成的任务，但是4.1的发布使我们能够对这一部分的缺失做一些类型补全。

接下来我们围绕上面两个问题分别进行实现。

## getValueByPath使用TS实现

需要使 `getValueByPath({ a: { b: { c: 1 } } }, 'a.b')` 获得完整的推导，我们首先需要能拿到两个参数的完整类型，这在ts中是十分容易的。第二步则是对两个参数的类型做映射处理，最好使得第一个参数输入完成之后，第二个参数直接能具备完整推导。

### 单层推导

我们可以先尝试着实现对单层对象取值的类型推导：

首先能得到一个大致的函数结构，接受两个参数，返回一个值

```ts
declare function getValueByPath(object: Record<any, any>, prop: string): any
```

上面这种写法是拿不到参数类型的，为了能正确拿到参数的类型，我们使用范型来填充参数 `object`：

```ts
declare function getValueByPath<T extends Record<any, any>>(object: T, prop: string): any
```

可以直接在编辑器上面尝试一下(我使用的是vscode)，很明显可以看到，我们正确的拿到了第一个参数的类型：

![xx](https://dpubstatic.udache.com/static/dpubimg/5a1f9aef-c5ff-4109-980a-85216b62e291.png)

能取到参数的类型对象，就能使用关键字 `keyof` 获取对象的每一个key，接下来我们把候选key值限定给参数prop，然后把对应的返回值结果填充到函数的结果当中，这里我们引入第二个范型 `K`。尝试调用之后，我们发现结果都符合预期。

```ts
declare function getValueByPath<T extends Record<any, any>, K extends keyof T>(object: T, prop: K): T[K]

let a = getValueByPath({a: 1, b: '2'}, 'a') // number
let b = getValueByPath({a: 1, b: '2'}, 'b') // string
let c = getValueByPath({a: 1, b: '2'}, 'c') // Argument of type '"c"' is not assignable to parameter of type '"a" | "b"'.ts(2345)
```

### 多层推导

仅仅是单层推导的结构依然是无法满足我们对于 `getValueByPath({ a: { b: { c: 1 } } }, 'a.b')` 推导的需求：

```ts
let a = getValueByPath({ a: { b: { c: 1 } } }, 'a.b') 
// Argument of type '"a.b"' is not assignable to parameter of type '"a"'.ts(2345)
```

可以看到，第二个候选参数的类型仅有 `"a"`，而我们按正常期望来讲，`getValueByPath`的第一个参数传入 `{ a: { b: { c: 1 } } }` 之后，第二个候选参数类型应该为： `"a" | "a.b" | "a.b.c"` 。

接下来我们使用4.1的新特性，将对象： `{ a: { b: { c: 1 } } }` 与其链式key： `"a" | "a.b" | "a.b.c"` 一一对应起来。

工欲善其事，必先利其器。我们先封装好两个工具函数：

```ts
// 取出对象的所有除了 symbol 以外的key
type StringKeyof<T> = Exclude<keyof T, symbol>

// 将字符串用 . 进行拼接
type CombineStringKey<H extends string | number, L extends string | number> = H extends '' ? `${L}` : `${H}.${L}`
```

我们知道，`symbol` 类型是没办法放在**模板字符串**中的，所以对key进行拼接之前，需要过滤掉所有 `symbol` 类型的key。而 `StringKeyof` 函数，就是用来过滤对象中所有不符合**模板字符串**类型的key的方法。其实际用法与 `keyof` 相同，只是返回值能用于**模板字符串**。

`CombineStringKey` 则是对两个key进行拼接，拼接的结果自然就是我们需要的链式key格式。

调用例子：

```ts
const symbol1 = Symbol()

type A = {
  1: string
  a: string
  [symbol1]: string
}

type K = StringKeyof<A> // 1 | 'a'

type B = CombineStringKey<'', 'a'>         // "a"
type C = CombineStringKey<B, 'b'>          // "a.b"
type D = CombineStringKey<C, 'c1' | 'c2'>  // "a.b.c1" | "a.b.c2"
type E = CombineStringKey<D, 'd'>          // "a.b.c1.d" | "a.b.c2.d"
```

我们现在以下面这个对象类型为例，取出该对象所有符合要求的链式key：

```ts
type deepObj = {
  a: number;
  b: {
    c: string;
    d: number;
    e: {
      f: number;
      g: boolean;
    };
  };
}
```

思路：遍历对象的所有key，同时对key对应的值进行判断，如果是一个更深层次的对象，则保留外层的key，对更深层对象递归处理，把后续递归出的key都和上一层中保留的key进行拼接。

```ts
type ChainKeys<T, P extends string | number = ''> = {
  [K in StringKeyof<T>]: T[K] extends Record<any, any> ? ChainKeys<T[K], CombineStringKey<P, K>> : {
    [_ in CombineStringKey<P, K>]:T[K]
  }
}[StringKeyof<T>]
```

我们将 `ChainKeys` 函数拆开来看，首先是它的参数，接受两个类型参数，第一个是类型T，第二个则是用于拼接的**前缀字符串**，其值可选。我们使用 `in` 语法遍历 `T` 的所有 key 值，也就是 `[K in StringKeyof<T>]`，这里我们使用了前面封装好的方法 `StringKeyof` 来代替 `keyof` 关键字。对对应的 key 的值，也就是 `T[K]`，我们使用 `extends` 进行前置判断，如果 `T[K]` 是一个**复杂类型**，我们则将当前的字符串前缀 `P` 和当前的 `K` 进行拼接，递归调用 `ChainKeys` 函数进行处理。如果 `T[K]` 为**基本类型**，我们直接使用 `Record` 方法组装拼接好的key（`CombineStringKey<P, K>`）和value（`T[K]`），为了方便在编辑器里面查看结果，这里将`Record<CombineStringKey<P, K>, T[K]>` 替换为 `{ [_ in CombineStringKey<P, K>]:T[K] }`。最后将所有结果打平成联合类型，也就是最后的一个取值操作：`{...}[StringKeyof<T>]`，这和 `[1,2,3][number] // 3 | 1 | 2` 的处理方式一致。

接下来我们在编辑器中查看一下调用结果：

![img](https://dpubstatic.udache.com/static/dpubimg/36f16bdc-4754-4387-bdac-bf3710a3ea56.png)

如红框中所示，发现链式key已经和其类型一一对应起来了。

但是这还有一些问题：

一、`"b"` 以及 `"b.e"` 没有出现在枚举当中。

二、返回结果是一个**联合类型**，如何把这个结果运用到函数当中呢？

第一个问题其实很好解决，当我们在递归处理的同时，将当前的链式key与对应值也进行处理就可以，即：

```ts
type ChainKeys<T, P extends string | number = ''> = {
  [K in StringKeyof<T>]: T[K] extends Record<any, any>
    ? Record<CombineStringKey<P, K>, T[K]> & ChainKeys<T[K], CombineStringKey<P, K>> 
    : {
      [_ in CombineStringKey<P, K>]:T[K]
    }
}[StringKeyof<T>]
```

同样为了方便编辑器中查看结果我们把 `Record<CombineStringKey<P, K>, T[K]>` 替换成 `{ [_ in CombineStringKey<P, K>]:T[K] }`：

![img](https://dpubstatic.udache.com/static/dpubimg/d0bb4b70-f355-4d41-8430-031ac4a44136.png)

可以看到 `b` 以及 `"b.e"` 这样的key都被取出来并放到了结果当中。其实这里还是有一些问题，如果你实际去代码编辑器里面查看结果的话，会发现有很多重复的 `b` ，这是因为后续使用交叉类型进行拼接的 `ChainKeys` 的返回值是一个联合类型，如此一来，`b` 会被分配到联合类型的**每一项**上，在后面我们会解决这个问题。

第二个问题是结果为联合类型，我们如何才能将其运用至函数当中呢？

大家都知道，对联合类型使用 `keyof` 操作，返回的类型为 `never`，即无法取出联合类型的所有key值：

```ts
type T = { a: number } | { b: string }
type K = keyof T // never
// 如何使K的类型为 a ｜ b 呢？
```

这里我们引入另一个工具函数：`UnionToIntersection`，顾名思义，该函数的作用就是将联合类型转换为交叉类型，至于**为什么**它能将联合类型转换为交叉类型，我们后面会讲：

```ts
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;
```

我们将其运用到ChainKeys的推导当中去：

```ts
type ChainKeys<T, P extends string | number = ''> = UnionToIntersection<{
  [K in StringKeyof<T>]: T[K] extends Record<any, any>
    ? Record<CombineStringKey<P, K>, T[K]> & ChainKeys<T[K], CombineStringKey<P, K>> 
    : {
      [_ in CombineStringKey<P, K>]:T[K]
    }
}[StringKeyof<T>]>
```

再经过一些润色得到一个比较精简的函数：

```ts
type ChainKeys<T, P extends string | number = ''> = UnionToIntersection<{
  [K in StringKeyof<T>]: Record<CombineStringKey<P, K>, T[K]> & (T[K] extends Record<any, any> ? ChainKeys<T[K], CombineStringKey<P, K>> : {})
}[StringKeyof<T>]>
```

尝试调用该方法最终得到的结果为：

![img](https://dpubstatic.udache.com/static/dpubimg/f7b952df-6668-434e-b26c-e43345a0f4b4.png)

最终，我们以此为基础，编写 `getValueByPath` 函数的定义：

```ts
declare function getValueByPath<T extends Record<any, any>, K extends keyof ChainKeys<T>>(object: T, prop: K): ChainKeys<T>[K]

let a = getValueByPath({ a: { b: { c: 1 } } }, 'a')     // { b: { c: number } }
let b = getValueByPath({ a: { b: { c: 1 } } }, 'a.b')   // { c: number }
let c = getValueByPath({ a: { b: { c: 1 } } }, 'a.b.c') // number
```

到此，我们算是完成了 `getValueByPath` 函数的类型定义以及推导。

## 深层次Actions的dispatch函数TS实现

其实在推导 `getValueByPath` 的过程中，我们已经基本上完成了所有实现该 `dispatch` 所需要的条件，与 `getValueByPath` 不同的是，我们只需要遍历出函数所对应的链式key即可，改写一下 `ChainKeys` 方法：

```ts
interface DeeperActions {
  [k: string]: ((...args: any[]) => any) | DeeperActions
}
type ActionChainKeys<T, P extends string | number = ''> = UnionToIntersection<{
  [K in StringKeyof<T>]: T[K] extends DeeperActions
    ? ActionChainKeys<T[K], CombineStringKey<P, K>>
    : Record<CombineStringKey<P, K>, T[K]>
}[StringKeyof<T>]>
```

我们除去了对对象的混入，同时将判断类型改为了 `DeeperActions` ，以此来判断该 `action` 对象是否有更深层次的actions。

调用结果：

![img](https://dpubstatic.udache.com/static/dpubimg/812f50b2-a148-4065-9f87-a9b010502c6d.png)

再看我们最开始提出的问题：

> 编写一个 dispatch 方法，使得：
> `let result = dispatch('deeperActions.anotherAction') // 返回类型为： Promise<string>`
> `let final = dispatch('deeperActions.otherActions.finalAction', 'hello world') // 返回类型为：Promise<boolean>`

我们开始定义 `dispatch` 方法：

```ts
declare function dispatch<K extends keyof ChainingActions>(key: K, ...args: Parameters<ChainingActions[K]>): ReturnType<ChainingActions[K]>
```

这里我们分别使用了 `Parameters` 和 `ReturnType` 函数来获取对应 `action` 的参数以及返回值，用来填充至 `dispatch` 方法中，实际编写调用代码：

![](https://dpubstatic.udache.com/static/dpubimg/c6165376-d374-4ede-9bd2-0c99ca336337.png)

![](https://dpubstatic.udache.com/static/dpubimg/9447cd1a-04b6-4972-80a1-13f28de2b0cc.png)

考虑到我们的 `actions` 无论如何都会返回一个 `Promise`，上述定义其实还是稍微有一些问题，但是改动起来也很方便，只需要在 `ReturnType` 外层使用 `Promise` 包装一下就可以了：

```ts
type Promisify<T> = T extends Promise<any> ? T : Promise<T>

declare function dispatch<K extends keyof ChainingActions>(key: K, ...args: Parameters<ChainingActions[K]>): Promisify<ReturnType<ChainingActions[K]>>

let result = dispatch('deeperActions.anotherAction') // Promise<string>
let final = dispatch('deeperActions.otherActions.finalAction', 'hello world') // Promise<boolean>
```

至此，我们 `dispatch` 的TS实现也已经完成。

最终结果：

![](http://cdn.qiniu.archerk.com.cn/QQ20210128-162139-HD.gif)

## 结尾

其实 `getValueByPath` 这一部分的内容是有一些缺陷的，因为TS本身**限制了递归的次数**，当数据层级达到一定程度时，上文的推导会失效。在Mpx的建设中我们还对此做了一些优化，尽可能的**减少**了递归次数。

这里也给出**另一个方案**做链式key推导，这种方式**性能**上会好很多，因为不用解析出所有的链式key，而是根据链式key**反向解析**前面的对象，因此该方案可以解析出正确的类型，但是会丧失一部分代码提示：

```ts
type CutChainKeys<T extends string> = T extends `${infer A}.${infer B}` ? [A, B] : [T, never]

type GetValueByPath<T extends Record<string, any>, K extends string> = CutChainKeys<K> extends [string, never]
  ? T[CutChainKeys<K>[0]]
  : GetValueByPath<T[CutChainKeys<K>[0]], CutChainKeys<K>[1]>

declare function test<T extends Record<any, any>, K extends string>(o: T, k: K): GetValueByPath<T, K>

let s = test({
  a: {
    b: 1,
    c: {
      d: {
        e: {
          f: 'f'
        }
      }
    }
  }
}, 'a.c.d.e.f') // string
```

通过这一系列的处理，我们基本完成了 `mpx-store` 的类型推导，包括对应的**辅助函数**等。这也使得我们能够在项目中更好的使用TS进行开发。在最新的滴滴出行小程序更新中，我们已经开始使用TS全量进行开发，目前看来开发体验还不错，后期也会逐步将旧的代码重构为TS。我们后续也会持续维护和迭代框架，也欢迎有兴趣的朋友来一起[共建](https://github.com/didi/mpx)。

有写的不好的地方请多包含，也欢迎大家批评指正。


## 题外话：UnionToIntersection

上面提到的，我们使用工具函数 `UnionToIntersection` 将联合类型转换为交叉类型。而 `UnionToIntersection` 又是如何将**联合类型转换为交叉类型**的呢？

在 [Conditional Types](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html) 中有提到一些点：

### Distributive conditional types

> Conditional types in which the checked type is a naked type parameter are called distributive conditional types. Distributive conditional types are automatically distributed over union types during instantiation. For example, an instantiation of `T extends U ? X : Y` with the type argument `A | B | C` for `T` is resolved as `(A extends U ? X : Y) | (B extends U ? X : Y) | (C extends U ? X : Y)`.

即在**执行** `extends` **语句时**，如果 `extends` 左侧为**联合类型**，则会被分配成**对应数量个**子条件判断语句，最终**联合**每个子语句的结果。

```ts
type A = 1 | '2' | 3

type IsNumber<T> = T extends number ? T : never

type B = IsNumber<A> // 1 | 3
```

### Type inference in conditional types

> Within the `extends` clause of a conditional type, it is now possible to have `infer` declarations that introduce a type variable to be inferred. Such inferred type variables may be referenced in the true branch of the conditional type. It is possible to have multiple `infer` locations for the same type variable.

在条件判断语句中，可以使用 `infer` 关键字做类型推断，同一个候选值能有**多个**推断位置。

```ts
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;
```

**正位推断**的结果会被推导为**联合**类型：

```ts
type Foo<T> = T extends { a: infer U; b: infer U } ? U : never;
type T10 = Foo<{ a: string; b: string }>; // string
type T11 = Foo<{ a: string; b: number }>; // string | number
```

**逆变位置推断**的结果会被处理成**交叉**类型：

```ts
type Bar<T> = T extends { a: (x: infer U) => void; b: (x: infer U) => void }
  ? U
  : never;
type T20 = Bar<{ a: (x: string) => void; b: (x: string) => void }>; // string
type T21 = Bar<{ a: (x: string) => void; b: (x: number) => void }>; // string & number
```

**注意**：这里是`ts-2.8`发布时的文档以及例子，现在来说是不存在 `string & number` 类型的，如果实际编写这段代码的话会发现 `T21` 的值为 `never`，因为不可能存在一个值既为 `string` 又为 `number`。逆变与协变的一些概念可以参考一下[逆变与协变](https://zh.wikipedia.org/wiki/%E5%8D%8F%E5%8F%98%E4%B8%8E%E9%80%86%E5%8F%98)。

### UnionToIntersection 原理探究

有了以上两个信息之后，我们再来看看 `UnionToIntersection` 的实现，为了方便阅读我们做一些折行：

```ts
type UnionToIntersection<U> = (
    U extends any 
      ? (k: U) => void
      : never
  ) extends ((k: infer I) => void) 
    ? I
    : never;
```

发现实际上 `UnionToIntersection` 分为两步：

1、将联合类型的**每一项**填充至 函数类型 `(k: U) => void` 的参数 `k` 中。

2、使用 `infer` 关键字在**逆变位**对 `(k: U) => void` 做推导，将参数的类型推入结果 `I` 中，组成**交叉**类型。

拆分看实现：

```ts
// 联合类型推入函数参数
type UnionToFunction<U> = U extends any ? (k: U) => void : never
// 对函数逆变推导，将参数推导为交叉类型
type FunctionsToIntersection<F> = [F] extends [(k: infer I) => void] ? I : never

type Union = { a: number } | { b: string }

type Fun = UnionToFunction<Union> // ((k: { a: number }) => void) | ((k: { b: string }) => void)

type Intersection = FunctionsToIntersection<Fun> // { a: number } & { b: string }
```

可以注意到我们拆分开来了 `UnionToIntersection` 后并不是完全按照原有写法去写的，在 `FunctionsToIntersection` 函数中，我们使用了`[]`将类型给包裹起来，这是为了**避免**第一个特性（Distributive conditional types）的影响，如果不做包裹，则 `extends` 左侧为联合类型，被分配成若干个子句后，同一位置的 `infer` 就会被分别执行，无法合成为交叉类型。而使用`[]`进行包裹之后则避免了这个影响，`extends` 左侧不再是一个联合类型，而是一个数组类型。

## 参考资料汇总

* [Template Literal Types](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html)
* [Conditional Types](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html)
* [逆变与协变 Covariance and contravariance](https://zh.wikipedia.org/wiki/%E5%8D%8F%E5%8F%98%E4%B8%8E%E9%80%86%E5%8F%98)
* [TS递归上限](https://github.com/microsoft/TypeScript/issues/30188)
* [Mpx中的实现（前期）](https://github.com/didi/mpx/pull/631)








