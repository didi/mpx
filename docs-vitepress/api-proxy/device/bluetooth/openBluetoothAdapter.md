## mpx.openBluetoothAdapter(Object object)

初始化蓝牙模块。

支持情况： 微信、支付宝、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.openBluetoothAdapter.html)

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
			<th>支付宝</th>
			<th>RN</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>mode</td>
			<td>string</td>
			<td>central</td>
			<td>否</td>
			<td>蓝牙模式，可作为主/从设备，仅 iOS 需要。</td>
			<td>2.10.0</td>
			<td><span style="color: red; font-weight: bold;">✗</span></td>
			<td><span style="color: red; font-weight: bold;">✗</span></td>
		</tr>
		<tr>
			<td colspan="8">
				<table style="width:100%">
					<thead>
						<tr>
							<th>合法值</th>
							<th>说明</th>
						</tr>
					</thead>
					<tbody>
						<tr><td>central</td><td>主机模式</td></tr>
						<tr><td>peripheral</td><td>从机（外围设备）模式</td></tr>
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
			<td><span style="color: green; font-weight: bold;">✓</span></td>
			<td><span style="color: green; font-weight: bold;">✓</span></td>
		</tr>
		<tr>
			<td>fail</td>
			<td>function</td>
			<td></td>
			<td>否</td>
			<td>接口调用失败的回调函数</td>
			<td></td>
			<td><span style="color: green; font-weight: bold;">✓</span></td>
			<td><span style="color: green; font-weight: bold;">✓</span></td>
		</tr>
		<tr>
			<td>complete</td>
			<td>function</td>
			<td></td>
			<td>否</td>
			<td>接口调用结束的回调函数（调用成功、失败都会执行）</td>
			<td></td>
			<td><span style="color: green; font-weight: bold;">✓</span></td>
			<td><span style="color: green; font-weight: bold;">✓</span></td>
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
mpx.openBluetoothAdapter({
  success (res) {
    console.log(res)
  }
})
```
