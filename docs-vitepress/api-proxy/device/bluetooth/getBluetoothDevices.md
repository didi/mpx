## mpx.getBluetoothDevices(Object object)

获取在蓝牙模块生效期间所有搜索到的蓝牙设备。包括已经和本机处于连接状态的设备。

支持情况： 微信、支付宝、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.getBluetoothDevices.html)

### 参数 {#parameters}
**Object object**

| 属性 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| success | function |  | 否 | 接口调用成功的回调函数 |
| fail | function |  | 否 | 接口调用失败的回调函数 |
| complete | function |  | 否 | 接口调用结束的回调函数（调用成功、失败都会执行） |

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
			<td>devices</td>
			<td>Array.&lt;Object&gt;</td>
			<td>搜索到的设备列表</td>
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
						<tr><td>name</td><td>string</td><td>蓝牙设备名称，某些设备可能没有</td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
						<tr><td>deviceId</td><td>string</td><td>蓝牙设备 id</td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
						<tr><td>RSSI</td><td>number</td><td>当前蓝牙设备的信号强度，单位 dBm</td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
						<tr><td>advertisData</td><td>ArrayBuffer</td><td>当前蓝牙设备的广播数据段中的 ManufacturerData 数据段。</td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
						<tr><td>advertisServiceUUIDs</td><td>Array.&lt;string&gt;</td><td>当前蓝牙设备的广播数据段中的 ServiceUUIDs 数据段</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
						<tr><td>localName</td><td>string</td><td>当前蓝牙设备的广播数据段中的 LocalName 数据段</td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
						<tr><td>serviceData</td><td>Object</td><td>当前蓝牙设备的广播数据段中的 ServiceData 数据段</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
						<tr><td>connectable</td><td>boolean</td><td>当前蓝牙设备是否可连接（ Android 8.0 以下不支持返回该值 ）</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
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
// ArrayBuffer转16进度字符串示例
function ab2hex(buffer) {
  var hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function(bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('');
}
mpx.getBluetoothDevices({
  success: function (res) {
    console.log(res)
    if (res.devices[0]) {
      console.log(ab2hex(res.devices[0].advertisData))
    }
  }
})

```
