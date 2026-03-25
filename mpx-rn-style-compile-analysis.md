# Mpx 跨端样式编译分析

本文档总结 Mpx 跨端输出 React Native 的样式编译核心流程和规则引擎设计。

---

## 一、跨端样式编译核心流程

### 1.1 入口处理 (processStyles.js)

样式处理的入口函数，接收样式列表并协调整个编译过程。

#### 第一步：加载样式模块

```javascript
async.eachOfSeries(styles, (style, i, callback) => {
  loaderContext.importModule(JSON.parse(getRequestString('styles', style, extraOptions, i))).then((result) => {
    if (Array.isArray(result)) {
      result = result.map((item) => item[1]).join('\n')
    }
    content += result.trim() + '\n'
    callback()
  })
})
```

- 通过 `async.eachOfSeries` 串行处理每个 style 块
- 调用 `loaderContext.importModule` 动态加载样式文件
- 将所有样式内容拼接成完整的 CSS 字符串

#### 第二步：构建 classMap

```javascript
const classMap = getClassMap({
  content,
  filename: loaderContext.resourcePath,
  mode,
  srcMode,
  ctorType,
  warn,
  error,
  formatValueName
})
```

调用 `getClassMap()` 解析 CSS 内容，生成 class 到样式值的映射。

#### 第三步：生成运行时代码

将 `classMap` 转换为 JavaScript 代码，根据组件类型生成不同的注入方式：

- **App 级别**：生成 `global.__getAppClassStyle()` 函数
- **组件级别**：通过 `global.currentInject.injectMethods` 注入 `__getClassStyle` 方法

```javascript
if (ctorType === 'app') {
  global.__getAppClassStyle = function(className) {
    if(!__appClassMap) {
      __appClassMap = {classMapCode};
    }
    return global.__GCC(className, __appClassMap, __classCache);
  };
} else {
  global.currentInject.injectMethods = {
    __getClassStyle: function(className) {
      if(!__classMap) {
        __classMap = {classMapCode};
      }
      return global.__GCC(className, __classMap, __classCache);
    }
  };
}
```

---

### 1.2 核心解析逻辑 (style-helper.js)

`getClassMap()` 函数是样式转换的核心，完成 CSS 到 RN 样式对象的转换。

#### 使用 PostCSS 解析 CSS

```javascript
const root = postcss.parse(content, { from: filename })
```

#### 属性转换 (dash2hump)

将 CSS 中划线命名转换为驼峰命名：
- `font-size` → `fontSize`
- `background-color` → `backgroundColor`

#### 单位处理

| 单位 | 处理方式 |
|------|----------|
| `px` | 直接转为数值 |
| `rpx/vw/vh` | 通过 `formatValueName()` 函数动态转换 |
| `hairlineWidth` | 特殊处理为 1 像素边框 |

```javascript
function formatValue (value) {
  const matched = unitRegExp.exec(value)
  if (matched) {
    if (!matched[2] || matched[2] === 'px') {
      value = matched[1]  // 转为数值
      needStringify = false
    } else {
      value = `${formatValueName}(${+matched[1]}, '${matched[2]}')`  // 动态转换
      needStringify = false
    }
  }
}
```

#### 平台规则适配

通过 `getRulesRunner()` 获取平台相关的样式转换规则，处理 RN 不支持的 CSS 属性替换。

#### 选择器支持

- **仅支持单个 class 选择器**（如 `.container`）
- 解析出 class 名称作为 Map 的 key

#### 媒体查询支持

```javascript
// 存储结构
{
  className: {
    _default: { /* 默认样式 */ },
    _media: [
      { options: { minWidth: 320 }, value: { /* 媒体查询样式 */ } }
    ]
  }
}
```

---

### 1.3 运行时样式匹配

生成的代码在运行时通过 `global.__GCC()` 函数完成 class 名称到具体样式的匹配。

---

### 1.4 关键设计点总结

| 特性 | 实现方式 |
|------|----------|
| CSS 解析 | PostCSS + postcss-selector-parser |
| 命名转换 | dash2hump (中划线 → 驼峰) |
| 单位处理 | px 直接转换，rpx/vw/vh 动态计算 |
| 平台适配 | getRulesRunner 规则引擎 |
| 作用域 | 支持 scoped 样式 |
| 媒体查询 | 存储为 `_media` 数组结构 |

**核心思想**：将编译时解析的 CSS 转换为运行时可查的 Map 结构，在运行时根据 class 名称快速查找对应的 RN 样式对象。

---

## 二、getRulesRunner 规则引擎设计

### 2.1 核心设计思想

`getRulesRunner` 是一个**配置驱动的规则匹配引擎**，用于将源平台（微信小程序）的样式/模板/配置转换为目标平台（RN iOS/Android/Harmony）的对应规则。

### 2.2 架构分层

```
┌─────────────────────────────────────────────────────────┐
│                    getRulesRunner                        │
│  (platform/index.js - 工厂函数)                           │
├─────────────────────────────────────────────────────────┤
│                    runRules                               │
│  (platform/run-rules.js - 规则执行器)                    │
├─────────────────────────────────────────────────────────┤
│                    规则集合                               │
│  (platform/style/wx/index.js 等 - 具体转换规则)          │
└─────────────────────────────────────────────────────────┘
```

