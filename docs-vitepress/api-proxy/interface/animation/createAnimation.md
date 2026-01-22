## [Animation](https://developers.weixin.qq.com/miniprogram/dev/api/ui/animation/Animation.html) mpx.createAnimation(Object object)

创建一个动画实例 animation。调用实例的方法来描述动画。最后通过动画实例的 export 方法导出动画数据传递给组件的 animation 属性。

支持情况： 微信、支付宝、web、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/ui/animation/wx.createAnimation.html)

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
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>duration</td>
      <td>number</td>
      <td>400</td>
      <td>否</td>
      <td>动画持续时间，单位 ms</td>
    </tr>
    <tr>
      <td>timingFunction</td>
      <td>string</td>
      <td>'linear'</td>
      <td>否</td>
      <td>动画的效果</td>
    </tr>
    <tr>
      <td colspan="5">
        <table style="width: 100%; margin: 0;">
        <thead>
          <tr>
          <th>合法值</th>
          <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr>
          <td>'linear'</td>
          <td>动画从头到尾的速度是相同的</td>
          </tr>
          <tr>
          <td>'ease'</td>
          <td>动画以低速开始，然后加快，在结束前变慢</td>
          </tr>
          <tr>
          <td>'ease-in'</td>
          <td>动画以低速开始</td>
          </tr>
          <tr>
          <td>'ease-in-out'</td>
          <td>动画以低速开始和结束</td>
          </tr>
          <tr>
          <td>'ease-out'</td>
          <td>动画以低速结束</td>
          </tr>
          <tr>
          <td>'step-start'</td>
          <td>动画第一帧就跳至结束状态直到结束</td>
          </tr>
          <tr>
          <td>'step-end'</td>
          <td>动画一直保持开始状态，最后一帧跳到结束状态</td>
          </tr>
          </tbody>
        </table>
      </td>
    </tr>
    <tr>
    <td>delay</td>
    <td>number</td>
    <td>0</td>
    <td>否</td>
    <td>动画延迟时间，单位 ms</td>
    </tr>
    <tr>
    <td>transformOrigin</td>
    <td>string</td>
    <td>'50% 50% 0'</td>
    <td>否</td>
    <td>-</td>
    </tr>
  </tbody>
</table>	

**返回值**

[Animation](https://developers.weixin.qq.com/miniprogram/dev/api/ui/animation/Animation.html)
