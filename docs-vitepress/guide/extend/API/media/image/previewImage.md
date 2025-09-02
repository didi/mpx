## mpx.previewImage(Object object)

在新页面中全屏预览图片。预览的过程中用户可以进行保存图片、发送给朋友等操作。

支持情况： 微信、支付宝、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/media/image/wx.previewImage.htmll)

### 参数

**Object object**


<table>
  <thead>
    <tr>
      <th>属性</th>
      <th>类型</th>
      <th>默认值</th>
      <th>必填</th>
      <th>说明</th>
      <th>最低版本</th>
      <th>支付宝</th>
      <th>Web</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>urls</td>
      <td>Array&lt;string&gt;</td>
      <td></td>
      <td>是</td>
      <td>需要预览的图片链接列表。2.2.3 起支持云文件ID。</td>
      <td></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td>showmenu</td>
      <td>boolean</td>
      <td>true</td>
      <td>否</td>
      <td>是否显示长按菜单。</td>
      <td>2.13.0</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td>current</td>
      <td>string</td>
      <td>urls 的第一张</td>
      <td>否</td>
      <td>当前显示图片的链接</td>
      <td></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td>referrerPolicy</td>
      <td>string</td>
      <td>no-referrer</td>
      <td>否</td>
      <td>origin: 发送完整的referrer; no-referrer: 不发送。格式固定为 https://servicewechat.com/{{appid}}/{{version}}/page-frame.html，其中 {{appid}} 为小程序的 appid，{{version}} 为小程序的版本号，版本号为 0 表示为开发版、体验版以及审核版本，版本号为 devtools 表示为开发者工具，其余为正式版本；</td>
      <td>2.13.0</td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
      <td><span style="color: red; font-weight: bold;">✗</span></td>
    </tr>
    <tr>
      <td>success</td>
      <td>function</td>
      <td></td>
      <td>否</td>
      <td>接口调用成功的回调函数</td>
      <td></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td>fail</td>
      <td>function</td>
      <td></td>
      <td>否</td>
      <td>接口调用失败的回调函数</td>
      <td></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
    <tr>
      <td>complete</td>
      <td>function</td>
      <td></td>
      <td>否</td>
      <td>接口调用结束的回调函数（调用成功、失败都会执行）</td>
      <td></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
      <td><span style="color: green; font-weight: bold;">✓</span></td>
    </tr>
  </tbody>
</table>


### 示例代码
```js
mpx.previewImage({
  current: '', // 当前显示图片的http链接
  urls: [] // 需要预览的图片http链接列表
})
```