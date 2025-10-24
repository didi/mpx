## mpx.getMenuButtonBoundingClientRect()

获取菜单按钮（右上角胶囊按钮）的布局位置信息。坐标信息以屏幕左上角为原点。

支持情况： 微信、支付宝

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/ui/menu/wx.getMenuButtonBoundingClientRect.html)

### 返回值

**Object**\
菜单按钮的布局位置信息

| 属性  | 类型   | 说明                 |
| ----- | ------ | -------------------- |
| width | number | 宽度，单位：px       |
| height| number | 高度，单位：px       |
| top   | number | 上边界坐标，单位：px |
| right | number | 右边界坐标，单位：px |
| bottom| number | 下边界坐标，单位：px |
| left  | number | 左边界坐标，单位：px |


### 示例代码

```js
const res = mpx.getMenuButtonBoundingClientRect()

console.log(res.width)
console.log(res.height)
console.log(res.top)
console.log(res.right)
console.log(res.bottom)
console.log(res.left)
```
