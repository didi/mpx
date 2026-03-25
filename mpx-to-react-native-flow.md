# MPX 文件从编译到渲染输出 React Native 的完整流程

## 一、编译阶段 (Build Time)

### 1. Webpack 入口
```
.mpx 文件 → Webpack → mpx-loader → 编译转换
```

关键文件: `packages/webpack-plugin/lib/loader.js`

### 2. 解析阶段 (Parser)
```
.mpx 文件 → parseComponent() → 提取 template/script/style/json
```

关键文件: `packages/webpack-plugin/lib/parser.js`

### 3. 模板编译 (Template Compiler)
```
template.content → templateCompiler.parse() → AST → gen-node-react.js → React 代码
```

关键文件:
- `packages/webpack-plugin/lib/template-compiler/compiler.js`
- `packages/webpack-plugin/lib/template-compiler/gen-node-react.js`

模板转换逻辑:

```javascript
// gen-node-react.js 核心转换
// wx:if → 三元表达式
condition.exp ? genNode(condition.block) : null

// wx:for → this.__iter() 包装
this.__iter(items, function(item, index) { return ... })

// 组件 → createElement
createElement(getComponent("view"), { className: "xxx" }, children)

// 多根节点 → block 包裹
createElement(getComponent("block"), null, child1, child2)
```

### 4. Script 处理
```
script → processMainScript.js → React 组件定义
```

关键文件: `packages/webpack-plugin/lib/react/processMainScript.js`

生成的组件代码结构:

```javascript
// 编译后的组件结构
global.currentInject = { moduleId: 'xxx' }

Component({
  // 响应式数据
  data: {},
  // 方法
  methods: {},
  // 生命周期
  onLoad() {},
  onShow() {}
})
```

### 5. App 入口处理
```
App → processTemplate.js → AppRegistry.registerComponent()
```

关键文件: `packages/webpack-plugin/lib/react/processTemplate.js`

```javascript
// 输出结构
import { AppRegistry } from 'react-native'

var app = require('./app.mpx?isApp=true').default

AppRegistry.registerComponent('projectName', () => app)
```

### 6. 平台组件映射

微信组件 (view/input/image...) → `@mpxjs/webpack-plugin/lib/runtime/components/react/`

位置: `packages/webpack-plugin/lib/runtime/components/react/`

```
mpx-view.tsx      → React Native View
mpx-text.tsx       → React Native Text
mpx-image.tsx      → React Native Image
mpx-input.tsx      → React Native TextInput
mpx-button.tsx     → React Native Button
mpx-scroll-view   → React Native ScrollView
...
```

## 二、运行时阶段 (Runtime)

### 1. App 创建

```
createApp() → createApp.ios.js
```

位置: `packages/core/src/platform/createApp.ios.js`

```javascript
// React Native App 创建
import { createNativeStackNavigator, NavigationContainer } from './env/navigationHelper'
import MpxNav from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-nav'

export default function createApp(options) {
  const Stack = createNativeStackNavigator()

  // 路由配置
  const pagesMap = currentInject.pagesMap || {}
  const screens = Object.entries(pagesMap).map(([key, item]) => {
    return createElement(Stack.Screen, {
      name: key,
      getComponent: () => item
    })
  })

  // 返回 Navigation 包装的 App
  return createElement(NavigationContainer, null,
    createElement(Stack.Navigator, null, screens)
  )
}
```

### 2. 组件渲染

编译后的组件通过 React 渲染:

```javascript
// 编译后的模板代码示例
render() {
  return createElement(
    getComponent("view"),
    { className: this.data.cls },
    createElement(getComponent("text"), null, this.data.msg)
  )
}
```

### 3. 响应式系统

位置: `packages/core/src/observer/`

```javascript
// 响应式数据绑定
import { reactive } from '../observer/reactive'
import { watch } from '../observer/watch'

// 数据变化 → 触发 re-render
```

## 三、完整流程图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         编译阶段 (Build Time)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  .mpx 源文件                                                            │
│     │                                                                   │
│     ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ mpx-loader (loader.js)                                         │   │
│  │   - parseComponent() 解析模板/脚本/样式/JSON                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│     │                                                                   │
│     ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 模板编译 (template-compiler/compiler.js)                       │   │
│  │   - parse() → AST                                               │   │
│  │   - gen-node-react.js → createElement()                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│     │                                                                   │
│     ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Script 编译 (react/processMainScript.js)                        │   │
│  │   - 生成 React 组件定义                                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│     │                                                                   │
│     ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ App 入口 (react/processTemplate.js)                             │   │
│  │   - AppRegistry.registerComponent()                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         输出 (Output)                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  JS Bundle (React Native)                                              │
│  ├── 编译后的组件代码                                                    │
│  ├── @mpxjs/webpack-plugin/lib/runtime/components/react/               │
│  │     (mpx-view.tsx, mpx-text.tsx, mpx-image.tsx...)                │
│  └── React Native 依赖 (react-native, react-native-reanimated...)     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         运行时 (Runtime)                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ @mpxjs/core                                                      │   │
│  │   ├── createApp.ios.js (React Native App 入口)                  │   │
│  │   │     └── createNativeStackNavigator()                        │   │
│  │   ├── reactive.js (响应式系统)                                    │   │
│  │   └── watch.js (数据监听)                                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│     │                                                                   │
│     ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ React Native 渲染                                                │   │
│  │   createElement(View, props, children) → Native UI               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 四、关键文件汇总

| 阶段 | 文件路径 | 功能 |
|------|----------|------|
| **编译-Loader** | `webpack-plugin/lib/loader.js` | .mpx 文件加载入口 |
| **编译-解析** | `webpack-plugin/lib/parser.js` | 解析 .mpx 文件 |
| **编译-模板** | `webpack-plugin/lib/template-compiler/compiler.js` | 模板编译主逻辑 |
| **编译-React生成** | `webpack-plugin/lib/template-compiler/gen-node-react.js` | 生成 React 代码 |
| **编译-Script** | `webpack-plugin/lib/react/processMainScript.js` | Script 处理 |
| **编译-App** | `webpack-plugin/lib/react/processTemplate.js` | App 入口生成 |
| **编译-组件** | `webpack-plugin/lib/runtime/components/react/mpx-*.tsx` | 微信组件映射 RN |
| **运行-App** | `core/src/platform/createApp.ios.js` | RN App 创建 |
| **运行-响应式** | `core/src/observer/reactive.js` | 响应式系统 |

## 五、核心转换示例

### 源 MPX:
```html
<view wx:if="{{show}}" class="container">
  <text>{{msg}}</text>
</view>
```

### 编译为 React:
```javascript
// 模板部分
this.__show = show
return this.__show
  ? createElement(getComponent("view"), { className: "container" },
      createElement(getComponent("text"), null, this.__i18nMsg)
    )
  : null
```

### 运行时渲染为 React Native:
```javascript
// 最终在 iOS 上渲染为
<View>
  <Text>{msg}</Text>
</View>
```
