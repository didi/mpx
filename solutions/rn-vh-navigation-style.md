# Mpx2RN vh 按 navigationStyle 对齐方案

## 背景

微信小程序中，`vh` 的计算基准会受页面 `navigationStyle` 影响：

1. `navigationStyle: "custom"`：页面内容铺满全屏，`100vh` 按屏幕高度计算。
2. 默认导航栏：页面内容区域不包含状态栏和标题栏，`100vh` 按实际可用视口高度计算。

当前 RN 输出中，`vh` 统一由 `packages/core/src/platform/builtInMixins/styleHelperMixin.ios.js` 的 `vh()` 读取 `global.__mpxAppDimensionsInfo.screen.height` 计算，没有结合页面 `navigationStyle` 与 RN 导航栏高度，因此默认导航栏页面会比小程序多出状态栏 + 标题栏高度。

## 目标

1. RN 输出中 `vh` 与小程序按 `navigationStyle` 对齐：
   - custom 页面：`vh = screen.height / 100`
   - 默认导航栏页面：`vh = 可用视口高度 / 100`
2. 覆盖 class 样式、静态/动态 inline style、`wx:style`、运行时 `useTransformStyle` 中的 `calc()` / `var()` / 简写展开等入口。
3. 保持 `rpx`、`vw` 继续基于 `screen.width`，不引入页面级差异。
4. 保持 `mpx.config.rnConfig.customDimensions` 对 `vh` 仍然生效。
5. 不调整小程序、Web 或非 RN 平台行为。

## 非目标

1. 不实现动态切换 `navigationStyle` 的完整能力。小程序侧 `navigationStyle` 是页面配置项，运行时 `setNavigationBarTitle` / `setNavigationBarColor` 不会改变它。
2. 不改变 `getWindowInfo` / `getSystemInfo` 的字段语义，本次只处理样式单位 `vh`。
3. 不改 `vw` / `rpx` / 媒体查询的计算基准。

## 现状链路

### class 样式

`packages/webpack-plugin/lib/react/style-helper.js` 会把样式中的单位编译成运行时函数调用：

```js
height: _f(100, 'vh')
```

`packages/webpack-plugin/lib/react/processStyles.js` 生成 classMap：

```js
className: function (_f) { return { height: _f(100, 'vh') } }
```

运行时由 `global.__GCC(className, classMap, cache)` 缓存并返回 style。

### inline style / wx:style

`packages/core/src/platform/builtInMixins/styleHelperMixin.ios.js` 中：

```js
transformStyleObj(styleObj) {
  transformed[prop] = formatValue(styleObj[prop])
}
```

最终同样进入 `formatValue`。

### React 内建组件运行时样式

`packages/webpack-plugin/lib/runtime/components/react/utils.tsx` 的 `useTransformStyle` 会处理 `var()`、`env()`、`calc()`、百分比、简写展开等，并多处直接调用：

```ts
global.__formatValue(value)
```

`mpx-view.tsx`、`mpx-swiper.tsx` 等少数组件也存在直接调用。

### 页面配置与导航栏高度

页面 JSON 中的 `navigationStyle` 已通过现有链路注入：

- `packages/webpack-plugin/lib/react/processJSON.js` 提取 `navigationStyle` 到 `__mpxPageConfigsMap`
- `packages/core/src/platform/createApp.ios.js` 合并 `global.__mpxPageConfig` 与页面配置后传给 `MpxNav`
- `packages/core/src/platform/patch/getDefaultOptions.ios.js` 的 `PageWrapperHOC` 通过 `useInnerHeaderHeight(currentPageConfig)` 计算导航栏占位，并写入 `navigation.layout`

因此方案应复用现有 `currentPageConfig` 与 `navigation.layout`，不新增编译期配置传输链路。

## 推荐设计

### 1. 在 navigation 上保存页面配置

在 `PageWrapperHOC` 中合并页面配置后，将配置挂到当前页面 navigation：

```js
const currentPageConfig = Object.assign({}, global.__mpxPageConfig, pageConfig)
navigation.pageConfig = currentPageConfig
```

继续保留现有：

```js
const headerHeight = useInnerHeaderHeight(currentPageConfig)
navigation.layout = getLayoutData(headerHeight)
```

这样样式运行时可以通过 `pageId -> navigation -> pageConfig/layout` 读取当前页面的 `navigationStyle` 与导航栏高度。

### 2. 新增按页面解析 vh 基准的方法

