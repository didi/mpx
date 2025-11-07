## mpx.getLaunchOptionsSync()

获取本次应用启动时的参数

支持情况： 微信、支付宝、RN、web

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/miniapp/api/diffapi/getLaunchOptionsSync.html)

### 返回值

| 参数   | 类型   | 说明                                   |
| ------ | ------ | -------------------------------------- |
| path   | string | 启动的路径 (代码包路径)                |
| scene  | string | 启动的场景值，返回 1168，含义可查看场景值 |
| query  | number | 启动的 query 参数                      |
