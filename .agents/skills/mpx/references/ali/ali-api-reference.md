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

跨端代码用 `@mpxjs/api-proxy` 命名导出，或[安装后调用 `mpx.*`](../base/api-reference.md#接入与调用)；直接调用 `my.*` 则遵循支付宝契约。异步结果从 `success` 或开启 Promise 化后的成功结果读取，不假设 `complete` 具有相同字段。

## 系统信息与尺寸

### 系统信息 API 的适配边界

| API | 限制 |
| --- | --- |
| `getWindowInfo` | `safeArea` / `screenTop` 可能缺失或为 null，使用前检查 |
| `getDeviceInfo` | 不支持 `deviceAbi`、`benchmarkLevel`、`cpuType`，不据此判断设备能力 |
| `getLaunchOptionsSync` / `getEnterOptionsSync` | 依赖宿主提供接口，为缺少启动 / 进入参数设计降级 |

### 区分屏幕高度与可用窗口高度

- **布局用窗口尺寸**：优先 `windowHeight`，不再扣固定导航栏高度；`screenHeight`、`statusBarHeight`、`titleBarHeight`、`safeArea` 含义不同，不能直接替代。
- **真机核对口径**：安全区与屏幕数据须同坐标、同单位，尤其核对 Android；不因尺寸异常就统一除以 `pixelRatio`，也不只信开发者工具。
- **统一公共入口**：能力检测、尺寸归一 / 校验和缓存放在公共封装，已有封装统一复用；窗口变化后刷新缓存。

```js
import { getWindowInfo } from '@mpxjs/api-proxy'

const info = getWindowInfo()
this.pageHeight = info.windowHeight
this.safeBottom = info.safeArea
  ? Math.max(0, info.screenHeight - info.safeArea.bottom)
  : 0
```

示例的 `0` 仅表示缺失安全区时不加额外间距，有安全区设计要求时须在公共封装中明确处理。

## 节点查询

### SelectorQuery 与相交观察

- `query.in(component): SelectorQuery` 的 `component` 必填，须为具有 `createSelectorQuery` 方法的组件实例；返回该实例创建的查询对象，继续使用返回值链式调用，不能回到旧查询。选择器、查询字段与结果回调见[节点查询契约](../base/api-reference.md#createselectorquery)。
- `createIntersectionObserver(component, options?): IntersectionObserver` 的 `options` 默认 `{}`，选项和观察器方法见[相交观察契约](../base/api-reference.md#createintersectionobserver)。支付宝忽略首个参数，仍须把选项放在第二个参数；不支持用首个参数限定组件作用域，组件内观察需适配并验证范围。
- `fields`、`node` 等方法使用前核对宿主支持。

### 自定义组件布局查询

无需统一包一层 `view`。查询异常时先核对作用域、渲染状态与目标，仅在确认包装能解决问题时添加。

## 请求、登录与提示

签名沿用 [API 基准](../base/api-reference.md)；`request`、`showModal` 等微信专属选项仍须核对支付宝支持。定制参数 / 返回值使用 `custom.ali`。

| API | 差异与限制 |
| --- | --- |
| `login` | `code` 为支付宝授权码，须对接支付宝登录后端，不能交给微信后端兑换 |
| `showToast` | 核对支付宝 `icon` 取值，依赖特定效果时真机验证 |
| `hideToast` / `hideLoading` | 不支持 success/fail/complete 参数，不依赖回调收尾 |
| `hideHomeButton` | 仅隐藏返回首页入口，其他导航控件另核对宿主能力 |
