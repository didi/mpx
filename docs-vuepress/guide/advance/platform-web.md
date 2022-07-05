# 跨平台输出web

从2.3.0版本开始，Mpx 开始支持将已有项目跨平台输出 web 平台中运行的能力，目前输出web能力完备，能够支持直接转换大型复杂项目，我们会持续对输出web的能力进行优化，不断的建全更全面的适用范围和开发体验。

### 技术实现

与小程序平台间的差异相比，web 平台和小程序平台间的差异要大很多，小程序相当于是基于 web 技术的上层封装，所以不同于我们跨平台输出其他小程序平台时以编译转换为主的思路，在输出 web 时，我们更多地采用了封装的方式来抹平组件/Api和底层环境的差异，与当前大部分的跨平台框架相仿。但与当前大部分跨平台框架以 web MVVM 框架为 base 输出到小程序上运行的思路不同，我们是以 Mpx 小程序增强语法为基础输出到 web 中运行，前面说过小程序本身是基于 web 技术进行的实现，小程序-> web 的转换在可行性和兼容性上会好一些。

在具体实现上，Mpx 项目输出到 web 中运行时在组件化和路由层面都是基于Vue生态实现，所以可以将 Mpx 的跨端输出产物整合到既有的 Vue 项目中，或者在条件编译中直接使用 Vue 语法进行 web 端的实现。

### 使用方法

使用 @mpxjs/cli 创建新项目时选择跨平台并选择输出web后，即可生成可输出web的示例项目，运行 `npm run watch:web:serve` ，就会在 dist/web 下输出构建后的 web 项目，并启动静态服务预览运行。

### 支持范围
目前对输出web的通用能力支持已经非常完备，下列表格中显示了当前版本中已支持的能力范围

#### 模板指令
指令名称|是否支持
:----|----
Mustache数据绑定|是
wx:for|是
wx:for-item|是
wx:for-index|是
wx:key|是
wx:if|是
wx:elif|是
wx:else|是
wx:model|是
wx:model-prop|是
wx:model-event|是
wx:model-value-path|是
wx:model-filter|是
wx:class|是
wx:style|是
wx:ref|是
wx:show|是

#### 事件绑定方式

绑定方式|是否支持
:----|----
bind|是
catch|是
capture-bind|是
capture-catch|是

#### 事件名称

事件名称|是否支持
:----|----
tap|是
longpress|是
longtap|是

web同名事件默认全部支持，已支持组件的特殊事件默认为支持，不支持的情况下会在编译时抛出异常

#### 基础组件

组件名称|是否支持|说明
:----|---- |----
audio|是
block|是
button|是
canvas|是
checkbox|是
checkbox-group|是
cover-view|是
form|是
image|是
input|是
movable-area|是
movable-view|是
navigator|是
picker|是
picker-view|是
progress|是
radio|是
radio-group|是
rich-text|是
scroll-view|是|scroll-view 输出 web 底层滚动依赖 [BetterScroll](https://better-scroll.github.io/docs/zh-CN/guide/base-scroll-options.html) 实现，支持额外传入以下属性： <br/><br/>`scroll-options`: object <br/>可重写 BetterScroll 初始化基本配置<br/>若出现无法滚动，可尝试手动传入 `{ observeDOM: true }` <br/><br/> `update-refresh`: boolean <br/>Vue updated 钩子函数触发时，可用于重新计算 BetterScroll<br/><br/>tips: 当使用下拉刷新相关属性时，由于 Vue 数据响应机制的限制，在 web 侧可能出现下拉组件状态无法复原的问题，可尝试在 `refresherrefresh` 事件中，手动将 refresher-triggered 属性值设置为 true
swiper|是|swiper 输出 web 底层滚动依赖 [BetterScroll](https://better-scroll.github.io/docs/zh-CN/guide/base-scroll-options.html) 实现，支持额外传入以下属性： <br/><br/>`scroll-options`: object <br/>可重写 BetterScroll 初始化基本配置<br/>当滑动方向为横向滚动，希望在另一方向保留原生的滚动时，scroll-options 可尝试传入 `{ eventPassthrough: vertical }`，反之可将 eventPassthrough 设置为 `horizontal` 
swiper-item|是
switch|是
slider|是
text|是
textarea|是
video|是
view|是
web-view|是
在项目的app.json 中配置 "style": "v2"启用新版的组件样式，涉及的组件有 button icon radio checkbox switch slider在输出web时也与小程序保持了一致

#### 生命周期

生命周期名称|是否支持
:----|----
onLaunch|是
onLoad|是
onReady|是
onShow|是
onHide|是
onUnload|是
onError|是
created|是
attached|是
ready|是
detached|是
updated|是

#### 应用级事件

应用级事件名称|是否支持
:----|----
onPageNotFound|是
onPageScroll|是
onPullDownRefresh|是
onReachBottom|是
onResize|是
onTabItemTap|是

#### 组件配置


配置项|支持度
:----|----
properties|部分支持，observer不支持，请使用watch代替
data|支持
watch|支持
computed|支持
relations|支持
methods|支持
mixins|支持
pageLifetimes|支持
observers|不支持，请使用watch代替
behaviors|不支持，请使用mixins代替

#### 组件API

api名称|支持度
:----|----
triggerEvent|支持
$nextTick|支持
createSelectorQuery/selectComponent|支持


#### 全局API

api名称|支持度
:----|----
navigateTo|支持
navigateBack|支持
redirectTo|支持
request|支持
connectSocket|支持
SocketTask|支持
EventChannel|支持
createSelectorQuery|支持
base64ToArrayBuffer|支持
arrayBufferToBase64|支持
nextTick|支持
set|支持
setNavigationBarTitle|支持
setNavigationBarColor|支持
setStorage|支持
setStorageSync|支持
getStorage|支持
getStorageSync|支持
getStorageInfo|支持
getStorageInfoSync|支持
removeStorage|支持
removeStorageSync|支持
clearStorage|支持
clearStorageSync|支持
getSystemInfo|支持
getSystemInfoSync|支持
showModal|支持
showToast|支持
hideToast|支持
showLoading|支持
hideLoading|支持
onWindowResize|支持
offWindowResize|支持
createAnimation|支持

#### JSON配置
配置项|是否支持
:----|----
backgroundColor|是
backgroundTextStyle|是
disableScroll|是
enablePullDownRefresh|是
onReachBottomDistance|是
packages|是
pages|是
navigationBarBackgroundColor|是
navigationBarTextStyle|是
navigationBarTitleText|是
networkTimeout|是
subpackages|是
tabBar|是
usingComponents|是

#### 拓展能力
能力|是否支持
:---|---
fetch|是
i18n|是

#### 小程序其他原生能力
能力|支持度
:---|---
wxs|支持
animation|支持组件的animation属性，支持所有animation对象方法(export、step、width、height、rotate、scale、skew、translate等等)
