# Mpx 跨端样式缓存机制分析

## 1. 样式缓存实现

样式缓存主要通过以下机制实现：

### 1.1 ClassMap 缓存 (`processStyles.js`)

```javascript
// 第 52-54 行
global.__classCaches = global.__classCaches || []
var __classCache = new Map()
global.__classCaches.push(__classCache)
```

- 每个页面/组件创建一个 `Map` 缓存实例
- 存入全局 `__classCaches` 数组中统一管理

### 1.2 GCC (Get Class Cache) 函数 (`styleHelperMixin.ios.js:13-19`)

```javascript
global.__GCC = function (className, classMap, classMapValueCache) {
  if (!classMapValueCache.has(className)) {
    const styleObj = classMap[className]?.(global.__formatValue)
    styleObj && classMapValueCache.set(className, styleObj)
  }
  return classMapValueCache.get(className)
}
```

- 核心缓存函数：先查缓存，未命中时才计算并缓存
- 使用 `classMapValueCache` (即 `__classCache`) 存储样式计算结果

### 1.3 样式解析缓存 (`styleHelperMixin.ios.js`)

- `mpEscape`: className 转义缓存 (`cached`)
- `parseStyleText`: CSS 文本解析缓存 (`cached`)

---

## 2. 清空缓存策略

### 2.1 折叠屏/尺寸变化时自动清空 (`styleHelperMixin.ios.js:35-55`)

```javascript
Dimensions.addEventListener('change', ({ window, screen }) => {
  const oldScreen = getPageSize(global.__mpxAppDimensionsInfo.screen)
  useDimensionsInfo({ window, screen })

  // 对比 screen 高宽是否存在变化
  if (getPageSize(screen) === oldScreen) return

  // 关键：清空所有 class 缓存
  global.__classCaches?.forEach(cache => cache?.clear())

  // 更新全局和栈顶页面的标记
  global.__mpxSizeCount++

  const navigation = getFocusedNavigation()
  if (navigation) {
    global.__mpxPageSizeCountMap[navigation.pageId] = global.__mpxSizeCount
    // ...
  }
})
```

**触发条件**：
- `screen` 尺寸发生变化（折叠屏展开/折叠切换）
- **不会在 `window` 变化时清空**（如键盘弹出）

---

## 3. 折叠屏适配策略

### 3.1 尺寸监听 (`styleHelperMixin.ios.js:6-9`)

```javascript
global.__mpxAppDimensionsInfo = {
  window: Dimensions.get('window'),
  screen: Dimensions.get('screen')
}
```

### 3.2 rpx/vw/vh 单位转换 (`styleHelperMixin.ios.js:59-72`)

- 基于 `screen.width` 动态计算，支持折叠屏展开/折叠切换

### 3.3 响应式媒体样式 (`styleHelperMixin.ios.js:230-245`)

```javascript
function getMediaStyle (media) {
  const { width } = global.__mpxAppDimensionsInfo.screen
  // 根据 minWidth/maxWidth 匹配当前屏幕宽度
}
```

### 3.4 页面尺寸标记机制 (`getDefaultOptions.ios.js`)

- `__mpxSizeCount`: 全局尺寸版本计数
- `__mpxPageSizeCountMap`: 每个页面的尺寸版本
- 在 `__getStyle` 中调用 `__getSizeCount()` 触发响应式更新

### 3.5 TODO 注释中的已知问题 (`styleHelperMixin.ios.js:57-58`)

```javascript
// TODO: 1 目前测试鸿蒙下折叠屏screen固定为展开状态下屏幕尺寸，仅window会变化
// TODO: 2 存在部分安卓折叠屏机型在折叠/展开切换时，Dimensions监听到的width/height尺寸错误
```

---

## 4. 核心文件

| 文件 | 作用 |
|------|------|
| `packages/core/src/platform/builtInMixins/styleHelperMixin.ios.js` | 运行时样式处理、缓存管理、尺寸监听 |
| `packages/core/src/platform/patch/getDefaultOptions.ios.js` | 组件/页面实例创建、尺寸标记机制 |
| `packages/webpack-plugin/lib/react/processStyles.js` | 编译时生成 classMap 和缓存 |

