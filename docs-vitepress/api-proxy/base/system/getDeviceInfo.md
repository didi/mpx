## mpx.getDeviceInfo()

获取设备基础信息

支持情况： 微信、支付宝、web、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/base/system/wx.getDeviceInfo.html)

### 参数

**Object**

| 属性           | 类型   | 说明                                                                                                   | 最低版本 | 支付宝 | RN | web |
|----------------|--------|------------------------------------------------------------------------------------------------------|----------|--------|----|-----|
| abi            | string | 应用（微信APP）二进制接口类型（仅 Android 支持）                                                      |          | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: red; font-weight: bold;">✗</span>  | <span style="color: red; font-weight: bold;">✗</span>   |
| deviceAbi      | string | 设备二进制接口类型（仅 Android 支持）                                                                 | 2.25.1   | <span style="color: red; font-weight: bold;">✗</span>      | <span style="color: red; font-weight: bold;">✗</span>  | <span style="color: red; font-weight: bold;">✗</span>   |
| benchmarkLevel | number | 设备性能等级（仅 Android 支持）。取值为：-2 或 0（该设备无法运行小游戏），-1（性能未知），>=1（设备性能值，该值越高，设备性能越好，目前最高不到50）<br>注意：从基础库3.4.5开始，本返回值停止维护，请使用wx.getDeviceBenchmarkInfo获取设备性能等级 |          | <span style="color: red; font-weight: bold;">✗</span>      | <span style="color: red; font-weight: bold;">✗</span>  | <span style="color: red; font-weight: bold;">✗</span>   |
| brand          | string | 设备品牌                                                                                                |          | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| model          | string | 设备型号。新机型刚推出一段时间会显示unknown，微信会尽快进行适配。                                      |          | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| system         | string | 操作系统及版本                                                                                         |          | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| platform       | string | 客户端平台                                                                                             |          | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> | <span style="color: green; font-weight: bold;">✓</span> |
| cpuType        | string | 设备 CPU 型号（仅 Android 支持）（Tips: GPU 型号可通过 WebGLRenderingContext.getExtension('WEBGL_debug_renderer_info') 来获取） | 2.29.0   | <span style="color: red; font-weight: bold;">✗</span>      | <span style="color: red; font-weight: bold;">✗</span>  | <span style="color: red; font-weight: bold;">✗</span>   |
| memorySize     | string | 设备内存大小，单位为 MB                                                                                | 2.30.0   | <span style="color: red; font-weight: bold;">✗</span>      | <span style="color: red; font-weight: bold;">✗</span>  | <span style="color: red; font-weight: bold;">✗</span>   |


### 示例代码
```js
const deviceInfo = mpx.getDeviceInfo()

console.log(deviceInfo.abi)
console.log(deviceInfo.benchmarkLevel)
console.log(deviceInfo.brand)
console.log(deviceInfo.model)
console.log(deviceInfo.platform)
console.log(deviceInfo.system)
```