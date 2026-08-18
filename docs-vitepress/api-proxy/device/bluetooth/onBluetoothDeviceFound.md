## mpx.onBluetoothDeviceFound(function listener)

监听搜索到新设备的事件

支持情况： 微信、支付宝、RN

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.onBluetoothDeviceFound.html)

### 参数 {#parameters}

**function listener**

搜索到新设备的事件监听函数（多次 `onBluetoothDeviceFound` 注册时，后一次会覆盖前一次）。

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
			<td>新搜索到的设备列表</td>
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
						<tr><td>serviceData</td><td>Object</td><td>当前蓝牙设备的广播数据段中的 ServiceData 数据段</td><td><span style="color: green; font-weight: bold;">✓</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
						<tr><td>connectable</td><td>boolean</td><td>当前蓝牙设备是否可连接（ Android 8.0 以下不支持返回该值 ）</td><td><span style="color: red; font-weight: bold;">✗</span></td><td><span style="color: green; font-weight: bold;">✓</span></td></tr>
					</tbody>
				</table>
			</td>
		</tr>
	</tbody>
</table>

### 示例代码 {#example-code}
```js
function ab2hex(buffer) {
  var hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function(bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('');
}
mpx.onBluetoothDeviceFound(function(res) {
  var devices = res.devices;
  console.log('new device list has founded')
  console.dir(devices)
  console.log(ab2hex(devices[0].advertisData))
})
```