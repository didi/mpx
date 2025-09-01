## mpx.onAppHide(function listener)

监听小程序切后台事件。该事件与 App.onHide 的回调参数一致。

支持情况： 微信、支付宝、RN、web、harmony

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onAppHide.html)

### 参数

**function listener**

小程序切前台事件的监听函数

**参数**


**Object options**\
启动参数

<table>
<tr>
<th>属性</th>
<th>类型</th>
<th>说明</th>
<th>最低版本</th>
<th>支付宝</th>
<th>RN/harmony</th>
<th>web</th>
</tr>
<tr>
<td>reason</td>
<td>number</td>
<td>原因</td>
<td>3.5.7</td>
<td><span style="color: red; font-weight: bold;">✗</span></td>
<td><span style="color: green; font-weight: bold;">✓</span></td>
<td><span style="color: red; font-weight: bold;">✗</span></td>
</tr>
<tr>
<td colspan="7">
<table style="width: 100%; margin: 0;">
<tr>
<th>合法值</th>
<th>说明</th>
</tr>
<tr>
<td>0</td>
<td>用户退出小程序</td>
</tr>
<tr>
<td>1</td>
<td>进入其他小程序</td>
</tr>
<tr>
<td>2</td>
<td>打开原生功能页</td>
</tr>
<tr>
<td>3</td>
<td>其他</td>
</tr>
</table>
</td>
</tr>
</table>
