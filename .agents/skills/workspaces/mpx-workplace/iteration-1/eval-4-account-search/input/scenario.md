# 登录与搜索

微信 Skyline/WebView、支付宝、RN ios/android/harmony、Web 浏览器均使用同一账号页。api-proxy 已启用 usePromise:true。微信和支付宝分别有 POST /session/wx 与 /session/ali，参数均为 {code}，但只能兑换相应宿主授权码。

RN 和 Web 没有内置 login 适配。本题提供本地 auth-host 模块契约：`signIn(): Promise<{token:string}>`，RN 三端和 Web 均已由工程封装好，取消时 reject。请提供可替换的本地 stub 便于演示，不联系真实服务。若通过 custom 注册 login，实现须以 `{code:string}` 成功结果对齐页面调用，并明确 token 的后端交换协议；更简单的方式是把宿主登录作为独立 session 能力返回 token，避免将 token 假冒 code。要求至少通过 custom 注册一个 `getSession(): Promise<{token:string}>` 扩展供页面统一调用。

当前模块错误片段：

```js
mpx.use(apiProxy, { usePromise: true, custom: { ios: { getSession: authHost.signIn } } })
const { code } = await mpx.login()
await exchange('/session/wx', code)
const result = await mpx.request({ url: 'https://api.example.test/search', data: { q } })
currentTask = result
// 取消按钮执行 currentTask.abort()
```

搜索输入先 q=A 后 q=B，测试传输可让 B 先成功、A 后成功；用户取消或离开页面后 A 仍可能晚到。只允许当前查询写入结果和 loading 状态；取消不显示网络错误。跨域服务已允许浏览器来源，不把 CORS 配置作为本题待修复点。

详情页沿用已初始化的独立 xfetch 实例。旧实现 `new CancelToken()` 后将实例直接作为 cancelToken，取消执行 token.abort()；页面每次进入注册响应拦截器，离开用 interceptors.response.eject(id)。响应拦截器需要对业务 code 非0 reject，正常响应透传；必须可释放本次注册，不能删除其他页面拦截器。

为便于离线验证，提供本地请求 stub 或注入接口，以脚本复现乱序响应、取消和正常错误。真实传输仍保持 api-proxy / xfetch 契约。
