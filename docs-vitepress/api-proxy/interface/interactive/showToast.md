## mpx.showToast(Object object)

显示消息提示框

支持情况： 微信、支付宝、web、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/ui/interaction/wx.showToast.html)

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
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>title</td>
      <td>string</td>
      <td></td>
      <td>是</td>
      <td>提示的内容</td>
      <td></td>
    </tr>
    <tr>
        <td>icon</td>
        <td>string</td>
        <td>success</td>
        <td>否</td>
        <td>图标</td>
        <td></td>
      </tr>
      <tr>
        <td colspan="6">
          <table>
            <thead>
              <tr>
                <th>合法值</th>
                <th>说明</th>
                <th>最低版本</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>success</td>
                <td>显示成功图标，此时 title 文本最多显示 7 个汉字长度</td>
                <td></td>
              </tr>
              <tr>
                <td>error</td>
                <td>显示失败图标，此时 title 文本最多显示 7 个汉字长度</td>
                <td>2.14.1</td>
              </tr>
              <tr>
                <td>loading</td>
                <td>显示加载图标，此时 title 文本最多显示 7 个汉字长度</td>
                <td></td>
              </tr>
              <tr>
                <td>none</td>
                <td>不显示图标，此时 title 文本最多可显示两行，1.9.0及以上版本支持</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </td>
    </tr>
    <tr>
      <td>image</td>
      <td>string</td>
      <td></td>
      <td>否</td>
      <td>自定义图标的本地路径，image 的优先级高于 icon</td>
      <td>1.1.0</td>
    </tr>
    <tr>
      <td>duration</td>
      <td>number</td>
      <td>1500</td>
      <td>否</td>
      <td>提示的延迟时间</td>
      <td></td>
    </tr>
    <tr>
      <td>mask</td>
      <td>boolean</td>
      <td>false</td>
      <td>否</td>
      <td>是否显示透明蒙层，防止触摸穿透</td>
      <td></td>
    </tr>
    <tr>
      <td>success</td>
      <td>function</td>
      <td></td>
      <td>否</td>
      <td>接口调用成功的回调函数</td>
      <td></td>
    </tr>
    <tr>
      <td>fail</td>
      <td>function</td>
      <td></td>
      <td>否</td>
      <td>接口调用失败的回调函数</td>
      <td></td>
    </tr>
    <tr>
      <td>complete</td>
      <td>function</td>
      <td></td>
      <td>否</td>
      <td>接口调用结束的回调函数（调用成功、失败都会执行）</td>
      <td></td>
    </tr>
  </tbody>
</table>


### 示例代码

```js
mpx.showToast({
  title: '成功',
  icon: 'success',
  duration: 2000
})
```
