## mpx.getBLEDeviceCharacteristics(Object object)

获取蓝牙低功耗设备某个服务中所有特征 (characteristic)。

支持情况： 微信、支付宝、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.getBLEDeviceCharacteristics.html)

### 参数 {#parameters}
**Object object**

| 属性 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| deviceId | string | | 是 | 蓝牙设备 id。需要已经通过 wx.createBLEConnection 建立连接 |
| serviceId | string | | 是 | 蓝牙服务 UUID。需要先调用 wx.getBLEDeviceServices 获取 |
| success | function | | 否 | 接口调用成功的回调函数 |
| fail | function | | 否 | 接口调用失败的回调函数 |
| complete | function | | 否 | 接口调用结束的回调函数（调用成功、失败都会执行）|

### object.success 回调函数
**参数**
**Object res**

<table>
	<thead>
		<tr>
			<th>属性</th>
			<th>类型</th>
			<th>说明</th>
			<th>支付宝</th>
			<th>RN</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>characteristics</td>
			<td>Array.&lt;Object&gt;</td>
			<td>设备特征列表</td>
			<td><span style="color: green; font-weight: bold;">✓</span></td>
			<td><span style="color: green; font-weight: bold;">✓</span></td>
		</tr>
		<tr>
			<td colspan="5">
				<table style="width:100%">
					<thead>
						<tr>
							<th>结构属性</th>
							<th>类型</th>
							<th>说明</th>
							<th>支付宝</th>
							<th>RN</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>uuid</td>
							<td>string</td>
							<td>蓝牙设备特征的 UUID</td>
							<td><span style="color: green; font-weight: bold;">✓</span></td>
							<td><span style="color: green; font-weight: bold;">✓</span></td>
						</tr>
						<tr>
							<td>properties</td>
							<td>Object</td>
							<td>该特征支持的操作类型</td>
							<td><span style="color: green; font-weight: bold;">✓</span></td>
							<td><span style="color: green; font-weight: bold;">✓</span></td>
						</tr>
						<tr>
							<td colspan="5">
								<table style="width:100%">
									<thead>
										<tr>
											<th>结构属性</th>
											<th>类型</th>
											<th>说明</th>
											<th>支付宝</th>
											<th>RN</th>
										</tr>
									</thead>
									<tbody>
										<tr><td>read</td><td>boolean</td><td>该特征是否支持 read 操作</td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
										<tr><td>write</td><td>boolean</td><td>该特征是否支持 write 操作</td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
										<tr><td>notify</td><td>boolean</td><td>该特征是否支持 notify 操作</td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
										<tr><td>indicate</td><td>boolean</td><td>该特征是否支持 indicate 操作</td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
										<tr><td>writeNoResponse</td><td>boolean</td><td>该特征是否支持无回复写操作</td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
										<tr><td>writeDefault</td><td>boolean</td><td>该特征是否支持有回复写操作</td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: red; font-weight: bold;">✗</span></td></tr>
									</tbody>
								</table>
							</td>
						</tr>
					</tbody>
				</table>
			</td>
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
mpx.getBLEDeviceCharacteristics({
  // 这里的 deviceId 需要已经通过 wx.createBLEConnection 与对应设备建立链接
  deviceId,
  // 这里的 serviceId 需要在 wx.getBLEDeviceServices 接口中获取
  serviceId,
  success (res) {
    console.log('device getBLEDeviceCharacteristics:', res.characteristics)
  }
})
```