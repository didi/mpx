历时4个多月迭代开发，mpx正式成长为2.0版本，在专注提高小程序开发体验的道路上又前进了一大步，感谢相关同学的努力与付出，@pkingwa，@sky-admin，@httpsxiao，@xuehebinglan

## Features

* 完整支持了目前业内已发布的所有小程序平台（微信，支付宝，百度，qq，头条）
* mpx小程序跨平台编译，目前已支持将微信mpx源码编译输出为其余已支持小程序平台目标代码，[点击查看详情](https://didi.github.io/mpx/platform.html#%E8%B7%A8%E5%B9%B3%E5%8F%B0%E7%BC%96%E8%AF%91)
* 小程序原生组件跨平台编译，目前已支持将微信原生组件编译输出为其余已支持小程序平台组件
* api调用跨平台差异抹平`@mpxjs/api-proxy`
* webview bridge跨平台差异抹平`@mpxjs/webview-bridge`
* 深度分包优化，编译过程中进行精准分包资源判断，所有分包only的资源(页面，组件，js module，wxs，template，媒体资源等)都会精确输出到分包目录中
* render函数中完整支持wxs模块，[关于render函数点击查看详情](https://didi.github.io/mpx/understanding/understanding.html#%E6%95%B0%E6%8D%AE%E5%93%8D%E5%BA%94%E4%B8%8E%E6%80%A7%E8%83%BD%E4%BC%98%E5%8C%96)
* 支持模板引入，内联wxs，自定义tabbar，独立分包，workers，云开发等原生能力，进一步完善原生兼容性
* 新增this.$nextTick替换this.updated
* 增强watch能力，支持`a,b`表达式同时监听a和b的变化，回调函数支持方法名字符串
* 优化多实例store中mapStore使用体验
* 新增增强指令`wx:show`，用于处理hidden样式优先级过低及跨平台兼容性问题
