# 支付宝环境 API 实践

API 接入、参数与返回值契约见 [环境 API 基准](../base/api-reference.md)。本页补充系统信息、节点查询及常用 API 的支付宝适配与限制，不是完整的支付宝 API 或字段支持表；未收录的 API 按工程版本核实。

适用范围见 [支付宝入口](./index.md#适用范围)。

## 目录

- [调用入口](#调用入口)
- [系统信息与尺寸](#系统信息与尺寸)
  - [系统信息 API 的适配边界](#系统信息-api-的适配边界)
  - [区分屏幕高度与可用窗口高度](#区分屏幕高度与可用窗口高度)
- [节点查询](#节点查询)
  - [SelectorQuery 与相交观察](#selectorquery-与相交观察)
  - [自定义组件布局查询](#自定义组件布局查询)
- [请求、登录与提示](#请求登录与提示)

## 调用入口

跨端代码使用 `@mpxjs/api-proxy` 的命名导出，或按 [接入与调用](../base/api-reference.md#接入与调用) 安装后调用 `mpx.*`，参数与返回值沿用基准用法。本页只列出需要业务处理的差异与限制；直接调用 `my.*` 时需遵循支付宝原生 API 契约。

需要读取异步 API 结果时，使用 `success` 回调或开启 Promise 化后的成功结果；不要假设 `complete` 收到的对象与成功结果具有相同字段。

## 系统信息与尺寸

### 系统信息 API 的适配边界

| API | 用户需处理的限制 |
| --- | --- |
| `getWindowInfo` | `safeArea` / `screenTop` 可能缺失或为 null；使用前检查，不能假定一定为完整对象或数值。 |
| `getDeviceInfo` | `deviceAbi`、`benchmarkLevel`、`cpuType` 不支持；业务不要依赖这些字段判断设备能力。 |
| `getLaunchOptionsSync` / `getEnterOptionsSync` | 仅在宿主提供对应接口时可用；为缺少启动或进入参数的情况设计降级逻辑。 |

页面高度优先使用返回的 `windowHeight`，不要再扣除固定导航栏高度；涉及 Android 屏幕尺寸时仍需核对单位与真机表现。

### 区分屏幕高度与可用窗口高度

`screenHeight`、`windowHeight`、`statusBarHeight`、`titleBarHeight` 与 `safeArea` 表达的尺寸不同，不能直接把屏幕高度当成页面可用高度。尺寸与单位需在目标真机上核对，不能只以开发者工具的数据为准。

**❌ 避免：**将原始 `screenHeight` 直接赋给页面高度，或看到异常就对所有设备统一除以 `pixelRatio`。

```js
const { screenHeight } = mpx.getSystemInfoSync()
this.pageHeight = screenHeight
```

**✅ 推荐：**页面布局优先使用 `getWindowInfo` 返回的 `windowHeight`，并在公共系统信息封装中统一处理能力检测、尺寸校验与必要的兼容逻辑。

```js
import { getWindowInfo } from '@mpxjs/api-proxy'

const windowInfo = getWindowInfo()
this.pageHeight = windowInfo.windowHeight

// safeArea 可能缺失；screenHeight 与 safeArea.bottom 需处于相同坐标和单位口径。
this.safeBottom = windowInfo.safeArea
  ? Math.max(0, windowInfo.screenHeight - windowInfo.safeArea.bottom)
  : 0
```

项目需要 Android 屏幕尺寸归一、有效性校验与缓存时，应在公共系统信息封装中统一处理。

若项目已有该类封装，应统一从公共入口取值。缓存的尺寸在窗口变化后需重新获取；缺失安全区时的 `0` 仅表示示例未增加额外间距，实际设计有安全区要求时应在公共封装中明确处理。

## 节点查询

### SelectorQuery 与相交观察

- `query.in(component)` 要求传入具有 `createSelectorQuery` 方法的组件实例；继续使用返回值链式调用，不要忽略它后再操作旧查询。
- `createIntersectionObserver(component, options)` 不支持通过第一个 `component` 参数限定组件作用域；依赖组件内观察时需单独适配并验证选择范围。

使用 `fields`、`node` 等查询方法前需核对支付宝宿主支持情况。

### 自定义组件布局查询

自定义组件布局查询无需统一增加一层 `view`。查询异常时，先检查查询作用域、节点是否渲染及目标是否正确；仅在确认包装节点能解决具体问题后添加。

## 请求、登录与提示

调用签名沿用 [API 基准](../base/api-reference.md)，仅在业务依赖下列差异时进行适配。`request`、`showModal` 等 API 的微信专属选项仍需核对支付宝支持情况。

| API | 用户需处理的差异与限制 |
| --- | --- |
| `login` | 返回的 `code` 是支付宝授权码，需对接支付宝登录后端，不能交给微信登录后端兑换。 |
| `showToast` | `icon` 取值需核对支付宝支持情况；依赖特定图标效果时，在支付宝端验证并按需适配。 |
| `hideToast` / `hideLoading` | 不支持 success/fail/complete 参数；不要依赖这些回调完成业务收尾。 |
| `hideHomeButton` | 仅用于隐藏返回首页入口；其他导航控件的显隐需单独核对宿主能力。 |

需要定制 API 参数或返回数据时，按 [API 基准](../base/api-reference.md) 配置 `custom.ali`。
