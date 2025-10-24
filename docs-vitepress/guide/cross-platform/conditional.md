# 条件编译机制

Mpx跨端输出时在框架内针对不同平台的差异进行了大量的转换抹平工作，但框架能做的工作始终是有限的，对于框架无法抹平的部分我们会在编译和运行时进行报错提示，同时提供了完善的跨平台条件编译机制，便于用户自行进行差异化处理，该能力也能够用于实现区分平台进行业务逻辑实现。

Mpx中我们支持了几种维度的条件编译，分别是文件维度、区块维度、代码维度和属性维度，其中，文件维度和区块维度主要用于处理一些大块的平台差异性逻辑，而代码维度和属性维度主要用于处理一些局部简单的平台差异。

## 文件维度条件编译

文件维度条件编译简单的来说就是文件为维度进行跨平台差异代码的编写，例如在微信->支付宝的项目中存在一个业务地图组件map.mpx，由于微信和支付宝中的原生地图组件标准差异非常大，无法通过框架转译方式直接进行跨平台输出，这时你可以在相同的位置新建一个map.ali.mpx，在其中使用支付宝的技术标准进行开发，编译系统会根据当前编译的mode来加载对应模块，当mode为ali时，会优先加载map.ali.mpx，反之则会加载map.mpx。

### 文件命名规则

```
原文件名.平台标识.扩展名
```

支持的平台标识：
- `wx` - 微信小程序
- `ali` - 支付宝小程序
- `swan` - 百度小程序
- `qq` - QQ小程序
- `tt` - 抖音小程序
- `jd` - 京东小程序
- `web` - Web平台
- `ios` - iOS平台
- `android` - Android平台
- `harmony` - 鸿蒙平台

### 示例

```
components/
├── map.mpx              # 默认实现
├── map.ali.mpx          # 支付宝专用实现
├── map.web.mpx          # Web专用实现
└── map.ios.mpx          # iOS专用实现
```

### RN平台文件兜底逻辑

在RN平台（即mode为 ios/android/harmony）中，文件维度的条件编译存在一个兜底逻辑：

- 当编译目标为 `harmony` 平台时，如果找不到 `.harmony.mpx` 文件，会自动兜底查找 `.ios.mpx` 文件
- 当编译目标为 `android` 平台时，如果找不到 `.android.mpx` 文件，也会自动兜底查找 `.ios.mpx` 文件

因此，在开发RN跨端应用时，可以只编写一份 `index.ios.mpx` 文件，它将同时适用于iOS、Android和鸿蒙平台，除非你需要为特定平台提供不同实现。


### 与webpack alias结合使用

文件维度条件编译能够与webpack alias结合使用，对于npm包的文件我们并不方便在原本的文件位置创建.ali的条件编译文件，但我们可以通过webpack alias在相同位置创建一个`虚拟的`.ali文件，并将其指向项目中的其他文件位置。

```js
// 对于npm包中的文件依赖
import npmModule from 'somePackage/lib/index'

// 配置以下alias后，当mode为ali时，会优先加载项目目录中定义的projectRoot/somePackage/lib/index文件
// vue.config.js
module.exports = defineConfig({
  configureWebpack() {
    return {
      resolve: {
        alias: {
          'somePackage/lib/index.ali': path.resolve(__dirname, 'src/adapters/ali/somePackage-index.js')
        }
      }
    }
  }
})
```

## 区块维度条件编译

在.mpx单文件中一般存在template、js、stlye、json四个区块，mpx的编译系统支持以区块为维度进行条件编译，只需在区块标签中添加`mode`属性定义该区块的目标平台即可，示例如下：

```html
<!--编译mode为ali时使用如下区块-->
<template mode="ali">
<!--该区块中的所有代码需采用支付宝的技术标准进行编写-->
  <view>支付宝环境</view>
</template>

<!--其他编译mode时使用如下区块-->
<template>
  <view>其他环境</view>
</template>
```

## 代码维度条件编译

代码维度条件编译主要用于处理一些局部简单的平台差异，用户可以在js代码和template插值中访问`__mpx_mode__`获取当前编译mode，进行平台差异逻辑编写。

除了 `__mpx_mode__` 这个默认插值以外，有别的环境变量需要的话可以在mpx.plugin.conf.js里通过defs进行配置。

### JS代码条件编译

```js
if(__mpx_mode__ === 'ali') {
  // 执行支付宝环境相关逻辑
} else {
  // 执行其他环境相关逻辑
}
```

#### async/await 注意事项

在使用条件编译时，如果涉及到 async/await 语法，需要注意以下问题：

有些开发者会编写如下代码，但会发现编译时 false block 内的模块也会被加载解析：

```js
async function someMethod() { 
  if (__mpx_mode__ === 'ios' || __mpx_mode__ === 'android') { 
    return {} 
  } else{ 
    const mod = await require.async('./index.js?root=main') 
    console.log('mod', mod) 
  } 
} 
```

这是因为经过babel处理之后，async/await 会被处理为 @babel/runtime-corejs3/regenerator 的 switch 语法，从而导致静态分析删除代码失效，false block 内的模块被正常加载索引：