---

## 5. 缓存架构流程

```
┌─────────────────────────────────────────────────────────┐
│                    编译时 (processStyles.js)             │
├─────────────────────────────────────────────────────────┤
│  1. 每个组件/页面生成 classMap (函数形式)                 │
│  2. 创建 __classCache (Map) 存入 __classCaches           │
│  3. 注册 __getClassStyle / __getAppClassStyle           │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    运行时 (styleHelperMixin)             │
├─────────────────────────────────────────────────────────┤
│  __GCC(className, classMap, classMapValueCache)         │
│    ├── 查缓存 classMapValueCache.has(className)        │
│    ├── 未命中 → classMap[className](formatValue)        │
│    └── 存入缓存并返回                                    │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              尺寸变化 (Dimensions.addEventListener)      │
├─────────────────────────────────────────────────────────┤
│  1. screen 尺寸变化 → 清空所有 __classCaches             │
│  2. global.__mpxSizeCount++                              │
│  3. 页面 __mpxPageSizeCountMap 更新                      │
│  4. 触发响应式重新渲染                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 6. 总结

| 机制 | 说明 |
|------|------|
| **缓存粒度** | 每个页面/组件独立的 `Map` |
| **缓存内容** | 解析后的样式对象 |
| **清空时机** | `screen` 尺寸变化（折叠屏展开/折叠） |
| **不清空时机** | `window` 尺寸变化（键盘弹出等） |
| **响应式更新** | 通过 `__mpxSizeCount` 版本号触发 |

---

## 7. PPT 述职演讲稿

### 7.1 PPT 结构建议（8-10页）

#### 第1页：封面
- **标题**: Mpx 跨端样式缓存机制详解
- **副标题**: 从原理到折叠屏适配
- **时长**: 5-10分钟

---

#### 第2页：背景/问题引入

**核心内容**：
- RN 渲染性能痛点：每次都解析样式开销大
- 折叠屏普及带来的屏幕尺寸变化问题
- Mpx 需要一套统一的缓存策略

**讲解要点**：
> "大家知道 React Native 的样式处理相比 Web 有更大开销，我们的 CSS 类名需要动态转换为 RN 的 Style 对象，如果不做缓存，每次渲染都会重复解析，这就是我们做样式缓存的初衷。"

---

#### 第3页：缓存架构总览

**核心内容**：
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  编译时     │ →  │  运行时     │ →  │  尺寸变化   │
│ 生成classMap│    │  缓存查询   │    │  自动刷新   │
└─────────────┘    └─────────────┘    └─────────────┘
```

**讲解要点**：
- 编译时：webpack 插件为每个组件生成 `classMap` 函数
- 运行时：首次解析存入 Map，后续直接命中
- 尺寸变化：监听 Dimensions，自动清空缓存

---

#### 第4页：核心实现 - 编译时

**代码展示**：
```javascript
// processStyles.js
global.__classCaches = global.__classCaches || []
var __classCache = new Map()
global.__classCaches.push(__classCache)

// 每个 class 生成一个函数
__classMap = {
  'container': function(_f){return {flex:1,backgroundColor:'#fff'};},
  'title': function(_f){return {fontSize:16};}
}
```

**讲解要点**：
- classMap 是函数形式，延迟执行
- 每个组件/页面独立的 cache 实例
- App 级别和页面级别的 class 区分处理

---

#### 第5-6页：核心实现 - 运行时

**核心函数**：
```javascript
global.__GCC = function (className, classMap, classMapValueCache) {
  if (!classMapValueCache.has(className)) {
    // 未命中才计算
    const styleObj = classMap[className]?.(global.__formatValue)
    styleObj && classMapValueCache.set(className, styleObj)
  }
  return classMapValueCache.get(className)
}
```

**讲解要点**：
- 核心就是 Map 的 get/set
- 一次计算，多次复用
- 配合响应式系统，变更时自动失效

---

#### 第7-8页：折叠屏适配策略

**核心逻辑**：
```javascript
Dimensions.addEventListener('change', ({ window, screen }) {
  // screen 变化 = 折叠/展开
  if (getPageSize(screen) !== oldScreen) {
    // 清空所有缓存
    global.__classCaches.forEach(cache => cache.clear())
    // 触发响应式更新
    global.__mpxSizeCount++
  }
})
```