### 2.3 工厂函数 getRulesRunner

**文件位置**：`platform/index.js`

```javascript
module.exports = function getRulesRunner ({ type, mode, srcMode, ... }) {
  const specMap = {
    template: { wx: require('./template/wx') },
    style: { wx: require('./style/wx') },
    json: { wx: require('./json/wx') }
  }
  const spec = specMap[type] && specMap[type][srcMode] && specMap[type][srcMode]({ warn, error })
  if (spec && spec.supportedModes.indexOf(mode) > -1) {
    return function (input) {
      return runRules(mainRules, input, { mode, ... })
    }
  }
}
```

**职责**：
- 根据 `type`（template/style/json）加载对应的规格定义
- 校验目标 `mode` 是否在支持列表中
- 返回一个**闭包函数**，该函数接收输入并执行规则匹配

### 2.4 规则执行器 runRules

**文件位置**：`platform/run-rules.js`

```javascript
module.exports = function runRules (rules = [], input, options = {}) {
  const { mode, testKey, normalizeTest, waterfall } = options
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]
    const tester = (normalizeTest || defaultNormalizeTest)(rule.test, rule)
    const testInput = testKey ? input[testKey] : input
    const processor = rule[mode]  // 根据 mode 获取对应平台的处理器
    if (tester(testInput) && processor) {
      const result = processor.call(rule, input, data, meta)
      if (result !== undefined) input = result
      if (!(rule.waterfall || waterfall)) break
    }
  }
  return input
}
```

**核心执行流程**：
1. 遍历规则数组
2. 使用 `testKey`（如 `prop`）提取输入中需要匹配的字段
3. 通过 `normalizeTest` 规范化测试条件（支持 RegExp、Function、String）
4. 匹配成功后调用对应 `mode` 的 `processor` 处理输入
5. 支持**瀑布流模式**（waterfall），多个规则依次处理

### 2.5 具体规则定义

**文件位置**：`platform/style/wx/index.js`

规则文件返回一个规格对象，结构如下：

```javascript
module.exports = function getSpec({ warn, error }) {
  return {
    supportedModes: ['rn', 'duck', 'drn', 'harmony'],  // 支持的目标平台

    // 可选：自定义 test 规范化函数
    normalizeTest(input, { mode }) { ... },

    // 主规则数组
    rules: [
      {
        test: 'display',                    // 匹配条件
        rn: function({ prop, value }, data) {
          return { prop: 'display', value: 'none' }
        },
        duck: ...,
        harmony: ...
      },
      // ... 更多规则
    ]
  }
}
```

### 2.6 模式匹配机制

```javascript
function defaultNormalizeTest (rawTest, context) {
  switch (type(rawTest)) {
    case 'Function': return rawTest.bind(context)
    case 'RegExp':   return input => rawTest.test(input)
    case 'String':   return input => rawTest === input
    default:         return () => true
  }
}
```

支持三种测试类型：
- **RegExp**：正则匹配（如 `/^border/`）
- **Function**：自定义判断函数
- **String**：精确匹配属性名

### 2.7 使用示例

```javascript
const rulesRunner = getRulesRunner({
  mode,       // 'rn' / 'duck' / 'drn' / 'harmony'
  srcMode,    // 'wx'
  type: 'style',
  testKey: 'prop',  // 匹配 CSS 属性名
  warn,
  error
})

// 遍历 CSS 声明时调用
let newData = rulesRunner({ prop, value, selector })
```

### 2.8 设计优势

| 特性 | 优势 |
|------|------|
| **配置驱动** | 新增平台只需添加规则文件，无需修改核心逻辑 |
| **规则可组合** | 支持 waterfall 模式，多规则链式处理 |
| **灵活匹配** | RegExp/Function/String 三种匹配方式 |
| **类型安全** | 支持属性值类型校验（color/length/enum） |
| **错误提示** | 支持 warn 和 error 两种错误级别 |
| **平台隔离** | 各平台规则独立定义，互不干扰 |

---

## 三、相关文件索引

| 文件 | 作用 |
|------|------|
| `lib/react/processStyles.js` | 样式编译入口，协调整个编译过程 |
| `lib/react/style-helper.js` | 核心解析逻辑，CSS 转 classMap |
| `lib/platform/index.js` | getRulesRunner 工厂函数 |
| `lib/platform/run-rules.js` | 规则执行器 |
| `lib/platform/style/wx/index.js` | 微信小程序样式转换规则 |
| `lib/utils/shallow-stringify.js` | 对象转字符串工具 |
| `lib/utils/hump-dash.js` | 驼峰中划线转换工具 |

---

## 四、总结

Mpx 跨端样式编译采用 **"编译时解析 + 运行时匹配"** 的设计：

1. **编译时**：通过 PostCSS 解析 CSS，使用规则引擎转换平台差异，生成 classMap
2. **运行时**：通过 `__GCC` 函数根据 class 名称查找对应样式

`getRulesRunner` 规则引擎通过 **工厂函数 + 执行器** 的分离设计，实现了配置与逻辑的解耦，使得新增目标平台只需要添加规则文件即可。
