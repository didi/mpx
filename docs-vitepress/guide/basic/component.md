# 自定义组件

在 Mpx 中也可以使用类似 Vue 中的单文件自定义组件，我们可以在每个组件内封装自定义内容和逻辑。

在 Mpx 中自定义组件，语法默认以微信小程序为基准，与此同时，Mpx 额外提供的数据响应和模版增强语法等一系列增强能力都可以在自定义组件中使用。

> 作为参考，原生小程序自定义组件的规范详情查看[这里](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Component.html)，但在 Mpx 中自定义组件所支持的属性和功能还需以当前文档为准。

## 创建与使用

使用 [createComponent](/api/global-api.html#createcomponent) 方法创建自定义组件，在父组件/页面中通过 `usingComponents` 注册使用。

```html
<!--组件 components/list.mpx-->
<template>
  <view>组件名称: {{ name }}</view>
</template>
<script>
  import { createComponent } from "@mpxjs/core";
  createComponent({
    data: {
      name: "list",
    },
  });
</script>

<!--页面 index.mpx-->
<template>
  <view>
    <list></list>
  </view>
</template>
<script>
  import { createPage } from "@mpxjs/core";
  createPage({});
</script>
<script type="application/json">
  {
    "usingComponents": {
      "list": "components/list"
    }
  }
</script>
```

## 组件模板

组件模板的写法与页面模板相同，具体可参考[模版语法](./template.md)。组件模板与组件数据结合后生成的节点树，将被插入到组件的引用位置上。

### 组件模板的 slot

在组件模板中可以包含 slot 节点，用于承载组件使用者提供的模板结构。

默认情况下，一个组件模板中只能有一个 slot 。需要使用多 slot 时，可以在组件 js 中声明启用。

此时，可以在这个组件模板中使用多个 slot ，以不同的 name 来区分。

使用时，用 slot 属性来将节点插入到不同的 slot 上。

```html
<!-- 组件模板 -->
<!-- components/mySlot.mpx -->
<template>
  <view>
    <view>这是组件模板</view>
    <slot name="slot1"></slot>
    <slot name="slot2"></slot>
  </view>
  <template>
    <script>
      import { createComponent } from "@mpxjs/core";

      createComponent({
        options: {
          multipleSlots: true, // 启用多slot支持
        },
      });
    </script></template
  ></template
>
```

> 注意：使用多个 slot 时，需要在组件选项中开启 `multipleSlots: true`。

使用组件时：

```html
<!-- index.mpx -->
<template>
  <view>
    <my-slot>
      <view slot="slot1">我是slot1中的内容</view>
      <view slot="slot2">我是slot2中的内容</view>
    </my-slot>
  </view>
</template>

<script type="application/json">
  {
    "usingComponents": {
      "my-slot": "components/mySlot"
    }
  }
</script>
```

更多关于插槽的使用细节可查看[微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/wxml-wxss.html)。

### 动态组件

Mpx 中提供了使用方法类似于 Vue 的动态组件能力，这是一个基于 wx:if 实现的语法。通过对 `is` 属性进行动态绑定，可以实现在同一个挂载点切换多个组件，前提需要动态切换的组件已经在全局或者组件中完成注册。

使用示例如下：

```html
<view>
  <!-- current为组件名称字符串，可选范围为局部注册的自定义组件和全局注册的自定义组件 -->
  <!-- 当 `current`改变时，组件也会跟着切换  -->
  <component is="{{current}}"></component>
</view>

<script>
  import { createComponent } from "@mpxjs/core";
  createComponent({
    data: {
      current: "test",
    },
    ready() {
      setTimeout(() => {
        this.current = "list";
      }, 3000);
    },
  });
</script>

<script type="application/json">
  {
    "usingComponents": {
      "list": "../components/list",
      "test": "../components/test"
    }
  }
</script>
```

## 组件样式

组件对应 wxss 文件的样式，只对组件模板内的节点生效。编写组件样式时，需要注意以下几点：

- 组件和引用组件的页面不能使用 id 选择器（#a）、属性选择器（[a]）和标签名选择器，请改用 class 选择器。
- 组件和引用组件的页面中使用后代选择器（.a .b）在一些极端情况下会有非预期的表现，如遇，请避免使用。
- 子元素选择器（.a>.b）只能用于 view 组件与其子节点之间，用于其他组件可能导致非预期的情况。
- 继承样式，如 font 、 color ，会从组件外继承到组件内。
- 除继承样式外， app.wxss 中的样式、组件所在页面的的样式对自定义组件无效（除非更改组件样式隔离选项）。

```css
#a {
} /* 在组件中不能使用 */
[a] {
} /* 在组件中不能使用 */
button {
} /* 在组件中不能使用 */
.a > .b {
} /* 除非 .a 是 view 组件节点，否则不推荐使用 */
```

除此以外，组件可以指定它所在节点的默认样式，使用 :host 选择器。

```css
/* 组件 custom-component.wxss */
:host {
  color: yellow;
}
```

### 外部样式类

有时，组件希望接受外部传入的样式类。此时可以在 Component 中用 externalClasses 定义段定义若干个外部样式类。

这个特性可以用于实现类似于 view 组件的 hover-class 属性：页面可以提供一个样式类，赋予组件的 hover-class ，这个样式类本身定义在页面中而非组件中。

```ts
interface ComponentOptions {
  externalClasses?: string[];
}
```

externalClasses 支持以下功能：

- 定义多个外部样式类
- 在组件 template 中使用外部样式类，同时支持在同一个节点上使用多个外部样式类

```html
<template>
  <!-- 组件 custom-component.mpx -->
  <view class="my-class"> 外部传入的样式类 </view>
  <view class="other-class"> 另一个外部传入的样式类 </view>
</template>
<script>
  // 组件 custom-component.js
  import { createComponent } from "@mpxjs/core";

  createComponent({
    externalClasses: ["my-class", "other-class"],

    options: {
      styleIsolation: "isolated",
    },
  });
</script>
```

使用组件：

```html
<!-- 页面 page.mpx -->
<!-- 单个样式类 -->
<custom-component my-class="red-text" />

<!-- 多个样式类（需要基础库 2.7.1 以上） -->
<custom-component my-class="red-text large-text" />

<!-- 动态样式类 -->
<custom-component my-class="{{isActive ? 'active' : ''}}" />
```

```css
/* 页面 page style */
.red-text {
  color: red;
}

.large-text {
  font-size: 20px;
}

.active {
  background: #f0f0f0;
}
```

关于 externalclasses 的更多描述也可以查看[微信小程序-外部样式类](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/wxml-wxss.html#%E5%A4%96%E9%83%A8%E6%A0%B7%E5%BC%8F%E7%B1%BB)

> **注意：**
>
> - 该功能默认在微信小程序可用，在跨平台输出时，需要在 @mpxjs/webpack-plugin 中配置相关的 externalClasses, 否则跨平台时该能力不生效，具体配置请[查看](https://mpxjs.cn/api/compile.html#externalclasses)。

## 组件构造

下面详细介绍 `createComponent` 所支持的构造选项。

### properties

用于声明组件接收的外部属性。属性的类型可以为 String、Number、Boolean、Object、Array 其一，也可以为 null 表示不限制类型。

```ts
type PropType =
  | StringConstructor // String
  | NumberConstructor // Number
  | BooleanConstructor // Boolean
  | ObjectConstructor // Object
  | ArrayConstructor // Array;
  | null; // null

interface ComponentOptions {
  properties?: {
    [key: string]: PropOptions | PropType;
  };
}

interface PropOptions {
  type: PropType; // type 为必填项
  value?: any;
  optionalTypes?: PropType[]; // 属性的类型（可以指定多个）
  observer?: string | ((newVal: any, oldVal: any) => void);
}
```

properties 定义包含以下选项：

- **`type`**: 必填，属性的类型
- **`optionalTypes`**: 可选，属性的类型（可以指定多个）
- **`value`**: 可选，属性的初始值
- **`observer`**: 可选，属性值变化时的回调函数

> **注意：**
>
> 1. 属性名应避免以 data 开头，例如 data-xyz="" 会被作为节点 dataset 来处理
> 2. 在组件定义和使用时，属性名和 data 字段相互间都不能冲突

```js
createComponent({
  properties: {
    // 基础类型
    propA: {
      type: String,
      value: "",
    },
    // 简化的定义方式
    propB: Number,
    // 多种类型
    propC: {
      type: Number,
      optionalTypes: [String, Object],
      value: 0,
    },
    // 带有属性值变化回调
    propE: {
      type: Object,
      observer(newVal, oldVal) {
        console.log("propE changed:", newVal, oldVal);
      },
    },
  },
});
```

**参考**：[微信小程序 properties 定义](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Component.html#properties-%E5%AE%9A%E4%B9%89)

### data

组件的内部数据，和 properties 一同用于组件的模板渲染。

```ts
interface ComponentOptions {
  data?: object | (() => object);
}
```

data 可以是一个函数返回一个普通 JavaScript 对象，也可以是一个普通 JavaScript 对象。

在 Mpx 中，组件实例会代理 data 对象的所有属性并进行响应式处理，因此可以直接通过 `this.dataName` 访问这些数据, 同时修改这些数据也会触发视图更新。

```html
<template>
  <view>{{ count }}</view>
  <view>{{ message }}</view>
  <view>{{ userInfo.name }}</view>
</template>

<script>
  import { createComponent } from "@mpxjs/core";

  createComponent({
    data: {
      count: 0,
      message: "Hello",
      userInfo: {
        name: "John",
        age: 20,
      },
    },
    methods: {
      addCount() {
        this.count++;
      },
    },
  });
</script>
```

### computed

用于声明基于现有数据的计算属性。

```ts
type ComputedGetter<T> = () => T;
type ComputedSetter<T> = (value: T) => void;

interface WritableComputedOptions<T> {
  get: ComputedGetter<T>;
  set: ComputedSetter<T>;
}

// 计算属性可以是函数或对象
type ComputedOption<T> = ComputedGetter<T> | WritableComputedOptions<T>;

// 组件选项的接口
interface ComponentOptions {
  computed?: {
    [K: string]: ComputedOption<any>;
  };
}
```

该选项接收一个对象，其中键是计算属性的名称，值是一个计算属性 getter，或一个具有 get 和 set 方法的对象 (用于声明可写的计算属性)。

所有的 getters 和 setters 会将它们的 this 上下文自动绑定为组件实例。

computed 选项用于声明依赖于其他数据的计算属性。计算属性的结果会被缓存，只有在依赖发生变化时才会重新计算。

```js
import { createComponent } from "@mpxjs/core";
createComponent({
  data() {
    return {
      price: 100,
      quantity: 2,
    };
  },
  computed: {
    // 只读计算属性
    total() {
      return this.price * this.quantity;
    },
    // 可读写计算属性
    discount: {
      get() {
        return this.price * 0.9;
      },
      set(value) {
        this.price = value / 0.9;
      },
    },
  },
});
```

> 注意
>
> - 选项式 API 中 computed 尽量不要使用箭头函数，否则无法访问组件实例 this

### watch

用于对响应性数据变化调用的侦听回调。

```ts
// flush 选项的可选值类型
type FlushMode = "sync" | "post" | "pre";

interface ComponentOptions {
  watch?: {
    [key: string]: WatchOption | WatchCallback | string;
  };
}

type WatchCallback = (newValue: any, oldValue: any) => void;

interface WatchOption {
  handler: WatchCallback | string;
  immediate?: boolean; // 是否立即执行
  deep?: boolean; // 是否深度监听
  flush?: FlushMode; // 回调的执行时机
}
```

watch 选项用于监听数据的变化并执行相应的回调函数。支持以下功能：

- 监听单个数据源
- 监听多个数据源
- 深度监听（deep）
- 立即执行（immediate）
- 执行时机控制（flush）
  - `'sync'`: 同步执行，立即触发回调
  - `'post'`: DOM 更新后执行（默认值）
  - `'pre'`: DOM 更新前执行

```js
createComponent({
  data() {
    return {
      message: "Hello",
      user: {
        name: "John",
        age: 20,
      },
    };
  },
  watch: {
    // 简单监听
    message(newVal, oldVal) {
      console.log("message changed:", newVal, oldVal);
    },

    // 深度监听
    user: {
      handler(newVal, oldVal) {
        console.log("user changed:", newVal, oldVal);
      },
      deep: true,
      immediate: true,
    },

    // 监听对象的属性
    "user.name"(newVal, oldVal) {
      console.log("user.name changed:", newVal, oldVal);
    },

    // 控制执行时机
    count: {
      handler(newVal) {
        console.log("count changed:", newVal);
      },
      flush: "post", // DOM 更新后执行
    },
  },
});
```

### methods

用于声明组件的方法。

```ts
interface ComponentOptions {
  methods?: {
    [key: string]: (...args: any[]) => any;
  };
}
```

methods 选项用于声明组件实例可以访问的方法。所有方法的 this 上下文会自动绑定为组件实例。

```js
createComponent({
  methods: {
    handleClick() {
      // 访问数据
      console.log(this.message);
      // 调用其他方法
      this.otherMethod();
    },
    otherMethod() {
      // ...
    },
  },
});
```

### mixins

一个包含组件选项对象的数组，这些选项都将被混入到当前组件的实例中。

详情请查看[mixins](https://mpxjs.cn/guide/advance/mixin.html)

### setup

`setup` 函数在组件创建时执行，返回组件所需的数据和方法，是组合式 API 的核心。

```js
import { createComponent, ref, onMounted, onUnmounted } from "@mpxjs/core";

createComponent({
  properties: {
    user: String,
  },
  setup(props) {
    const repositories = ref([]);
    const getUserRepositories = async () => {
      repositories.value = await fetchUserRepositories(props.user);
    };

    // 注册生命周期钩子
    onMounted(() => {
      console.log("Component mounted.");
      getUserRepositories();
    });

    onUnmounted(() => {
      console.log("Component unmounted.");
    });

    return {
      repositories,
      getUserRepositories,
    };
  },
});
```

详情请查看[组合式 API](../composition-api/composition-api.md)

### relations

用于定义组件间的关系，支持父子、祖孙等关系，实现组件间的通信与控制。

该特性 base 微信小程序平台，在 Mpx 中使用该特性需要注意，输出微信小程序平台时能力完全支持，跨端输出其他平台时受制于平台底层能力，无法完全做抹平支持。

| 平台         | 支持情况 | 说明                                        |
| ------------ | -------- | ------------------------------------------- |
| 微信小程序   | 完全支持 | 完全支持 relations 能力                     |
| 支付宝小程序 | 部分支持 | 部分支持，不支持 linkChanged 和 target 能力 |
| 百度小程序   | 不支持   | 不支持使用 relations                        |
| QQ 小程序    | 完全支持 | 完全支持 relations 能力                     |
| 字节小程序   | 部分支持 | 部分支持，不支持 linkChanged 能力           |
| Web          | 部分支持 | 部分支持，不支持 linkChanged 和 target 能力 |
| RN           | 不支持   | 不支持使用 relations                        |

因此需要注意，在使用 realtions 能力跨平台时需要做好平台条件编译。

```ts
interface RelationOption {
  type: "parent" | "child" | "ancestor" | "descendant"; // 关系类型
  linked?: (target: any) => void; // 关系建立时的回调
  linkChanged?: (target: any) => void; // 关系变化时的回调
  unlinked?: (target: any) => void; // 关系解除时的回调
  target?: string; // 关联的 behavior
}

interface ComponentOptions {
  relations?: {
    [componentPath: string]: RelationOption;
  };
}
```

relations 支持以下功能：

- 定义组件间的层级关系
- 监听关系的生命周期
- 获取关联的组件实例
- 关联使用相同 behavior 的组件

详情可参考[微信小程序-relations](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/relations.html)

```js
// custom-ul 组件
import { createComponent } from "@mpxjs/core";
createComponent({
  relations: {
    "./custom-li": {
      type: "child", // 关联的目标节点应为子节点
      linked(target) {
        // 每次有 custom-li 被插入时执行
        console.log("li linked", target);
      },
      unlinked(target) {
        // 每次有 custom-li 被移除时执行
        console.log("li unlinked", target);
      },
    },
  },
});

// custom-li 组件
import { createComponent } from "@mpxjs/core";
createComponent({
  relations: {
    "./custom-ul": {
      type: "parent", // 关联的目标节点应为父节点
      linked(target) {
        // 每次被插入到 custom-ul 时执行
        console.log("ul linked", target);
      },
    },
  },
});
```

### options

开启组件的部分特性时需要设置的选项，例如 virtualHost 、 multipleSlots 之类特性。

```ts
interface ComponentOptions {
  options?: {
    virtualHost?: boolean; // 设置组件是否为虚拟节点
    styleIsolation?:
      | "isolated"
      | "apply-shared"
      | "shared"
      | "page-isolated"
      | "page-apply-shared"
      | "page-shared"; // 设置样式隔离选项
    multipleSlots?: boolean; // 启用多 slot 支持
    addGlobalClass?: boolean; // 允许组件的样式影响到外部
  };
}
```

options 支持以下配置：

- **virtualHost**: 设置组件是否存在实体 Host 根节点
- **styleIsolation**: 设置组件样式隔离选项
- **multipleSlots**: 是否启用多 slot 支持，仅微信和 QQ 需要配置
- **addGlobalClass**: 是否允许组件的样式影响外部

但需要注意的是，此处的 options 配置为 base 微信小程序的语法特性，在跨端输出其他平台时，由于依赖平台底层能力支持与否，因此无法做到全部功能抹平。

| 选项           | 微信 | 支付宝   | 百度 | QQ  | 字节 | Web      | RN       | 说明                                                                                                                                                                                                  |
| -------------- | ---- | -------- | ---- | --- | ---- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| virtualHost    | ✓    | 依赖编译 | ✗    | ✓   | ✓    | 依赖编译 | 依赖编译 | Mpx 跨端输出支付宝、web 和 RN 时需要通过[autoVirtualHostRules 编译配置](https://mpxjs.cn/api/compile.html#autovirtualhostrules)控制在编译时模拟实现该行为                                             |
| styleIsolation | ✓    | 依赖编译 | ✗    | ✓   | ✗    | 依赖编译 | ✗        | 微信默认开启样式隔离，输出支付宝和 web 可以通过[autoScopeRules 编译配置](https://mpxjs.cn/api/compile.html#autoscoperules)或在 style 标签中添加 scoped 属性模拟实现样式隔离，输出 RN 目前强制样式隔离 |
| multipleSlots  | ✓    | -        | -    | ✓   | -    | -        | -        | 目前仅微信和 QQ 使用多个 slot 需要配置 multipleSlots，其他平台默认支持使用多 slot                                                                                                                     |
| addGlobalClass | ✓    | ✗        | ✓    | ✓   | ✗    | ✗        | ✗        | -                                                                                                                                                                                                     |

> **注意：**
> virtualHost 在支付宝平台默认为 false
> options 中的特性以微信小程序为 base，随着微信小程序的持续迭代，此处列出的特性可能会存在部分缺失。
> 同时对于上述各特性的具体使用，特别是各小程序平台，开发者也可以在对应小程序开发文档中查找参考。

### 生命周期

在 Mpx 内组件生命周期可以使用[框架内置生命周期](框架内置生命周期)，也可以使用以微信原生 base 的生命周期，在使用微信原生 base 的生命周期时，在跨平台输出时，框架会对生命周期进行映射抹平，将不同小程序平台的生命周期转换映射为内置生命周期后再进行统一的驱动，以抹平不同小程序平台生命周期钩子的差异。

在选项式 API 中，可以使用微信 base 或者 Mpx 框架暴露的内置生命周期。

微信原生生命周期：

| 生命周期 | 说明                         |
| -------- | ---------------------------- |
| created  | 在组件实例初始化完成时调用   |
| attached | 在组件挂载开始之前调用       |
| ready    | 在组件在视图层布局完成后调用 |
| detached | 在组件实例销毁时调用         |

在组合式 API 中，需要使用框架暴露的统一的[生命周期钩子](https://mpxjs.cn/api/composition-api.html#%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E9%92%A9%E5%AD%90)

### 页面生命周期

组件中访问页面生命周期

在选项式中可以直接使用 pageLifetimes.show 之类的配置：

| 生命周期 | 说明                     |
| -------- | ------------------------ |
| show     | 组件所在页面显示         |
| hide     | 组件所在页面隐藏         |
| resize   | 组件所在页面尺寸发生变化 |

在组合式 API 中，需要使用框架暴露的 onShow、onHide、onResize，详情可[查看](https://mpxjs.cn/api/composition-api.html#%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E9%92%A9%E5%AD%90)

## 组件实例方法

### $forceUpdate

无视数据响应特性强制更新视图，输出小程序时支持传入 data 参数，精确控制底层 setData 发送的数据。

```ts
interface ComponentInstance {
  $forceUpdate(data?: Record<string, any>): void;
}
```

### triggerEvent

触发事件，参见[组件间通信与事件](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/events.html)。

```ts
interface ComponentInstance {
  triggerEvent(
    name: string,
    detail?: object,
    options?: {
      bubbles?: boolean;
      composed?: boolean;
      capturePhase?: boolean;
    }
  ): void;
}
```

### getPageId

返回页面标识符（一个字符串），可以用来判断几个自定义组件实例是不是在同一个页面内。

```ts
interface ComponentInstance {
  getPageId(): string;
}
```

### selectComponent

使用选择器选择组件实例节点，返回匹配到的第一个组件实例对象。

```ts
interface ComponentInstance {
  selectComponent(selector: string): object;
}
```

### selectAllComponents

使用选择器选择组件实例节点，返回匹配到的全部组件实例对象组成的数组

```ts
interface ComponentInstance {
  selectAllComponents(selector: string): object[];
}
```

### createSelectorQuery

创建一个 SelectorQuery 对象，选择器选取范围为这个组件实例内。

```ts
interface ComponentInstance {
  createSelectorQuery(): SelectorQuery;
}
```

### createIntersectionObserver

创建一个 IntersectionObserver 对象，选择器选取范围为这个组件实例内。

```ts
interface ComponentInstance {
  createIntersectionObserver(options?: {
    thresholds?: number[];
    initialRatio?: number;
    observeAll?: boolean;
  }): IntersectionObserver;
}
```

## 组件配置

在组件的 `json` 文件中，可以配置以下字段：

| 属性              | 类型    | 必填 | 描述                                     |
| :---------------- | :------ | :--- | :--------------------------------------- |
| component         | Boolean | 是   | 声明这是一个自定义组件，必须设为 true    |
| usingComponents   | Object  | 否   | 引用自定义组件，组件名为键，值为组件路径 |
| componentGenerics | Object  | 否   | 组件泛型（抽象节点）声明                 |

### componentGenerics

组件泛型（抽象节点）用于在组件中声明一个节点，其对应的实际组件由组件的使用者决定。这使得组件可以接受不同的子组件，增强了组件的复用性。

#### 在组件中使用

首先，在组件的 JSON 中声明抽象节点：

```json
{
  "componentGenerics": {
    "selectable": true
  }
}
```

其中 `"selectable"` 是抽象节点的名称。

然后，在组件模板中直接使用该名称：

```html
<!-- components/selectable-group.mpx -->
<view>
  <label>请选择</label>
  <selectable disabled="{{false}}"></selectable>
</view>
```

#### 使用包含抽象节点的组件

在使用该组件的页面或父组件中，需要通过 `generic:xxx="yyy"` 属性来指定具体的组件：

```html
<!-- pages/index.mpx -->
<selectable-group generic:selectable="custom-radio" />
```

注意：

1. `custom-radio` 必须在当前页面的 JSON `usingComponents` 中注册。
2. `generic:xxx` 的值只能是静态字符串，不支持数据绑定。

#### 指定默认组件

可以在声明抽象节点时指定一个默认组件，当使用者未指定具体组件时，将使用默认组件：

```json
{
  "componentGenerics": {
    "selectable": {
      "default": "path/to/default/component"
    }
  }
}
```