**关键区分**：

| 场景 | 是否清空缓存 |
|------|-------------|
| 折叠屏展开/折叠 | ✅ 清空 |
| 键盘弹出 | ❌ 不清空 |
| 屏幕旋转 | ✅ 清空 |

---

#### 第9页：响应式更新机制

**流程**：
```
尺寸变化 → __mpxSizeCount++ → __getSizeCount() 依赖收集 → 触发 re-render
```

**讲解要点**：
- 不是直接清空就完事了，需要驱动视图更新
- 通过全局版本号 + 页面级别版本号管理
- 后台页面延迟更新，前台页面立即更新

---

#### 第10页：性能收益

**数据/结论**：
- 样式解析从 O(n) 降到 O(1)
- 折叠切换场景无感知
- 内存占用可控（Map 天然支持）

---

#### 第11页：总结

**三点核心**：
1. **编译时** - 生成可缓存的 classMap
2. **运行时** - Map 缓存 + 懒计算
3. **尺寸变化** - screen 维度变化时自动清空 + 响应式更新

---

### 7.2 演讲技巧建议

| 技巧 | 说明 |
|------|------|
| **痛点先行** | 先讲为什么要做，不是上来就秀代码 |
| **对比展示** | 有缓存 vs 无缓存的性能差异 |
| **互动提问** | "大家有没有遇到过折叠屏适配的坑？" |
| **gif/demo** | 如果有实际效果展示会更直观 |

---

### 7.3 述职加分项

1. **业务价值**：提到折叠屏适配是实际业务需求，不是技术炫技
2. **细节把控**：区分 screen 和 window 的不同场景
3. **问题意识**：主动提及 TODO 中的已知问题和改进方向
4. **可扩展性**：提到这套机制未来可以支持更多响应式特性

---

### 7.4 一页浓缩版 PPT 布局

```
┌─────────────────────────────────────────────────────────────────┐
│                    Mpx 跨端样式缓存机制                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────┐    ┌──────────────────────────┐ │
│  │       【问题背景】        │    │      【核心方案】         │ │
│  │  • RN 样式解析开销大     │    │  ┌─────┐   ┌─────┐       │ │
│  │  • 折叠屏尺寸变化需适配   │    │  │编译时│ → │运行时│       │ │
│  │  • 每次渲染重复计算       │    │  │class│   │Map   │       │ │
│  │                          │    │  │Map  │   │缓存  │       │ │
│  │                          │    │  └─────┘   └─────┘       │ │
│  └──────────────────────────┘    └──────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────┐    ┌──────────────────────────┐ │
│  │      【缓存策略】         │    │      【折叠屏适配】       │ │
│  │  global.__GCC()          │    │  Dimensions 监听         │ │
│  │  • 查缓存 → 未命中计算   │    │  • screen 变化→清缓存   │ │
│  │  • 存入 Map 复用         │    │  • window 变化→不清空   │ │
│  │  • 每组件独立 cache      │    │  • __mpxSizeCount++ 触发│ │
│  └──────────────────────────┘    └──────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                        【架构流程】                         │ │
│  │   编译生成classMap函数 ─→ 运行时GCC查Map缓存 ─→ 尺寸变化清缓存+响应式更新 │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  收益：样式解析 O(n)→O(1)  │  折叠屏切换无感  │  内存可控        │
└─────────────────────────────────────────────────────────────────┘
```

**布局要点**：

| 区域 | 内容 | 占比 |
|------|------|------|
| **左上** | 问题背景（为什么做） | 25% |
| **右上** | 核心方案（三个词概括） | 25% |
| **左下** | 技术实现细节 | 25% |
| **右下** | 折叠屏具体策略 | 25% |
| **底部横条** | 架构流程 + 收益总结 | 10% |

**一句话总结**：

> "我们通过编译时生成 classMap、运行时用 Map 缓存、监听 screen 尺寸变化自动清空这三步，实现了 RN 样式解析从 O(n) 到 O(1) 的性能提升，同时完美适配折叠屏场景。"