```js
function _someMethod() { 
  _someMethod = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime.mark(function _callee() { 
    var mod; 
    return _regeneratorRuntime.wrap(function _callee$(_context) { 
      while (1) switch (_context.prev = _context.next) { 
        case 0: 
          if (!(__mpx_mode__ === 'ios' || __mpx_mode__ === 'android')) { 
            _context.next = 4; 
            break; 
          } 
          return _context.abrupt("return", {}); 
        case 4: 
          if (!(__mpx_mode__ === 'ali')) { 
            _context.next = 9; 
            break; 
          } 
          _context.next = 7; 
          return require.async('./index.js?root=main'); 
        case 7: 
          mod = _context.sent; 
          console.log('mod', mod); 
        case 9: 
        case "end": 
          return _context.stop(); 
      } 
    }, _callee); 
  })); 
  return _someMethod.apply(this, arguments); 
} 
```

遇到这种情况，可以修改为 if block 整体包裹 async await 语句，或者使用 Promise：

```js
function someMethod() { 
  if (__mpx_mode__ === 'ios' || __mpx_mode__ === 'android') { 
    return {} 
  } else if (__mpx_mode__ === 'ali') { 
    let mod = {} 
    (async () => { 
      mod = await require.async('./index.js?root=main') 
    })(); 
    console.log('mod', mod) 
  } 
}
```

### 模板条件编译

```html
<!--此处的__mpx_mode__不需要在组件中声明数据，编译时会基于当前编译mode进行替换-->
<view wx:if="{{__mpx_mode__ === 'ali'}}">支付宝环境</view>
<view wx:else>其他环境</view>
```

### JSON条件编译

注意，这个依赖JSON的动态方案，得通过name="json"这种方式来编写，其实写的是js代码，最终module.exports导出一个可json化的对象即可：

```html
<script name="json">
const pages = __mpx_mode__ === 'wx' ? [
  'main/xxx',
  'sub/xxx'
] : [
  'test/xxx'
] // 可以为不同环境动态书写配置
module.exports = {
  usingComponents: {
    aComponents: '../xxxxx' // 可以打注释 xxx组件
  }
}
</script>
```

### 样式条件编译

```css
/*
  @mpx-if (__mpx_env__ === 'someEvn')
*/
  /* @mpx-if (__mpx_mode__ === 'wx') */
  .backColor {
    background: green;
  }
  /*
    @mpx-elif (__mpx_mode__ === 'qq')
  */
  .backColor {
    background: black;
  }
  /* @mpx-endif */

  /* @mpx-if (__mpx_mode__ === 'swan') */
  .backColor {
    background: cyan;
  }
  /* @mpx-endif */
  .textSize {
    font-size: 18px;
  }
/*
  @mpx-else
*/
.backColor {
  /* @mpx-if (__mpx_mode__ === 'swan') */
  background: blue;
  /* @mpx-else */
  background: red;
  /* @mpx-endif */
}
/*
  @mpx-endif
*/
```

## 属性维度条件编译

属性维度条件编译允许用户在组件上使用 `@` 和 `|` 符号来指定某个节点或属性只在某些平台下有效。

对于同一个 button 组件，微信小程序支持 `open-type="getUserInfo"`，但是支付宝小程序支持 `open-type="getAuthorize" `。如果不使用任何维度的条件编译，则在编译的时候会有警告和报错信息。

比如业务中需要通过 button 按钮获取用户信息，虽然可以使用代码维度条件编译来解决，但是增加了很多代码量：

```html
<button
  wx:if="{{__mpx_mode__ === 'wx' || __mpx_mode__ === 'swan'}}"
  open-type="getUserInfo"
  bindgetuserinfo="getUserInfo">
  获取用户信息
</button>

<button
  wx:elif="{{__mpx_mode__ === 'ali'}}"
  open-type="getAuthorize"
  scope="userInfo"
  onTap="onTap">
  获取用户信息
</button>
```

而用属性维度的编译则方便很多：

```html
<button
  open-type@wx|swan="getUserInfo"
  bindgetuserinfo@wx|swan="getUserInfo"
  open-type@ali="getAuthorize"
  scope@ali="userInfo"
  onTap@ali="onTap">
  获取用户信息
</button>
```

属性维度的编译也可以对整个节点进行条件编译，例如只想在支付宝小程序中输出某个节点：

```html
<view @ali>this is view</view>
```
需要注意使用上述用法时，节点自身在构建时框架不会对节点属性进行平台语法转换，但对于其子节点，框架并不会继承父级节点 mode，会进行正常跨平台语法转换。
```html
<!--错误示例-->
<view @ali bindtap="otherClick">
    <view bindtap="someClick">tap click</view>
</view>
<!--srcMode 为 wx 跨端输出 ali 结果为-->
<view @ali bindtap="otherClick">
    <view onTap="someClick">tap click</view>
</view>
```
上述示例为错误写法，假如srcMode为微信小程序，用上述写法构建输出支付宝小程序时，父节点 bindtap 不会被转为 onTap，在支付宝平台执行时事件会无响应。

