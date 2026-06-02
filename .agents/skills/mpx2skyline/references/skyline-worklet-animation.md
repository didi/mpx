# Skyline Worklet 动画与手势系统参考

## 目录

- [Worklet 动画基础](#worklet-动画基础)
  - [双线程架构与 worklet 函数](#双线程架构与-worklet-函数)
  - [共享变量 shared / derived](#共享变量-shared--derived)
  - [线程通信 runOnUI / runOnJS](#线程通信-runonui--runonjs)
- [动画类型](#动画类型)
  - [timing — 时间驱动动画](#timing--时间驱动动画)
  - [spring — 弹簧动画](#spring--弹簧动画)
  - [decay — 衰减动画](#decay--衰减动画)
  - [组合动画 sequence / repeat / delay](#组合动画-sequence--repeat--delay)
  - [缓动函数 Easing](#缓动函数-easing)
- [页面实例方法](#页面实例方法)
  - [applyAnimatedStyle / clearAnimatedStyle](#applyanimatedstyle--clearanimatedstyle)
- [手势系统](#手势系统)
  - [手势组件列表与触发时机](#手势组件列表与触发时机)
  - [手势状态枚举](#手势状态枚举)
  - [手势嵌套与冲突](#手势嵌套与冲突)
  - [手势协商 simultaneous-handlers](#手势协商-simultaneous-handlers)
  - [代理原生组件手势 native-view](#代理原生组件手势-native-view)
  - [手势事件参数](#手势事件参数)
  - [手势通用属性](#手势通用属性)
- [自定义路由](#自定义路由)
  - [wx.router.addRouteBuilder / getRouteContext](#路由注册)
  - [CustomRouteConfig 配置项](#customrouteconfig)
  - [路由控制器 primaryAnimation / secondaryAnimation](#路由控制器)
  - [半屏路由实现](#半屏路由实现)
  - [手势返回](#手势返回)
  - [页面透明背景设置](#页面透明背景设置)
- [Babel 插件配置](#babel-插件配置)
- [注意事项](#注意事项)

---

## Worklet 动画基础

### 双线程架构与 worklet 函数

小程序采用双线程架构：渲染线程（UI 线程）和逻辑线程（JS 线程）分离。JS 线程不会影响 UI 线程的动画表现，但交互动画（如拖动元素）时跨线程传递会带来较大延迟。

worklet 动画正是为解决此问题而诞生，使小程序可以做到类原生动画般的体验。

**worklet 函数**：一种声明在开发者代码中、可运行在 JS 线程或 UI 线程的函数，函数体顶部有 `'worklet'` 指令声明。

```js
// worklet 函数定义
function someWorklet(greeting) {
  'worklet';
  console.log(greeting);
}

// 运行在 JS 线程
someWorklet('hello') // print: hello

// 运行在 UI 线程
wx.worklet.runOnUI(someWorklet)('hello') // print: [ui] hello
```

**worklet 函数间相互调用**：

```js
const name = 'skyline'

function anotherWorklet() {
  'worklet';
  return 'hello ' + name;
}

function someWorklet() {
  'worklet';
  const greeting = anotherWorklet();
  console.log('another worklet says', greeting);
}

wx.worklet.runOnUI(someWorklet)() // print: [ui] another worklet says hello skyline
```

**从 UI 线程调回到 JS 线程**：

```js
function someFunc(greeting) {
  console.log('hello', greeting);
}

function someWorklet() {
  'worklet'
  // 访问非 worklet 函数时，需使用 runOnJS
  const showModal = runOnJS(someFunc)
  showModal('skyline')
}

wx.worklet.runOnUI(someWorklet)() // print: hello skyline
```

### 共享变量 shared / derived

由 `wx.worklet.shared` 创建的变量，可在 JS 线程和 UI 线程间同步。用法上可类比 Vue 3 中的 `ref`，对它的读写都需要通过 `.value` 属性。

```js
const { shared, runOnUI } = wx.worklet

const offset = shared(0)

function someWorklet() {
  'worklet'
  console.log(offset.value) // print: 1
  offset.value = 2
  console.log(offset.value) // print: 2
}

// 在 JS 线程修改
offset.value = 1

runOnUI(someWorklet)()
```

**注意**：worklet 函数捕获的外部变量会被序列化后生成在 UI 线程的拷贝，后续在 JS 线程的修改无法同步到 UI 线程。需要跨线程同步状态变化时必须使用 `shared` 变量。

`derived` 用于创建基于其他共享变量的派生值：

```js
const { shared, derived } = wx.worklet
const offset = shared(0)
const doubleOffset = derived(() => {
  'worklet'
  return offset.value * 2
})
```

### 线程通信 runOnUI / runOnJS

| 函数 | 作用 |
| --- | --- |
| `wx.worklet.runOnUI(fn)` | 将 worklet 函数调度到 UI 线程执行 |
| `runOnJS(fn)` | 在 worklet 函数内调回 JS 线程执行非 worklet 函数 |

## 动画类型

### timing — 时间驱动动画

从当前值到目标值的时间驱动动画。

```js
const { shared, timing, Easing } = wx.worklet

const offset = shared(0)

// 驱动动画
offset.value = timing(300, {
  duration: 200,
  easing: Easing.ease
})
```

### spring — 弹簧动画

基于弹簧物理模型的动画。

```js
const { shared, spring } = wx.worklet

const offset = shared(0)

offset.value = spring(300, {
  damping: 10,
  stiffness: 100,
  mass: 1,
})
```

### decay — 衰减动画

从初始速度开始逐渐减速的动画。

```js
const { shared, decay } = wx.worklet

const offset = shared(0)

offset.value = decay(0, {
  velocity: 500,
  deceleration: 0.998,
})
```

### 组合动画 sequence / repeat / delay

```js
const { shared, timing, sequence, repeat, delay, Easing } = wx.worklet

const offset = shared(0)

// 顺序执行
offset.value = sequence(
  timing(100, { duration: 100 }),
  timing(200, { duration: 100 }),
)

// 重复执行
offset.value = repeat(
  timing(100, { duration: 100 }),
  3, // 重复次数
)

// 延迟执行
offset.value = delay(
  500, // 延迟时间 ms
  timing(100, { duration: 100 }),
)
```

### 缓动函数 Easing

| 缓动函数 | 说明 |
| --- | --- |
| `Easing.ease` | 默认缓动 |
| `Easing.linear` | 线性 |
| `Easing.in` / `Easing.out` / `Easing.inOut` | 加速/减速/先加后减 |
| `Easing.circle` / `Easing.sin` | 圆形/正弦 |
| `Easing.cubicBezier(x1, y1, x2, y2)` | 自定义贝塞尔曲线 |

## 页面实例方法

### applyAnimatedStyle / clearAnimatedStyle

通过页面/组件实例访问，用于驱动节点样式动画。

```js
Page({
  onLoad() {
    const offset = wx.worklet.shared(0)

    // 注册动画样式
    this.applyAnimatedStyle('#moved-box', () => {
      'worklet';
      return {
        transform: `translateX(${offset.value}px)`
      }
    })

    this._offset = offset
  },

  onUnload() {
    // 清除动画样式
    this.clearAnimatedStyle('#moved-box')
  },

  tap() {
    this._offset.value = Math.random()
  }
})
```

当 `offset` 的值变化时，`applyAnimatedStyle` 的 updater 函数会重新执行，并将返回的新 StyleObject 应用到选中节点上。

## 手势系统

### 手势组件列表与触发时机

| 组件 | 触发时机 | 类型 |
| --- | --- | --- |
| `tap-gesture-handler` | 点击时触发 | 离散手势 |
| `double-tap-gesture-handler` | 双击时触发 | 离散手势 |
| `force-press-gesture-handler` | iPhone 设备重按时触发 | 连续手势 |
| `horizontal-drag-gesture-handler` | 横向滑动时触发 | 连续手势 |
| `long-press-gesture-handler` | 长按时触发 | 连续手势 |
| `pan-gesture-handler` | 拖动（横向/纵向）时触发 | 连续手势 |
| `scale-gesture-handler` | 多指缩放时触发 | 连续手势 |
| `vertical-drag-gesture-handler` | 纵向滑动时触发 | 连续手势 |

手势组件为虚组件，不会进行布局，其直接子节点才是真正响应事件的节点。

### 手势状态枚举

所有手势回调均会返回 `state` 状态字段：

```js
enum State {
  POSSIBLE = 0,   // 手势未识别
  BEGIN = 1,       // 手势已识别
  ACTIVE = 2,      // 连续手势活跃状态
  END = 3,         // 手势终止
  CANCELLED = 4    // 手势取消
}
```

**离散手势**（tap / double-tap）：仅触发一次，state 始终为 1。

**连续手势**：state 按以下方式变化：
- 正常流程：POSSIBLE → BEGIN → ACTIVE → END
- 提前中断：POSSIBLE → BEGIN → ACTIVE → CANCELLED
- 手势未识别：POSSIBLE → CANCELLED

### 手势嵌套与冲突

手势组件为虚组件，真正响应事件的是其直接子节点。嵌套的同类型手势组件，当内层的手势识别后，外层的手势组件将不会被识别。

```html
<!-- 横向滑动触发 horizontal-drag，纵向滑动触发 vertical-drag -->
<horizontal-drag-gesture-handler>
  <vertical-drag-gesture-handler>
    <view id="container"></view>
  </vertical-drag-gesture-handler>
</horizontal-drag-gesture-handler>
```

**注意**：`pan` 类型的判定条件比 `vertical-drag` 宽松，纵向滑动时 `vertical-drag` 优先响应，`pan` 则会失效。

在 `scroll-view` 内添加纵向手势监听时，将会阻断 `scroll-view` 内的手势监听器，导致无法滑动。需使用 `native-view` 代理（见下文）。

### 手势协商 simultaneous-handlers

嵌套的同类型手势组件默认互斥，可通过 `simultaneous-handlers` 声明可同时触发的手势节点：

```html
<vertical-drag-gesture-handler
  tag="outer"
  simultaneous-handlers="{{['inner']}}">
  <vertical-drag-gesture-handler
    tag="inner"
    simultaneous-handlers="{{['outer']}}"
    native-view="scroll-view">
    <scroll-view scroll-y></scroll-view>
  </vertical-drag-gesture-handler>
</vertical-drag-gesture-handler>
```

此时 outer 和 inner 手势组件的回调会依次触发，可实现列表滚动与外层拖动的衔接。

### 代理原生组件手势 native-view

对于 `scroll-view` 和 `swiper` 等滚动容器，可使用 `native-view` 属性代理其内部手势：

```html
<vertical-drag-gesture-handler
  native-view="scroll-view"
  should-response-on-move="shouldScrollViewResponse"
  should-accept-gesture="shouldScrollViewAccept"
  on-gesture-event="handleGesture">
  <scroll-view scroll-y type="list"></scroll-view>
</vertical-drag-gesture-handler>
```

`native-view` 支持的枚举值：`scroll-view` / `swiper`。

- 纵向滚动用 `vertical-drag-gesture-handler`
- 横向滚动用 `horizontal-drag-gesture-handler`

**手势控制**：

- `should-accept-gesture`：手势识别时触发一次，返回 `false` 则手势不再生效，scroll-view 也无法滚动
- `should-response-on-move`：手指移动过程中持续触发，返回 `false` 则当次 move 事件不再派发，scroll-view 不继续滚动

### 手势事件参数

**tap / double-tap**：

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `state` | number | 手势状态 |
| `absoluteX` | number | 全局 X 坐标 |
| `absoluteY` | number | 全局 Y 坐标 |

**pan / vertical-drag / horizontal-drag**：

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `state` | number | 手势状态 |
| `absoluteX` | number | 全局 X 坐标 |
| `absoluteY` | number | 全局 Y 坐标 |
| `deltaX` | number | X 轴移动增量 |
| `deltaY` | number | Y 轴移动增量 |
| `velocityX` | number | 离开屏幕时横向速度 (px/s) |
| `velocityY` | number | 离开屏幕时纵向速度 (px/s) |

**scale**：

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `state` | number | 手势状态 |
| `focalX` / `focalY` | number | 中心点全局坐标 |
| `focalDeltaX` / `focalDeltaY` | number | 中心点移动增量 |
| `scale` | number | 缩放比例 |
| `rotation` | number | 旋转角（弧度） |
| `velocityX` / `velocityY` | number | 离开屏幕时速度 |
| `pointerCount` | number | 跟踪的手指数 |

**long-press**：

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `state` | number | 手势状态 |
| `absoluteX` / `absoluteY` | number | 全局坐标 |
| `translationX` / `translationY` | number | 相对初始触摸点偏移 |
| `velocityX` / `velocityY` | number | 离开屏幕时速度 |

**force-press**：

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `state` | number | 手势状态 |
| `absoluteX` / `absoluteY` | number | 全局坐标 |
| `pressure` | number | 压力大小 |

### 手势通用属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `tag` | string | 无 | 声明手势协商时的组件标识 |
| `worklet:ongesture` | eventhandler | 无 | 手势处理回调 |
| `worklet:should-response-on-move` | callback | 无 | 手指移动时是否响应 |
| `worklet:should-accept-gesture` | callback | 无 | 手势是否应该被识别 |
| `simultaneous-handlers` | Array\<string\> | `[]` | 声明可同时触发的手势节点 |
| `native-view` | string | 无 | 代理的原生节点类型（`scroll-view` / `swiper`） |

## 自定义路由

在连续的 Skyline 页面间跳转时，可实现自定义路由效果（如半屏弹出、页面下沉等）。

### 路由注册

```js
// 在页面跳转前定义好 routeBuilder
const customRouteBuilder = (routeContext) => {
  const { primaryAnimation } = routeContext

  const handlePrimaryAnimation = () => {
    'worklet'
    let t = primaryAnimation.value
    return {
      transform: `translateX(${windowWidth * (1 - t)}px)`,
    }
  }

  return {
    opaque: true,
    handlePrimaryAnimation,
  }
}

wx.router.addRouteBuilder('customRoute', customRouteBuilder)

// 跳转时指定 routeType
wx.navigateTo({
  url: '/pages/detail/index',
  routeType: 'customRoute'
})
```

### CustomRouteConfig 配置项

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `opaque` | boolean | `true` | 下一个页面推入后，不显示前一个页面 |
| `maintainState` | boolean | `true` | 是否保持前一个页面状态 |
| `transitionDuration` | number | `300` | 页面推入动画时长（ms） |
| `reverseTransitionDuration` | number | `300` | 页面推出动画时长（ms） |
| `barrierColor` | string | `''` | 遮罩层背景色，支持 `rgba()` 和 `#RRGGBBAA` |
| `barrierDismissible` | boolean | `false` | 点击遮罩层返回上一页 |
| `barrierLabel` | string | `''` | 无障碍语义 |
| `canTransitionTo` | boolean | `true` | 是否与下一个页面联动 |
| `canTransitionFrom` | boolean | `true` | 是否与前一个页面联动 |
| `handlePrimaryAnimation` | function | | 处理当前页的进入/退出动画 |
| `handleSecondaryAnimation` | function | | 处理当前页的压入/压出动画 |
| `handlePreviousPageAnimation` | function | | 处理上一级页面的压入/压出动画（基础库 3.0.0+） |
| `allowEnterRouteSnapshotting` | boolean | `false` | 页面进入时采用 snapshot 模式优化（3.2.0+） |
| `allowExitRouteSnapshotting` | boolean | `false` | 页面退出时采用 snapshot 模式优化（3.2.0+） |
| `fullscreenDrag` | boolean | `false` | 右滑返回时可拖动范围是否撑满屏幕（3.2.0+） |
| `popGestureDirection` | string | `'horizontal'` | 返回手势方向：`horizontal` / `vertical` / `multi`（3.4.0+） |

### 路由控制器

打开新页面时，框架会创建两个 `SharedValue` 类型的动画控制器：

- `primaryAnimation`：控制进入/退出动画，值在 0～1 之间变化
- `secondaryAnimation`：控制压入/压出动画，值在 0～1 之间变化

**push 阶段**：
- B 页 `primaryAnimation`：0 → 1（进入动画）
- A 页 `secondaryAnimation`：0 → 1（压入动画）

**pop 阶段**：
- B 页 `primaryAnimation`：1 → 0（退出动画）
- A 页 `secondaryAnimation`：1 → 0（压出动画）

A 页 `secondaryAnimation` 的值始终与 B 页 `primaryAnimation` 保持同步。

通过 `primaryAnimationStatus` / `secondaryAnimationStatus` 可判断当前处于进入还是退出阶段：

```js
enum AnimationStatus {
  dismissed = 0,  // 动画停在起点
  forward = 1,     // 从起点向终点进行
  reverse = 2,     // 从终点向起点进行
  completed = 3    // 动画停在终点
}
```

### 半屏路由实现

```js
const HalfScreenDialogRouteBuilder = (routeContext) => {
  const { primaryAnimation, primaryAnimationStatus } = routeContext

  const handlePrimaryAnimation = () => {
    'worklet'
    let t = primaryAnimation.value
    const topDistance = 0.12
    const marginTop = topDistance * screenHeight
    const pageHeight = (1 - topDistance) * screenHeight
    const transY = pageHeight * (1 - t)
    return {
      overflow: 'hidden',
      borderRadius: '10px',
      marginTop: `${marginTop}px`,
      height: `${pageHeight}px`,
      transform: `translateY(${transY}px)`,
    }
  }

  return {
    opaque: false,
    handlePrimaryAnimation,
  }
}
```

### 手势返回

手势返回需要手动控制 `primaryAnimation` 的值，并通过 `startUserGesture` / `stopUserGesture` 通知框架：

```js
handleDragEnd(velocity) {
  'worklet';
  const {
    primaryAnimation,
    stopUserGesture,
    didPop
  } = this.customRouteContext;

  let animateForward = false;
  if (Math.abs(velocity) >= 1.0) {
    animateForward = velocity <= 0;
  } else {
    animateForward = primaryAnimation.value > 0.5;
  }

  const t = primaryAnimation.value;
  if (animateForward) {
    primaryAnimation.value = timing(1.0, { duration: 300 }, () => {
      'worklet'
      stopUserGesture();
    });
  } else {
    primaryAnimation.value = timing(0.0, { duration: 300 }, () => {
      'worklet'
      stopUserGesture();
      didPop();
    });
  }
}
```

### 页面透明背景设置

Skyline 模式下使用自定义路由时，页面背景色有以下层级：

1. **页面背景色**：通过 `page` 选择器在 wxss 中定义，默认白色
2. **页面容器背景色**：页面 json 中 `backgroundColorContent` 属性，默认白色
3. **自定义路由容器背景色**：路由配置返回的 StyleObject，默认透明
4. **是否显示前一个页面**：由 `opaque` 字段控制

设置渐显进入效果：

```css
page { background-color: transparent; }
```

```json
{ "backgroundColorContent": "#ffffff00" }
```

## Babel 插件配置

使用 worklet 函数需要配置 Babel 插件：

```bash
npm i babel-plugin-worklet@0.0.5
```

Mpx 项目中通过 `overrides` 配置：

```json
{
  "overrides": [{
    "include": ["./src/components/worklet/gesture.mpx"],
    "plugins": [
      ["@babel/plugin-transform-arrow-functions"],
      ["@babel/plugin-transform-shorthand-properties"],
      ["@babel/plugin-proposal-class-properties"],
      "babel-plugin-worklet"
    ]
  }]
}
```

**注意**：配置 worklet Babel 插件后，**不需要勾选**「将 JS 编译成 ES5」（会导致包体积增加）。

## 注意事项

1. **worklet 函数内部限制**：worklet 函数引用的外部变量，对象类型将被 `Object.freeze` 冻结，使用时需直接访问对象上具体的属性。

2. **this.data 访问方式**：在 worklet 函数中访问 `this.data` 时，**避免解构赋值**，否则会冻结整个 `this.data` 对象，导致 `setData` 无法生效。

   ```js
   handleTap() {
   'worklet'
   // ❌ Bad — 解构 this.data 会导致 setData 失效
   // const { msg } = this.data

   // ✅ Good — 直接访问属性
   const msg = `hello ${this.data.msg}`
   }
   ```

3. **Page 方法需 bind(this)**：在 worklet 函数中调用 Page 定义的方法时，需要通过 `this.methodName.bind(this)` 访问。

   ```js
   handleTap() {
   'worklet'
   const showModal = this.showModal.bind(this)
   runOnJS(showModal)(msg)
   }
   ```

4. **手势组件为虚组件**：不会进行布局，手势组件上设置 `style` / `class` 是无效的。

5. **手势组件仅含一个直接子节点**：否则不生效。

6. **手势回调均需 worklet 声明**：所有回调函数均需声明为 worklet 函数，回调在 UI 线程触发。

7. **手势不冒泡**：手势不同于普通 touch 事件，不会进行冒泡。

8. **scroll-view 代理**：代理 scroll-view 内部手势时，`scroll` 事件仅在滚动时触发，触顶/底后不再回调；`on-gesture-event` 手势回调在手指滑动时会一直触发直到松手。
