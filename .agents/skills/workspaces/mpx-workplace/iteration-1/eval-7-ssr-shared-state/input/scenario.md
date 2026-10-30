# 共用详情业务新增 SSR

当前 Mpx 工程可构建 wx/ali/ios/android/harmony/web，Web 普通客户端已可用。现在新增 SSR 首屏；页面位于异步普通分包。依赖是工程现有兼容的 Vue2 / vue-server-renderer 和 @mpxjs/pinia，不升级到 Vue3。

旧业务状态：

```js
// stores/detail.js
import { createPinia, defineStore } from '@mpxjs/pinia'
export const pinia = createPinia()
export const useDetail = defineStore('detail', {
  state: () => ({ item: null, loaded: false }),
  actions: {
    async fetchItem (id) {
      if (this.loaded) return
      this.item = await fetchDetail(id)
      this.loaded = true
    }
  }
})
export const detail = useDetail(pinia)
```

app.mpx 已有同步 onAppInit 返回 `{ appMarker:'keep-me' }`，必须保留该根选项。详情页目前只在 async onLoad 中 await detail.fetchItem(id)，模板显示 detail.item.title。

`analytics.web.js` 导入时立刻读取 window.location，并导出 mountAnalytics()。页面当前在顶层静态 import 它，只在调用处判断 __mpx_mode__==='web'。服务端没有 window/document，不能伪造浏览器全局。其他端无需埋点库。

本题数据不含鉴权，`fetchDetail(id): Promise<{id,title}>` 可注入本地异步实现，延迟可控。服务端网络适配接口需说明完整基地址及 Node 可用传输，不能假设浏览器 Cookie 或相对路径自然存在。

验收输入：服务端并发渲染 id=A 与 id=B，两者完成顺序相反，HTML 各含自己的标题。客户端 hydration 不重复请求已恢复的 A；随后同一页面导航到 B 必须加载 B，失败可重试。微信/支付宝/RN 的 onLoad 仍会加载数据。

当前只有普通客户端 webpack 配置和 Node 静态文件服务。补 server/client 差异配置和 renderToString 调用片段，沿用同一 app.mpx、同一页面。使用默认 SSR 入口，不需要自定义 onSSRAppCreated；SSR 页面 URL 从每个 HTTP 请求传入。Web history/base 已正确，无需在本题重新设计。
