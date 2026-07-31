## mpx.canIUse(string schema)

判断当前环境是否支持指定的 API、对象或方法。

RN 支持情况：支持。RN 下使用静态能力表判断，不会为了检测能力而加载原生模块。

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/base/wx.canIUse.html)

### 参数 {#parameters}

**string schema**\
API、对象或方法的能力描述，写法遵循小程序 `canIUse` 的 `schema` 约定。

RN 静态能力表只收录抹平层已有实际能力的内置 API、对象与方法，不收录 `envError`、空实现或明确未实现的兼容占位能力。该判断不会检测可选原生依赖是否安装、运行时权限是否授予，也不包含通过 `custom` 注入的业务 API。

### 返回值 {#return-value}

**boolean**\
支持返回 `true`，否则返回 `false`。

### 示例代码 {#example-code}

```js
mpx.canIUse('request') // true
mpx.canIUse('RequestTask.abort') // true
mpx.canIUse('RequestTask.onHeadersReceived') // false（RN 暂未实现）
mpx.canIUse('previewImage') // false（RN 暂未实现）
```
