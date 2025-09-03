# webview-bridge
Mpx 在支持小程序跨平台开发后，各大平台的小程序均提供了 Webview 组件，允许通过 WebView 打开 H5 页面，并借助小程序提供的 API 实现 H5 与小程序之间的通信及部分小程序能力的调用。但不同平台为 WebView 提供的 API 存在差异。

例如，在微信小程序中，H5 页面需使用 wx.miniProgram.navigateTo 实现向小程序页面的跳转，而在支付宝中则需调用 my.navigateTo。这意味着开发者若想实现跨平台兼容，就必须为不同平台编写多套对应的逻辑代码。

为解决这一问题，Mpx 提供了一个抹平各平台差异的 Bridge 库：@mpxjs/webview-bridge。使用该库后，开发者只需统一调用一套接口，即可在多个小程序平台上实现一致的功能调用，有效降低开发复杂度和维护成本。

**支持运行环境**：微信小程序、支付宝小程序、QQ小程序、头条小程序、百度小程序、web、RN

## 安装：
```shell
npm install @mpxjs/webview-bridge
```

## 使用：
```js
import mpx from '@mpxjs/webview-bridge'
mpx.navigateBack()
mpx.env // 输出：wx/qq/ali/baidu/tt
mpx.checkJSApi()
```

## cdn地址引用：
```js
<!-- 开发环境版本，方便调试 -->
<script src="https://dpubstatic.udache.com/static/dpubimg/D2JeLyT0_Y/2.2.43.webviewbridge.js"></script>

<!-- 生产环境版本，压缩了体积 -->
<script src="https://dpubstatic.udache.com/static/dpubimg/PRg145LZ-i/2.2.43.webviewbridge.min.js"></script>


<!-- 同时支持 ES Module 引入的 -->
// index.html
<script type="module" src="https://dpubstatic.udache.com/static/dpubimg/6MQOo-ocI4/2.2.43.webviewbridge.esm.browser.min.js"></script>
// main.js
import mpx from "https://dpubstatic.udache.com/static/dpubimg/6MQOo-ocI4/2.2.43.webviewbridge.esm.browser.min.js"

//ES Module 开发版本地址： https://dpubstatic.udache.com/static/dpubimg/cdhpNhmWmJ/2.2.43.webviewbridge.esm.browser.js
```

## 支持方法：
对于web-view组件打开的网页，想要跟宿主环境通信，或者跳转到宿主环境的页面页面，提供了以下能力

| 方法名           | 说明                                          | 微信 | 支付宝 | QQ | 头条 | 百度 | web | RN |
|---------------|---------------------------------------------|------|-------|----|------|------|-----|----|
| navigateTo    | 保留当前webview页面，跳转RN页面                        | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| navigateBack  | 关闭当前页面，返回上一页或多级RN页面                         | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| switchTab        | 跳转到RN的 tabBar 页面                            | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| reLaunch        | 关闭所有页面，打开到应用内的某个RN页面                        | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| redirectTo        | 关闭当前页面，跳转到应用内的某个RN页面                        | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| config        | 微信小程序中h5调用扩展能力配置方法：用于初始化微信 JS-SDK，使 H5 页面具备调用微信原生能力的权限。                        | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> |
| invoke        | JSBridge能力调用（仅web和RN支持）                        | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: red; font-weight: bold;">✗</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |

### webview-bridge示例代码
```javascript
import webviewBridge from '@mpxjs/webview-bridge'
webviewBridge.navigateTo({
  url: 'RN地址',
  success: () => {
    console.log('跳转成功')
  }
})
```

### invoke示例代码
在业务场景中，当 H5 需要调用类似微信小程序的能力（如通过 getLocation 获取地理位置）时，需与承载 H5 的「宿主环境」（如原生 App、小程序容器等）进行数据交互。

针对这类需求，Mpx 框架内部已提供「宿主环境能力挂载」机制，同时在 webview-bridge 中支持 invoke 通信方法，可实现 H5 与宿主环境的双向调用。

宿主环境环境中挂载getLocation
```javascript
import mpx from '@mpxjs/core'
...
// 普通方法
if (__mpx_mode__ === 'ios') {
  mpx.config.rnConfig.webviewConfig = { // RN环境
    apiImplementations: {
      getLocation:  (options = {}) => {
        return {
          latitude: 0,
          longitude: 0
        }
      }
    }
  }
} else {
  mpx.config.webConfig.webviewConfig = { // web环境
    apiImplementations: {
      getLocation:  (options = {}) => {
        return {
          latitude: 0,
          longitude: 0
        }
      }
    }
  }
}

// 或者promise

if (__mpx_mode__ === 'ios') {
  mpx.config.rnConfig.webviewConfig = { // RN环境
    apiImplementations: {
      getLocation: (options = {}) => {
        return new Promise((resolve, reject) => {
          const { params = {} } = options
          if (params.text) {
            resolve({
              latitude: 0,
              longitude: 0
            })
          } else {
            reject(new Error('没有传text参数'))
          }
        })
      }
    }
  }
} else {
  mpx.config.webConfig.webviewConfig = { // web环境
    apiImplementations: {
      getLocation:  (options = {}) => {
        return new Promise((resolve, reject) => {
          const { params = {} } = options
          if (params.text) {
            resolve({
              latitude: 0,
              longitude: 0
            })
          } else {
            reject(new Error('没有传text参数'))
          }
        })
      }
    }
  }
}
```

h5中调用getLocation
```javascript
import webviewBridge from '@mpxjs/webview-bridge'
webviewBridge.invoke('getLocation', {
  params: {
    text: '我是入参'
  },
  success: (res) => {
    console.log('接收到的消息：', res.latitude)
  }
})
```

> ⚠️ **注意**：
> 此处内容涉及平台兼容性或重要使用限制，请务必仔细阅读并根据实际平台环境进行适配。
> - `@mpxjs/webview-bridge`只能在h5环境中引入，不能在小程序等宿主环境使用