在 `styleHelperMixin.ios.js` 内新增内部 helper：

```js
function getNavigationByPageId(pageId) {
  if (pageId != null && global.__mpxPagesMap) {
    for (const key in global.__mpxPagesMap) {
      const navigation = global.__mpxPagesMap[key]?.[1]
      if (navigation?.pageId === pageId) return navigation
    }
  }
  return getFocusedNavigation()
}

function getVhBase(pageId) {
  const screenInfo = global.__mpxAppDimensionsInfo.screen
  const navigation = getNavigationByPageId(pageId) || {}
  const pageConfig = navigation.pageConfig || {}

  if (pageConfig.navigationStyle === 'custom') {
    return screenInfo.height
  }

  const layout = navigation.layout || {}
  return screenInfo.height - (layout.top || 0) - (layout.bottomVirtualHeight || 0)
}
```

说明：

1. `screenInfo` 使用 `global.__mpxAppDimensionsInfo.screen`，继续尊重 `customDimensions`。
2. 默认导航栏页面不直接使用 `navigation.layout.height`，避免绕过 `customDimensions` 后的 screen 高度。
3. 默认导航栏页面减去 `layout.top`，即状态栏 + 标题栏；Android 继续减去 `layout.bottomVirtualHeight`，与当前实际可用区域口径一致。
4. custom 页面不减 `layout.top`，保持全屏内容口径。

### 3. 扩展 formatValue 签名

保持向后兼容，将 `formatValue` 扩展为：

```js
function formatValue(value, unitType, pageId) {
  if (!dimensionsInfoInitialized) useDimensionsInfo(global.__mpxAppDimensionsInfo)
  if (unitType && typeof unit[unitType] === 'function') {
    return unit[unitType](+value, pageId)
  }
  // ...
}
```

并将 `vh` 改为：

```js
function vh(value, pageId) {
  return value * getVhBase(pageId) / 100
}
```

`rpx`、`vw` 仍忽略 `pageId`：

```js
function rpx(value) { ... }
function vw(value) { ... }
```

解析字符串单位时也要把 `pageId` 继续传入：

```js
return unit[matched[2]](+matched[1], pageId)
```

### 4. class 样式缓存按 pageId 隔离

当前 `global.__GCC` 只按 `className` 缓存。`vh` 变成页面相关后，同一个组件被 custom 页面与默认导航栏页面复用时，缓存会串值。

推荐将 `pageId` 作为缓存 key 的一部分：

```js
global.__GCC = function(className, classMap, classMapValueCache, pageId) {
  const cacheKey = pageId == null ? className : pageId + ':' + className
  if (!classMapValueCache.has(cacheKey)) {
    const styleObj = classMap[className]?.((value, unitType) => global.__formatValue(value, unitType, pageId))
    styleObj && classMapValueCache.set(cacheKey, styleObj)
  }
  return classMapValueCache.get(cacheKey)
}
```

然后调整 `processStyles.js` 生成的函数签名：

```js
__getClassStyle: function(className, pageId) {
  return global.__GCC(className, __classMap, __classCache, pageId)
}
```

App 级样式同理：

```js
global.__getAppClassStyle = function(className, pageId) {
  return global.__GCC(className, __appClassMap, __classCache, pageId)
}
```

`__getStyle` 中调用 class 样式时传入当前实例页 id：

```js
this.__getClassStyle?.(className, this.__pageId)
global.__getAppClassStyle?.(className, this.__pageId)
```

### 5. inline style 按 pageId 格式化

将：

```js
transformStyleObj(styleObj)
```

调整为：

```js
transformStyleObj(styleObj, pageId)
```

内部调用：

```js
transformed[prop] = formatValue(styleObj[prop], undefined, pageId)
```

`__getStyle` 中传入 `this.__pageId`。这样 `style="height: 100vh"`、`wx:style="{{{height: '100vh'}}}"` 与 class 样式保持一致。

### 6. React 内建组件运行时样式使用页面上下文

`useTransformStyle` 已经通过 `RouteContext` 能拿到 navigation，建议扩展为同时读取 `pageId`：

```ts
const { navigation, pageId } = useContext(RouteContext) || {}
const formatValue = (value: string, unitType?: string) => global.__formatValue(value, unitType, pageId)
```

然后将 `utils.tsx` 中样式处理相关 helper 的直接 `global.__formatValue(...)` 改为使用传入的 `formatValue`，重点覆盖：

