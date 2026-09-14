## mpx.writeBLECharacteristicValue(Object object)

向蓝牙低功耗设备特征值中写入二进制数据。注意：必须设备的特征支持 write 才可以成功调用。

支持情况： 微信、支付宝、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.writeBLECharacteristicValue.html)

### 参数 {#parameters}
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
			<td>deviceId</td>
			<td>string</td>
			<td></td>
			<td>是</td>
			<td>蓝牙设备 id</td>
			<td></td>
		</tr>
		<tr>
			<td>serviceId</td>
			<td>string</td>
			<td></td>
			<td>是</td>
			<td>蓝牙特征对应服务的 UUID</td>
			<td></td>
		</tr>
		<tr>
			<td>characteristicId</td>
			<td>string</td>
			<td></td>
			<td>是</td>
			<td>蓝牙特征的 UUID</td>
			<td></td>
		</tr>
		<tr>
			<td>value</td>
			<td>ArrayBuffer</td>
			<td></td>
			<td>是</td>
			<td>蓝牙设备特征对应的二进制值</td>
			<td></td>
		</tr>
		<tr>
			<td>writeType</td>
			<td>string</td>
			<td></td>
			<td>否</td>
			<td>蓝牙特征值的写模式设置，有两种模式，iOS 优先 write，安卓优先 writeNoResponse 。（基础库 2.22.0 开始支持）</td>
			<td></td>
		</tr>
		<tr>
			<td colspan="6">
				<table style="width:100%">
					<thead>
						<tr>
							<th>合法值</th>
							<th>说明</th>
						</tr>
					</thead>
					<tbody>
						<tr><td>write</td><td>强制回复写，不支持时报错</td></tr>
						<tr><td>writeNoResponse</td><td>强制无回复写，不支持时报错</td></tr>
					</tbody>
				</table>
			</td>
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

### 错误 {#error}

| 错误码 | 错误信息 | 说明 | 支付宝 | RN |
| --- | --- | --- | --- | --- |
| 0 | ok | 正常 | **<span style="color: red;">✗</span>** | **<span style="color: green;">✓</span>** |
| -1 | already connect | 已连接 | **<span style="color: red;">✗</span>** | **<span style="color: red;">✗</span>** |
| 10000 | not init | 未初始化蓝牙适配器 | **<span style="color: green;">✓</span>** | **<span style="color: green;">✓</span>** |
| 10001 | not available | 当前蓝牙适配器不可用 | **<span style="color: green;">✓</span>** | **<span style="color: red;">✗</span>** |
| 10002 | no device | 没有找到指定设备 | **<span style="color: green;">✓</span>** | **<span style="color: red;">✗</span>** |
| 10003 | connection fail | 连接失败 | **<span style="color: green;">✓</span>** | **<span style="color: red;">✗</span>** |
| 10004 | no service | 没有找到指定服务 | **<span style="color: green;">✓</span>** | **<span style="color: red;">✗</span>** |
| 10005 | no characteristic | 没有找到指定特征 | **<span style="color: green;">✓</span>** | **<span style="color: red;">✗</span>** |
| 10006 | no connection | 当前连接已断开 | **<span style="color: green;">✓</span>** | **<span style="color: red;">✗</span>** |
| 10007 | property not support | 当前特征不支持此操作 | **<span style="color: green;">✓</span>** | **<span style="color: red;">✗</span>** |
| 10008 | system error | 其余所有系统上报的异常 | **<span style="color: green;">✓</span>** | **<span style="color: red;">✗</span>** |
| 10009 | system not support | Android 系统特有，系统版本低于 4.3 不支持 BLE | **<span style="color: green;">✓</span>** | **<span style="color: red;">✗</span>** |
| 10012 | operate time out | 连接超时 | **<span style="color: green;">✓</span>** | **<span style="color: red;">✗</span>** |
| 10013 | invalid_data | 连接 deviceId 为空或者是格式不正确 | **<span style="color: green;">✓</span>** | **<span style="color: red;">✗</span>** |

### 示例代码 {#example-code}

```js
// 向蓝牙设备发送一个0x00的16进制数据
let buffer = new ArrayBuffer(1)
let dataView = new DataView(buffer)
dataView.setUint8(0, 0)

mpx.writeBLECharacteristicValue({
  // 这里的 deviceId 需要在 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
  deviceId,
  // 这里的 serviceId 需要在 getBLEDeviceServices 接口中获取
  serviceId,
  // 这里的 characteristicId 需要在 getBLEDeviceCharacteristics 接口中获取
  characteristicId,
  // 这里的value是ArrayBuffer类型
  value: buffer,
  success (res) {
    console.log('writeBLECharacteristicValue success', res.errMsg)
  }
})
```
