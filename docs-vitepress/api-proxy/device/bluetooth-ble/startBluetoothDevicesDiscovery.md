mpx.startBluetoothDevicesDiscovery(Object object)

开始搜寻附近的蓝牙外围设备。此操作比较耗费系统资源，请在搜索并连接到设备后调用 `mpx.stopBluetoothDevicesDiscovery` 停止搜索。

[参考文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth/wx.startBluetoothDevicesDiscovery.html)

### 参数 {#parameters}

**Object object**

| 属性 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| services | string[] | `[]` | 否 | 要搜索的蓝牙设备主服务 UUID 列表。 |
| allowDuplicatesKey | boolean | `false` | 否 | 是否允许重复上报同一设备。 |
| interval | number | `0` | 否 | 上报设备的间隔，单位为 ms。 |
| powerLevel | string | `medium` | 否 | 扫描模式，可选值为 `low`、`medium`、`high`；档位越高，扫描越快、耗电越多。 |
| success | function |  | 否 | 接口调用成功的回调函数。 |
| fail | function |  | 否 | 接口调用失败的回调函数。 |
| complete | function |  | 否 | 接口调用结束的回调函数，成功、失败都会执行。 |

### RN 平台说明 {#rn-platform}

RN Android 和 Harmony 环境会将 `powerLevel` 转换为底层 `react-native-ble-manager` 的扫描模式：

| powerLevel | scanMode | Harmony 扫描模式 |
| --- | --- | --- |
| `low` | `0` | `SCAN_MODE_LOW_POWER` |
| `medium` | `1` | `SCAN_MODE_BALANCED` |
| `high` | `2` | `SCAN_MODE_LOW_LATENCY` |

RN iOS 不支持调整扫描模式，该参数会由底层系统忽略。Harmony 环境需要具备 `SystemCapability.Communication.Bluetooth.Core` 系统能力。

### 示例代码 {#example-code}

```js
mpx.startBluetoothDevicesDiscovery({
  services: [],
  allowDuplicatesKey: true,
  powerLevel: "high",
  success (res) {
    console.log(res)
  }
})
```
