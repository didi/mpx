# @mpxjs/webview-bridge

> 为跨小程序平台提供通用的webview-bridge

## Usage

抹平了各端JSSDK方法调用逻辑，统一挂载在webviewBridge对象上提供调用

```js
import webviewBridge from '@mpxjs/webview-bridge'
const { navigateBack, postMessage } = webviewBridge
postMessage({
  data: 'test',
  success (res) {
    console.log('postmessage成功回调, 结果：', res)
  }
})
navigateBack()
```

### 各端支持情况说明
- **微信小程序：**

    提供可调用方法参考微信web-view组件 JSSDK提供能力
    
    [jssdk接口1](https://developers.weixin.qq.com/miniprogram/dev/component/web-view.html) 提供的方法直接调用即可(参考Usage示例)
    
    [jssdk接口2](https://developers.weixin.qq.com/miniprogram/dev/component/web-view.html) 提供的方法需要传入config配置后再调用，webview-bridge提供了对应的config方法，该方法只在微信小程序环境下生效，使用示例如下：
    ```js
    import webviewBridge from '@mpxjs/webview-bridge'
    // 具体传入配置参考微信说明
    webviewBridge.config({
      debug: true,
      appId: '',
      timestamp: '',
      nonceStr: '',
      signature: '',
      jsApiList: []
    })
    // wx.ready在框架内部抹平，直接调用方法即可
    webviewBridge.updateAppMessageShareData({ 
      title: '',
      desc: '',
      link: '',
      imgUrl: '',
      success: function () {
      }
    })
    ```
- **支付宝、百度、QQ、抖音小程序：**

    支持各小程序web-view组件 JSSDK提供的方法，直接调用webviewBridge上挂载的对应方法即可(参考Usage示例)
    
    ::: warning
    各小程序接口1以外的方法提供的不尽相同，在支持多小程序运行的h5调用中，建议调用非通用的方法时，增加判空的容错处理
    :::
    
 - **webapp：** 
 
    微信[jssdk接口1](https://developers.weixin.qq.com/miniprogram/dev/component/web-view.html) 提供的方法可以直接调用webviewBridge上挂载的对应方法(参考Usage示例)
    
    微信[jssdk接口2](https://developers.weixin.qq.com/miniprogram/dev/component/web-view.html) 提供的方法目前只支持getLocation方法的调用
    
     - **getLocation方法使用介绍：** 
     
        小程序转webapp的项目本身没有getLocation的能力，需要在webapp属主中增加getLocation的方法挂载，挂载示例如下：
    
        ```js
           // webapp app.web.js
            ...
            mpx.config.webviewConfig = {
                // 必须在webapp进行挂载否则h5中调用不到getLocation的返回
                apiImplementations: {
                    getLocation () {
                        // 提供一个异步的方法
                    }
                }
            }
            ...
        ```
   