- `transformVar`
- `transformEnv` fallback
- `transformCalc`
- `parseTransform`
- `transformBoxShadow`
- `expandAbbreviation`
- `expandFlex`
- `transformBackground`

`mpx-view.tsx`、`mpx-swiper.tsx` 等直接处理样式单位的组件，也按同样方式从 `RouteContext` 获取 `pageId`，再调用 `global.__formatValue(value, undefined, pageId)`。

### 7. 页面尺寸刷新机制

现有 `Dimensions.addEventListener('change')` 会：

1. 调用 `useDimensionsInfo`
2. 清空 `global.__classCaches`
3. 更新 `global.__mpxSizeCount`
4. 驱动当前页或下次 show 的页面重渲染

该机制可以继续复用，无需新增尺寸监听。

对于页面切换导致的 `vh` 基准差异，class 缓存已按 `pageId` 隔离，不依赖切页时清空全局缓存。

## 兼容性与风险

1. **class 缓存体积增加**：从 `className` 维度变为 `pageId + className` 维度。页面数量和 class 数量有限，且页面销毁后缓存不会无限增长到业务数据级别，可接受。
2. **无 pageId 的兜底场景**：独立组件或非页面上下文调用 `global.__formatValue` 时走 `getFocusedNavigation()`，取不到 navigation 时退回 `screen.height`，与当前行为一致。
3. **customDimensions 口径**：默认导航栏页面用 `customDimensions` 后的 `screen.height` 再扣除导航栏高度；custom 页面完全使用 `customDimensions` 后的 `screen.height`。
4. **动态 navigationStyle**：本方案不承诺支持。如果后续要支持，需要让 `MpxNav` 与 `PageWrapperHOC` 共享 pageConfig 状态，并在 `navigationStyle` 改变时重算 `navigation.layout` 与触发页面样式刷新。

## 测试建议

### 单元测试

1. `styleHelperMixin.ios.js`
   - mock `global.__mpxAppDimensionsInfo.screen.height = 800`
   - custom 页面 `100vh` 输出 `800`
   - 默认导航栏页面 `layout.top = 88` 时 `100vh` 输出 `712`
   - Android 默认导航栏页面 `layout.bottomVirtualHeight = 24` 时 `100vh` 输出 `688`
2. class 缓存隔离
   - 同一个 `classMap.full` 在 pageId 1 custom 下缓存 `800`
   - pageId 2 默认导航栏下缓存 `712`
   - 再次读取 pageId 1 仍为 `800`
3. inline style
   - `height: "50vh"` 在不同 pageId 下输出不同值

### 集成测试

准备两个页面复用同一个组件：

1. `pages/custom` 配置 `navigationStyle: "custom"`
2. `pages/default` 使用默认导航栏
3. 组件样式包含：

```css
.full {
  height: 100vh;
}
```

并包含 inline 场景：

```html
<view style="height: 100vh" />
<view wx:style="{{{height: 'calc(50vh + 10px)'}}}" />
```

断言：

1. custom 页面高度按屏幕高度计算。
2. 默认导航栏页面高度按 `screenHeight - statusBarHeight - titleHeight` 计算。
3. 两个页面来回切换后，共用组件的 class 样式不串值。

## 文档与 Skill 同步

该改动会改变 RN 输出中 `vh` 的对外表现，代码实现时需要同步更新：

1. `docs-vitepress/guide/rn/style.md`
   - 移除当前“默认导航栏下 vh 计算基准可能变化”的警告。
   - 补充 `vh` 在 RN 下与小程序一致：custom 按屏幕高度，默认导航栏按可用视口高度。
2. `.agents/skills/mpx2rn/references/rn-style-reference.md`
   - 更新 `vh` 转换规则，说明其基准受页面 `navigationStyle` 影响。

## 相关文件

- `packages/core/src/platform/builtInMixins/styleHelperMixin.ios.js`
- `packages/core/src/platform/patch/getDefaultOptions.ios.js`
- `packages/webpack-plugin/lib/react/processStyles.js`
- `packages/webpack-plugin/lib/runtime/components/react/utils.tsx`
- `packages/webpack-plugin/lib/runtime/components/react/mpx-view.tsx`
- `packages/webpack-plugin/lib/runtime/components/react/mpx-swiper.tsx`
- `docs-vitepress/guide/rn/style.md`
- `.agents/skills/mpx2rn/references/rn-style-reference.md`
