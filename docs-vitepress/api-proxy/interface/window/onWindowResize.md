## mpx.onWindowResize(function listener)

监听窗口尺寸变化事件

支持情况： 微信、RN、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/ui/window/wx.onWindowResize.html)

### 参数

**function listener**\
窗口尺寸变化事件的监听函数

**参数**

**Object res**

### 示例代码

<table>
  <thead>
    <tr>
      <th>属性</th>
      <th>类型</th>
      <th>说明</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td colspan="3"><b>size 结构属性：</b>
        <table style="width:100%">
          <thead>
            <tr><th>结构属性</th><th>类型</th><th>说明</th></tr>
          </thead>
          <tbody>
            <tr><td>windowWidth</td><td>number</td><td>变化后的窗口宽度，单位 px</td></tr>
            <tr><td>windowHeight</td><td>number</td><td>变化后的窗口高度，单位 px</td></tr>
          </tbody>
        </table>
      </td>
    </tr>
  </tbody>
</table>
