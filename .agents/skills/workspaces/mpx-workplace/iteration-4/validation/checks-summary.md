# 交付后独立验证

ESLint 与六目标（wx/ali/ios/android/harmony/web）单文件编译均在交付后独立执行，结果不回传给执行者。
编译使用 workspaces 顶层 npm 官方源安装的 `@mpxjs/webpack-plugin@2.11.1` 与 `@mpxjs/mpx-cli-service@2.2.32`，App 入口 `app.mpx` 不参与单文件编译。

| Case | 组 | ESLint | 编译异常目标 |
| --- | --- | --- | --- |
| 0 · 构建目标、条件文件与配置归属 | mpx | 0e/0w | — |
| 0 · 构建目标、条件文件与配置归属 | noskill | 0e/0w | ios 1e/0w、android 1e/0w、harmony 1e/0w |
| 1 · 图文布局、间距与样式作用范围 | mpx | 0e/3w | — |
| 1 · 图文布局、间距与样式作用范围 | noskill | 0e/0w | ios 3e/0w、android 3e/0w、harmony 3e/0w |
| 2 · 刷新、吸顶与节点定位 | mpx | 0e/0w | ali 0e/4w、web 0e/2w |
| 2 · 刷新、吸顶与节点定位 | noskill | 0e/0w | wx 1e/0w、ali 1e/0w、ios 1e/0w、android 1e/0w、harmony 1e/0w、web 1e/0w |
| 3 · 弹层、键盘与窗口尺寸 | mpx | 0e/0w | — |
| 3 · 弹层、键盘与窗口尺寸 | noskill | 0e/0w | ali 0e/4w、ios 0e/4w、android 0e/4w、harmony 0e/4w、web 0e/7w |
| 4 · 登录适配、任务句柄与请求取消 | mpx | 0e/1w | — |
| 4 · 登录适配、任务句柄与请求取消 | noskill | 0e/0w | ios 6e/2w、android 6e/2w、harmony 6e/2w、web 0e/2w |
| 5 · 响应式动态组件与首次渲染能力 | mpx | 0e/7w | — |
| 5 · 响应式动态组件与首次渲染能力 | noskill | 39e/0w | — |
| 6 · 路由参数、部署与异步分包 | mpx | 0e/0w | wx 1e/0w、ali 1e/0w、ios 1e/0w、android 1e/0w、harmony 1e/0w、web 1e/0w |
| 6 · 路由参数、部署与异步分包 | noskill | 0e/0w | wx 1e/0w、ali 1e/0w、ios 1e/0w、android 1e/0w、harmony 1e/0w、web 1e/0w |
| 7 · 共享业务的 Web SSR 请求隔离 | mpx | 0e/0w | ios 1e/0w、android 1e/0w、harmony 1e/0w |
| 7 · 共享业务的 Web SSR 请求隔离 | noskill | 0e/0w | — |

单文件/组件编译不等于完整 App、真机、浏览器或 SSR hydration 通过；编译通过也不代表业务行为正确。
