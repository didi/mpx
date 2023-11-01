# 选项式 API

### onAppInit
- **类型：** `Function`
- **详细：**

通过 createApp 注册一个应用期间被调用，输出 web 时 SSR渲染模式下，需要在此钩子中生成 pinia 的实例并返回。


### onSSRAppCreated
- **类型：** `Function`
- **详细：**

SSR渲染定制钩子，在服务端渲染期间被调用，可以在这个钩子中可以去返回应用程序实例，以及完成服务器端路由匹配，store 的状态挂载等。类 Vue 的 server entry 中的功能。

**注意：** 仅 web 环境支持
