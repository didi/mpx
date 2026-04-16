## mpx.onAppShow(function listener)

监听小程序切前台事件。该事件与 App.onShow 的回调参数一致。

支持情况： 微信、支付宝、RN、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onAppShow.html)

### 参数

**function listener**

小程序切前台事件的监听函数

**参数**


**Object options**\
启动参数

<table>
  <thead>
    <tr>
      <th>属性</th>
      <th>类型</th>
      <th>说明</th>
      <th>最低版本</th>
      <th>支付宝</th>
      <th>RN</th>
      <th>web</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>path</td>
      <td>string</td>
      <td>启动小程序的路径 (代码包路径)</td>
      <td>-</td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td>scene</td>
      <td>number</td>
      <td>启动小程序的场景值</td>
      <td>-</td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td>query</td>
      <td>Record.&lt;string, string&gt;</td>
      <td>启动小程序的 query 参数</td>
      <td>-</td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td>shareTicket</td>
      <td>string</td>
      <td>shareTicket，详见获取更多转发信息</td>
      <td>-</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td>referrerInfo</td>
      <td>Object</td>
      <td>来源信息。从另一个小程序、公众号或 App 进入小程序时返回。否则返回 {}。(参见后文注意)</td>
      <td>-</td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td></td>
    </tr>
    <tr>
      <td colspan="7">
        <table style="width: 100%; margin: 0;">
          <thead>
            <tr>
              <th>结构属性</th>
              <th>类型</th>
              <th>说明</th>
              <th>支付宝</th>
              <th>RN</th>
              <th>web</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>appId</td>
              <td>string</td>
              <td>来源小程序、公众号或 App 的 appId</td>
              <td><span style="color: green; font-weight: bold;">✓</span></td>
              <td><span style="color: red; font-weight: bold;">✗</span></td>
              <td><span style="color: red; font-weight: bold;">✗</span></td>
            </tr>
            <tr>
              <td>extraData</td>
              <td>Object</td>
              <td>来源小程序传过来的数据，scene=1037或1038时支持</td>
              <td><span style="color: green; font-weight: bold;">✓</span></td>
              <td><span style="color: red; font-weight: bold;">✗</span></td>
              <td><span style="color: red; font-weight: bold;">✗</span></td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td>forwardMaterials</td>
      <td>Array.&lt;Object&gt;</td>
      <td>打开的文件信息数组，只有从聊天素材场景打开（scene为1173）才会携带该参数</td>
      <td>-</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td colspan="7">
        <table style="width: 100%; margin: 0;">
          <thead>
            <tr>
              <th>结构属性</th>
              <th>类型</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>type</td>
              <td>string</td>
              <td>文件的mimetype类型</td>
            </tr>
            <tr>
              <td>name</td>
              <td>string</td>
              <td>文件名</td>
            </tr>
            <tr>
              <td>path</td>
              <td>string</td>
              <td>文件路径（如果是webview则是url）</td>
            </tr>
            <tr>
              <td>size</td>
              <td>number</td>
              <td>文件大小</td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td>chatType</td>
      <td>number</td>
      <td>从微信群聊/单聊打开小程序时，chatType 表示具体微信群聊/单聊类型</td>
      <td>-</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td colspan="7">
        <table style="width: 100%; margin: 0;">
          <thead>
            <tr>
              <th>合法值</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>微信联系人单聊</td>
            </tr>
            <tr>
              <td>2</td>
              <td>企业微信联系人单聊</td>
            </tr>
            <tr>
              <td>3</td>
              <td>普通微信群聊</td>
            </tr>
            <tr>
              <td>4</td>
              <td>企业微信互通群聊</td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td>hostExtraData</td>
      <td>Object</td>
      <td>宿主传递的数据，第三方 app 中运行小游戏时返回</td>
      <td>-</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td colspan="7">
        <table style="width: 100%; margin: 0;">
          <thead>
            <tr>
              <th>结构属性</th>
              <th>类型</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>host_scene</td>
              <td>string</td>
              <td>宿主app对应的场景值</td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td>apiCategory</td>
      <td>string</td>
      <td>API 类别</td>
      <td>2.20.0</td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td colspan="7">
        <table style="width: 100%; margin: 0;">
          <thead>
            <tr>
              <th>合法值</th>
              <th>说明</th>
              <th>支付宝</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>default</td>
              <td>默认类别</td>
              <td><span style="color: green; font-weight: bold;">✓</span></td>
            </tr>
            <tr>
              <td>nativeFunctionalized</td>
              <td>原生功能化，视频号直播商品、商品橱窗等场景打开的小程序</td>
              <td><span style="color: red; font-weight: bold;">✗</span></td>
            </tr>
            <tr>
              <td>browseOnly</td>
              <td>仅浏览，朋友圈快照页等场景打开的小程序</td>
              <td><span style="color: red; font-weight: bold;">✗</span></td>
            </tr>
            <tr>
              <td>embedded</td>
              <td>内嵌，通过打开半屏小程序能力打开的小程序</td>
              <td><span style="color: green; font-weight: bold;">✓</span></td>
            </tr>
            <tr>
              <td>chatTool</td>
              <td>聊天工具，通过打开聊天工具能力打开的小程序</td>
              <td><span style="color: red; font-weight: bold;">✗</span></td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  </tbody>
</table>

### 示例代码

```js
const onAppShowHandler = (res) => {
  console.log('onAppShow:', res)
};

mpx.onAppShow(onAppShowHandler)

```