正确写法如下：
```html
<!--正确示例-->
<view @ali onTap="otherClick">
    <view bindtap="someClick">tap click</view>
</view>
<!--输出 ali 产物-->
<view @ali onTap="otherClick">
    <view onTap="someClick">tap click</view>
</view>
```
有时开发者期望使用 @ali 这种方式仅控制节点的展示，保留节点属性的平台转换能力，为此 Mpx 实现了一个隐式属性条件编译能力

```html
<!--srcMode为 wx，输出 ali 时，bindtap 会被正常转换为 onTap-->
<view @_ali bindtap="someClick">test</view>
```
在对应的平台前加一个_，例如@_ali、@_swan、@_tt等，使用该隐式规则仅有条件编译能力，节点属性语法转换能力依旧。

有时候我们不仅需要对节点属性进行条件编译，可能还需要对节点标签进行条件编译。

为此，我们支持了一个特殊属性 `mpxTagName`，如果节点存在这个属性，我们会在最终输出时将节点标签修改为该属性的值，配合属性维度条件编译，即可实现对节点标签进行条件编译，例如在百度环境下希望将某个 view 标签替换为 cover-view，我们可以这样写：

```html
<view mpxTagName@swan="cover-view">will be cover-view in swan</view>
```

## 通过 env 实现自定义目标环境的条件编译{#use-env}

除了基于平台标识（mode）的条件编译外，Mpx 还支持通过自定义环境变量（env）实现在不同业务环境下编译产出不同的代码。这使得我们可以在同一平台下为不同的业务场景提供差异化实现。

### 配置自定义环境变量

在实例化 MpxWebpackPlugin 时，通过配置 env 参数来指定目标环境：

```javascript
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      srcMode: 'wx', // srcMode为mpx编译的源码平台，目前仅支持wx
      plugin: {
        env: "didi" // env为mpx编译的目标环境，需自定义
      }
    }
  }
})
```

### 文件维度条件编译与 env

在文件维度条件编译中，可以结合 mode 和 env 来命名文件，编译系统会根据当前编译的 mode 和 env 来加载对应模块。

例如，在一个微信转支付宝的项目中，如果地图组件在不同业务环境中也有差异，可以创建如下文件：

```
components/
├── map.mpx              # 默认实现
├── map.ali.mpx          # 支付宝通用实现
└── map.ali.qingju.mpx   # 支付宝青桔业务环境实现
```

加载优先级如下：
- 当 mode 为 ali，env 为 qingju 时，优先加载 map.ali.qingju.mpx
- 如果找不到特定 env 的文件，则加载 map.ali.mpx
- 如果都找不到，则加载默认的 map.mpx

### 区块维度条件编译与 env

在 .mpx 单文件的区块中，可以同时使用 `mode` 和 `env` 属性来定义条件编译，优先级从高到低如下：

```html
<!--编译mode为ali且env为didi时使用，优先级最高-->
<template mode="ali" env="didi">
  <view>支付宝滴滴环境专用模板</view>
</template>

<!--编译mode为ali时使用-->
<template mode="ali">
  <view>支付宝通用模板</view>
</template>

<!--编译env为didi时使用-->
<template env="didi">
  <view>滴滴业务环境通用模板</view>
</template>

<!--其他环境使用-->
<template>
  <view>默认模板</view>
</template>
```

注意：如果定义了多个具有相同 mode 和 env 的区块，默认会使用最后一个。

### 代码维度条件编译与 env

在代码中，可以通过访问 `__mpx_env__` 获取当前编译环境，与 `__mpx_mode__` 的用法相同：

```js
if (__mpx_env__ === 'didi') {
  // 滴滴业务环境相关逻辑
} else if (__mpx_env__ === 'qingju') {
  // 青桔业务环境相关逻辑
} else {
  // 其他业务环境逻辑
}
```

### 属性维度条件编译与 env

env 属性维度条件编译使用 `:` 符号与 mode 进行组合，格式为 `attr@mode:env:env|mode:env`。当只有 env 条件时，需要添加 `:` 前缀，如 `attr@:env`。

```html
<!-- 仅在 env 为 didi 时生效的属性 -->
<button open-type@:didi="getUserInfo">获取用户信息</button>

<!-- 在 mode 为 wx 且 env 为 didi 或 qingju 时生效的属性 -->
<button open-type@wx:didi:qingju="getUserInfo">获取用户信息</button>

<!-- 仅在 env 为 didi 时显示的节点 -->
<view @:didi>仅在滴滴业务环境显示</view>

<!-- 在 env 为 didi 时改变节点标签 -->
<view mpxTagName@:didi="cover-view">在滴滴业务环境中变为 cover-view</view>
```

当只声明了 env 而没有声明 mode 时，跨平台输出时框架会对节点属性进行正常转换：

```html
<!--srcMode为wx，跨平台输出ali时，bindtap会被转为onTap-->
<view @:didi bindtap="someClick">this is a view component</view>
<view bindtap@:didi="someClick">this is a view component</view>
```

通过结合使用 mode 和 env 的条件编译，我们可以更精细地控制代码在不同平台和不同业务环境下的行为，实现真正的一套代码多端多环境运行。

