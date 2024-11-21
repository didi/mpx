# 依赖注入（Provide/Inject）

## 适用场景

通常情况下，从父组件向子组件传递数据时，我们会使用 props 向下传递。如果在一颗组件层级嵌套很深的组件树中，某个深层的子组件依赖一个较远的祖先组件中的部分数据。在这种情况下，如果仅使用 props 则必须将其沿着组件链路逐级传递下去，这就是 **props 逐级透传**（props drilling）问题。

使用 `provide` 和 `inject` 可以帮助我们解决这一麻烦问题：一个父组件相对于其所有的后代组件，会作为**依赖提供者**。任何后代的组件树，无论层级有多深，都可以**注入**由父组件提供给整条链路的依赖。

![组件间 provide-inject 示意图](https://s3-gz01.didistatic.com/packages-mait/img/bLipGWmlcm1732166788438.png)

## Provide 提供

### 组合式语法

在组合式语法中，需要使用到 `provide()` 函数，`provide()` 函数接收两个参数：

1. 第一个参数被称为**注入名**，是一个字符串，后代组件会用注入名来查找期望注入的值。一个组件可以多次调用 `provide()`，使用不同的注入名，注入不同的依赖值。
2. 第二个参数是提供的**值**，值可以是任意类型，包括响应式的状态，比如一个 `ref`、`reactive` 或者 `computed` 计算值。

```ts
<script setup>
import { computed, provide, ref } from '@mpxjs/core'

// 静态数据
provide(/* 注入名 */ 'message', /* 值 */ 'hello!')

// 响应式数据
const count = ref(1)
const double = computed(() => count.value * 2)
provide('count', count)
provide('double', double)

</script>
```

### 选项式语法

如果是在选项式语法的 setup() 中，用法和上述组合式语法一致。另外针对选项式语法，我们也提供了 provide 选项，它是**一个对象或返回一个对象的函数**。

对于 provide 对象上的每一个属性，后代组件会用其 key 为注入名查找期望注入的值，属性的值就是要提供的数据。

如果我们需要提供依赖当前组件实例的状态 (比如在 `data` 属性中定义的数据)，那么可以通过函数形式使用 provide 提供。需要注意的是，这**不会**使注入保持响应性，如果需要保证注入方和供给方之间的响应性链接，我们需要使用 `computed()` 函数提供一个计算属性。

```ts{17}
<script>
import { createComponent, computed } from '@mpxjs/core'

createComponent({
  data: {
    count: 1,
  },
  // 1. 静态数据可以选择直接使用对象形式
  provide: {
    message: 'hello'
  },
  // 2. 选择使用函数的形式，可以访问到 `this`
  provide() {
    return {
      count: this.count
      // 显式提供一个计算属性
      message: computed(() => this.count * 2)
    }
  }
})
</script>
```

### 应用级顶层 provide

前面介绍的是在一个组件中提供依赖，我们还可以在整个应用层面提供依赖，这样整个应用中所有组件都可以使用。

```ts
import { createApp } from '@mpxjs/core'

createApp({
  // 应用层 provide
  provide() {
    return {
      'appMessage': 'provide from App scope!'
    }
  }
})
```

## Inject 注入

### 组合式语法

`inject()` 函数最多接收三个参数：

- 第一个参数必填，表示**注入名**，字符串类型。
- 第二个参数可选，表示**默认值**。
  - 如果在注入一个值时不确定是否有提供者，那么应该声明一个默认值。如果既没有提供者也没有默认值，则会抛出一个运行时警告。
- 第三个参数可选，表示**是否将默认值视为工厂函数**，布尔类型。
  - 某些场景下，默认值可能需要通过调用一个函数或初始化一个类来生成，或者某些非基础类型数据创建开销比较大，请使用工厂函数来创建默认值。

```ts
<script setup>
import { inject } from '@mpxjs/core'

// 注入 message 依赖
const value = inject('message')
// 创建默认值
const value = inject('message', 'default value')
// 使用工厂函数创建默认值
const value = inject('key', () => new ExpensiveClass(), true)
</script>
```

### 选项式语法

选项式语法的 setup() 中，用法和组合式 API 一致。另外针对选项式语法，`inject` 选项支持**数组**和**对象**两种形式：

1. **数组**形式使用。数组中的每一项对应一个注入名，注入的属性会以同名的 key 暴露到组件实例上。如下示例中，注入名 `"message"` 在注入后以 `this.message` 的形式暴露。另外，`inject` 会在组件自身的状态**之前**被解析，意味着你可以在 `data()` 中访问到注入的属性。

```ts{6}
<script>
import { createComponent } from '@mpxjs/core'

createComponent({
  // 数组形式使用 `inject` 选项
  inject: ['message', 'count'],
  data() {
    return {
      // 可以在 `data()` 中访问到注入的属性
      fullMessage: this.message,
      fullCount: this.count
    }
  }
})
</script>
```

2. **对象**形式使用。相比数组形式，对象形式支持注入**别名**和**默认值**。如下示例，通过 `from` 属性指定注入来源名，通过 `default` 属性指定默认值。

```ts
<script>
import { createComponent } from '@mpxjs/core'

createComponent({
  inject: {
    message: {
      from: 'message',         // 当与原注入名同名时，这个属性是可选的
      default: 'default value' // 默认值
    },
    user: {
      default: () => ({ name: 'John' }) // 使用工厂函数创建默认值
    }
  }
})
</script>
```

## 避免注入名潜在冲突

如果你正在构建大型的应用，包含非常多的依赖提供，那么随处定义的注入名可能存在潜在的冲突。在 Mpx 实现中，同名的注入名会覆盖前面已有的注入名对应的提供值。

针对大型应用的最佳实践，我们通常推荐在一个单独的文件中导出这些注入名，可以结合不同业务范围来统一注入名的命名和管理规范。以下示例仅提供几种命名规范的参考，具体命名管理请结合实际业务场景来确定。

```ts
// 创建公用的命名管理文件

// 1. 使用枚举类型
export const InjectionKeys = {
  user: 'user',
  auth: 'auth',
  product: 'product',
};

// 2. 按业务模块功能划分命名，不容易命名冲突，可读性高
export const InjectionKeys = {
  user: {
    service: 'user:service',
    store: 'user:store',
  },
  auth: {
    service: 'auth:service',
    token: 'auth:token',
  },
  product: {
    list: 'product:list',
    details: 'product:details',
  },
};

// 3. 使用 Symbol 类型
export const InjectionKeys = {
  user: Symbol('user'),
  auth: Symbol('auth'),
  product: Symbol('product'),
};

// 4. 自行实现类似 Symbol polyfill 的命名生成函数
export const createInjectionKey = (module: string, key: string) => `${module}:${key}`
export const InjectionKeys = {
  user: createInjectionKey('user', 'service'),
  auth: createInjectionKey('auth', 'token'),
  product: createInjectionKey('product', 'list'),
};

```

## TS 类型支持

直接使用字符串注入 key 时，注入值的类型默认推导会是 unknown，需要通过泛型参数显式声明。因为无法保证运行时一定存在这个 provide，所以推导类型仍然可能是 undefined。当提供了一个默认值后，这个 undefined 类型就可以成功被移除。

```ts
<script setup lang="ts">
import { inject } from '@mpxjs/core'

const foo = inject('foo') // 类型：undefined
const foo = inject<string>('foo') // 类型：string | undefined
const foo = inject<string>('foo', 'default value') // 类型：string ✅
</script>
```

当然，如果你已经确定注入名肯定被提供了，也可以强制断言。

```ts
const foo = inject('foo') as string
```

直接使用字符串作为注入名容易产生潜在的同名冲突，更推荐使用统一管理的变量 key 来作为注入名。我们提供了 `InjectionKey` 泛型接口，使用它包装注入名类型后，可以用来在不同组件之间同步注入值的类型：

```ts{4}
<script setup lang="ts">
import { provide, inject } from '@mpxjs/core'
import type { InjectionKey } from '@mpxjs/core'

const key = Symbol() as InjectionKey<string>

provide(key, 'foo') // 若提供的是非字符串值会导致错误

const foo = inject(key) // ✅ foo 的类型：string | undefined
const foo = inject(key, 'default value') // ✅ foo 的类型：string
const foo = inject(key, 1) // ❌ TS 类型报错：Argument of type 'number' is not assignable to parameter of type 'string'.
</script>
```

建议将注入 key 的类型放在一个单独的文件中，这样它就可以被多个组件导入。

## 跨端差异

- Mpx 输出 Web 端后，使用规则与 Vue 对齐，provide/inject 的生效范围严格遵行父子组件关系，只有父组件可以成功向子孙组件 provide。
- Mpx 输出小程序端会略微不同，由于小程序原生框架限制，无法在子组件获取真实渲染时的父组件引用关系，所以不能像 Vue 那样基于父组件原型继承来实现。在 Mpx 底层实现中，我们将组件层的 provide 挂载在所属页面实例上，相当于将组件 scope 提升到页面 scope，可以理解成一种“降级模拟”。当然，这并不影响父组件向子孙组件 provide 的能力，只是会额外存在“**副作用**”：同一页面中的组件可以向页面中其他所有在其之后渲染子组件提供依赖。比如同一页面下的组件 A 可以向后渲染的兄弟组件 B 的子孙组件提供数据，这在 Web 端是不允许的。因此，针对小程序端可能出现的“副作用”需要开发者自行保证，可以结合上述注入名的管理优化来规避。