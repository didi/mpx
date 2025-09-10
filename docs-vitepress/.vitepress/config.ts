import { type DefaultTheme, defineConfig } from "vitepress"
import {
    groupIconMdPlugin,
    groupIconVitePlugin,
    localIconLoader,
} from "vitepress-plugin-group-icons"
import llmstxt from "vitepress-plugin-llms"
import { withPwa } from "@vite-pwa/vitepress"
import { transformerTwoslash } from "@shikijs/vitepress-twoslash"
import { localSearchTranslations } from "./theme/translations"

const ogUrl = "https://mpxjs.cn/"
const ogImage = `${ogUrl}logo.png`
const title = "Mpx 框架"
const description = "深度性能优化的增强型小程序开发框架"

const sidebar: DefaultTheme.Sidebar = {
    "/guide/": [
        {
            text: "基础",
            items: [
                { text: "快速开始", link: "/guide/basic/start" },
                { text: "介绍", link: "/guide/basic/intro" },
                { text: "单文件开发", link: "/guide/basic/single-file" },
                { text: "IDE 支持", link: "/guide/basic/ide" },
                { text: "模板语法", link: "/guide/basic/template" },
                { text: "CSS 处理", link: "/guide/basic/css" },
                { text: "数据响应", link: "/guide/basic/reactive" },
                {
                    text: "类名样式绑定",
                    link: "/guide/basic/class-style-binding",
                },
                { text: "条件渲染", link: "/guide/basic/conditional-render" },
                { text: "列表渲染", link: "/guide/basic/list-render" },
                { text: "事件处理", link: "/guide/basic/event" },
                { text: "双向绑定", link: "/guide/basic/two-way-binding" },
                { text: "自定义组件", link: "/guide/basic/component" },
                { text: "获取组件实例/节点信息", link: "/guide/basic/refs" },
                {
                    text: "模版内可选链表达式",
                    link: "/guide/basic/option-chain",
                },
                { text: "生命周期", link: "/guide/basic/lifecycle" },
            ],
        },
        {
            text: "进阶",
            items: [
                { text: "状态管理（store）", link: "/guide/advance/store" },
                { text: "状态管理（pinia）", link: "/guide/advance/pinia" },
                { text: "使用 mixin", link: "/guide/advance/mixin" },
                { text: "使用 npm", link: "/guide/advance/npm" },
                { text: "使用分包", link: "/guide/advance/subpackage" },
                { text: "分包异步化", link: "/guide/advance/async-subpackage" },

                { text: "国际化 i18n", link: "/guide/advance/i18n" },
                { text: "包体积分析", link: "/guide/advance/size-report" },
                { text: "图像资源处理", link: "/guide/advance/image-process" },
                { text: "原生渐进迁移", link: "/guide/advance/progressive" },
                {
                    text: "原生能力兼容",
                    link: "/guide/advance/ability-compatible",
                },
                { text: "小程序插件", link: "/guide/advance/plugin" },
                {
                    text: "自定义路径",
                    link: "/guide/advance/custom-output-path",
                },
                {
                    text: "使用原子类",
                    link: "/guide/advance/utility-first-css",
                },
                { text: "SSR", link: "/guide/advance/ssr" },
                {
                    text: "依赖注入（Provide/Inject）",
                    link: "/guide/advance/provide-inject",
                },
                { text: "编译配置", link: "/guide/advance/build-config" },
            ],
        },
        {
            text: "跨端基础",
            items: [
                { text: "跨端输出配置", link: "/guide/cross-platform/basic" },
                { text: "条件编译机制", link: "/guide/cross-platform/conditional" },
                { text: "平台差异处理", link: "/guide/cross-platform/differences" },
            ],
        },
        {
            text: "组合式 API",
            items: [
                {
                    text: "组合式 API",
                    link: "/guide/composition-api/composition-api",
                },
                {
                    text: "响应式 API",
                    link: "/guide/composition-api/reactive-api",
                },
            ],
        },
        {
            text: "工具",
            items: [
                { text: "使用TypeScript开发小程序", link: "/guide/tool/ts" },
                { text: "单元测试", link: "/guide/tool/unit-test" },
                { text: "E2E自动化测试", link: "/guide/tool/e2e-test" },
            ],
        },
        {
            text: "拓展",
            items: [
                { text: "网络请求", link: "/guide/extend/fetch" },
                { text: "数据 Mock", link: "/guide/extend/mock" },
                { text: "WebView Bridge", link: "/guide/extend/webview-bridge" },
            ],
        },
        {
            text: "理解",
            items: [
                {
                    text: "Mpx运行时增强原理",
                    link: "/guide/understand/runtime",
                },
                { text: "Mpx编译构建原理", link: "/guide/understand/compile" },
            ],
        },
        {
            text: "迁移",
            items: [
                { text: "从 2.8 升级至 2.9", link: "/guide/migrate/2.9" },
                { text: "从 2.7 升级至 2.8", link: "/guide/migrate/2.8" },
                { text: "从旧版本迁移至 2.7", link: "/guide/migrate/2.7" },
                {
                    text: "mpx-cli v2 迁移到 v3",
                    link: "/guide/migrate/mpx-cli-3",
                },
            ],
        },
    ],
    "/rn/": [
        {
            text: "基础",
            items: [
                { text: "快速开始", link: "/rn/basic/start" },
                { text: "基础能力", link: "/rn/basic/basic" },
                { text: "组件使用与开发", link: "/rn/basic/component" },
                { text: "模板语法与生命周期", link: "/rn/basic/template" },
                { text: "跨端样式", link: "/rn/basic/style" },
                { text: "应用能力", link: "/rn/basic/application-api" },

            ],
        },
        {
            text: "进阶",
            items: [
                { text: "混合编写 RN", link: "/rn/advance/hybrid-with-react-native" },
            ],
        },
        {
            text: "生态",
            items: [
                { text: "生态 SDK", link: "/rn/ecosystem/ecosystem-sdk" }
            ]
        },

    ],
    "/api/": [
        {
            text: "运行时 API",
            items: [
                { text: "API 参考", link: "/api/" },
                { text: "全局配置", link: "/api/app-config" },
                { text: "全局 API", link: "/api/global-api" },
                { text: "实例 API", link: "/api/instance-api" },
                { text: "Store API", link: "/api/store-api" },
                { text: "模板指令", link: "/api/directives" },
                { text: "编译构建", link: "/api/compile" },
                { text: "内建组件", link: "/api/builtIn" },
                { text: "响应式 API", link: "/api/reactivity-api" },
                { text: "组合式 API", link: "/api/composition-api" },
                { text: "选项式 API", link: "/api/optional-api" },
                { text: "周边拓展", link: "/api/extend" },
            ],
        },
    ],
    "/api-proxy/": [
        {
            text: "跨端转换 API",
            link: "/api-proxy/index",
            items: [
                {
                    text: "基础",
                    collapsed: true,
                    items: [
                        {
                            text: "base64ToArrayBuffer",
                            link: "/api-proxy/base/base64ToArrayBuffer",
                        },
                        {
                            text: "arrayBufferToBase64",
                            link: "/api-proxy/base/arrayBufferToBase64",
                        },
                        {
                            text: "系统",
                            collapsed: true,
                            items: [
                                {
                                    text: "getSystemInfo",
                                    link: "/api-proxy/base/system/getSystemInfo",
                                },
                                {
                                    text: "getSystemInfoSync",
                                    link: "/api-proxy/base/system/getSystemInfoSync",
                                },
                                {
                                    text: "getWindowInfo",
                                    link: "/api-proxy/base/system/getWindowInfo",
                                },
                                {
                                    text: "getDeviceInfo",
                                    link: "/api-proxy/base/system/getDeviceInfo",
                                },
                            ],
                        },
                        {
                            text: "小程序",
                            collapsed: true,
                            items: [
                                {
                                    text: "生命周期",
                                    collapsed: true,
                                    items: [
                                        {
                                            text: "getEnterOptionsSync",
                                            link: "/api-proxy/base/app/life-cycle/getEnterOptionsSync",
                                        },
                                        {
                                            text: "getLaunchOptionsSync",
                                            link: "/api-proxy/base/app/life-cycle/getLaunchOptionsSync",
                                        },
                                    ],
                                },
                                {
                                    text: "应用级事件",
                                    collapsed: true,
                                    items: [
                                        {
                                            text: "onAppShow",
                                            link: "/api-proxy/base/app/app-event/onAppShow",
                                        },
                                        {
                                            text: "onAppHide",
                                            link: "/api-proxy/base/app/app-event/onAppHide",
                                        },
                                        {
                                            text: "offAppShow",
                                            link: "/api-proxy/base/app/app-event/offAppShow",
                                        },
                                        {
                                            text: "offAppHide",
                                            link: "/api-proxy/base/app/app-event/offAppHide",
                                        },
                                        {
                                            text: "onError",
                                            link: "/api-proxy/base/app/app-event/onError",
                                        },
                                        {
                                            text: "offError",
                                            link: "/api-proxy/base/app/app-event/offError",
                                        },
                                        {
                                            text: "onUnhandledRejection",
                                            link: "/api-proxy/base/app/app-event/onUnhandledRejection",
                                        },
                                        {
                                            text: "offUnhandledRejection",
                                            link: "/api-proxy/base/app/app-event/offUnhandledRejection",
                                        },
                                        {
                                            text: "onLazyLoadError",
                                            link: "/api-proxy/base/app/app-event/onLazyLoadError",
                                        },
                                        {
                                            text: "offLazyLoadError",
                                            link: "/api-proxy/base/app/app-event/offLazyLoadError",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    text: "路由",
                    collapsed: true,
                    items: [
                        { text: "navigateTo", link: "/api-proxy/route/navigateTo" },
                        { text: "redirectTo", link: "/api-proxy/route/redirectTo" },
                        { text: "switchTab", link: "/api-proxy/route/switchTab" },
                        { text: "reLaunch", link: "/api-proxy/route/reLaunch" },
                        { text: "navigateBack", link: "/api-proxy/route/navigateBack" },
                    ],
                },
                {
                    text: "界面",
                    collapsed: true,
                    items: [
                        {
                            text: "交互",
                            collapsed: true,
                            items: [
                                {
                                    text: "showActionSheet",
                                    link: "/api-proxy/interface/interactive/showActionSheet",
                                },
                                {
                                    text: "showModal",
                                    link: "/api-proxy/interface/interactive/showModal",
                                },
                                {
                                    text: "enableAlertBeforeUnload",
                                    link: "/api-proxy/interface/interactive/enableAlertBeforeUnload",
                                },
                                {
                                    text: "disableAlertBeforeUnload",
                                    link: "/api-proxy/interface/interactive/disableAlertBeforeUnload",
                                },
                                {
                                    text: "showToast",
                                    link: "/api-proxy/interface/interactive/showToast",
                                },
                                {
                                    text: "hideToast",
                                    link: "/api-proxy/interface/interactive/hideToast",
                                },
                                {
                                    text: "showLoading",
                                    link: "/api-proxy/interface/interactive/showLoading",
                                },
                                {
                                    text: "hideLoading",
                                    link: "/api-proxy/interface/interactive/hideLoading",
                                },
                            ],
                        },
                        {
                            text: "导航栏",
                            collapsed: true,
                            items: [
                                {
                                    text: "hideHomeButton",
                                    link: "/api-proxy/interface/navigation-bar/hideHomeButton",
                                },
                                {
                                    text: "setNavigationBarTitle",
                                    link: "/api-proxy/interface/navigation-bar/setNavigationBarTitle",
                                },
                                {
                                    text: "setNavigationBarColor",
                                    link: "/api-proxy/interface/navigation-bar/setNavigationBarColor",
                                },
                            ],
                        },
                        {
                            text: "Tab Bar",
                            collapsed: true,
                            items: [
                                {
                                    text: "hideTabBar",
                                    link: "/api-proxy/interface/tab-bar/hideTabBar",
                                },
                                {
                                    text: "showTabBar",
                                    link: "/api-proxy/interface/tab-bar/showTabBar",
                                },
                                {
                                    text: "setTabBarStyle",
                                    link: "/api-proxy/interface/tab-bar/setTabBarStyle",
                                },
                                {
                                    text: "setTabBarItem",
                                    link: "/api-proxy/interface/tab-bar/setTabBarItem",
                                },
                            ],
                        },
                        {
                            text: "下拉刷新",
                            collapsed: true,
                            items: [
                                {
                                    text: "stopPullDownRefresh",
                                    link: "/api-proxy/interface/pull-down-refresh/stopPullDownRefresh",
                                },
                                {
                                    text: "startPullDownRefresh",
                                    link: "/api-proxy/interface/pull-down-refresh/startPullDownRefresh",
                                },
                            ],
                        },
                        {
                            text: "滚动",
                            collapsed: true,
                            items: [
                                {
                                    text: "pageScrollTo",
                                    link: "/api-proxy/interface/scroll/pageScrollTo",
                                },
                            ],
                        },
                        {
                            text: "动画",
                            collapsed: true,
                            items: [
                                {
                                    text: "createAnimation",
                                    link: "/api-proxy/interface/animation/createAnimation",
                                },
                            ],
                        },
                        {
                            text: "自定义组件",
                            collapsed: true,
                            items: [
                                {
                                    text: "nextTick",
                                    link: "/api-proxy/interface/custom-component/nextTick",
                                },
                            ],
                        },
                        {
                            text: "菜单",
                            collapsed: true,
                            items: [
                                {
                                    text: "getMenuButtonBoundingClientRect",
                                    link: "/api-proxy/interface/menu/getMenuButtonBoundingClientRect",
                                },
                            ],
                        },
                        {
                            text: "窗口",
                            collapsed: true,
                            items: [
                                {
                                    text: "onWindowResize",
                                    link: "/api-proxy/interface/window/onWindowResize",
                                },
                                {
                                    text: "offWindowResize",
                                    link: "/api-proxy/interface/window/offWindowResize",
                                },
                            ],
                        },
                    ],
                },
                {
                    text: "网络",
                    collapsed: true,
                    items: [
                        {
                            text: "发起请求",
                            collapsed: true,
                            items: [
                                { text: "request", link: "/api-proxy/network/request/request" },
                            ],
                        },
                        {
                            text: "下载",
                            collapsed: true,
                            items: [
                                {
                                    text: "downloadFile",
                                    link: "/api-proxy/network/download/downloadFile",
                                },
                            ],
                        },
                        {
                            text: "上传",
                            collapsed: true,
                            items: [
                                {
                                    text: "uploadFile",
                                    link: "/api-proxy/network/upload/uploadFile",
                                },
                            ],
                        },
                        {
                            text: "WebSocket",
                            collapsed: true,
                            items: [
                                {
                                    text: "connectSocket",
                                    link: "/api-proxy/network/websocket/connectSocket",
                                },
                            ],
                        },
                    ],
                },
                {
                    text: "支付",
                    collapsed: true,
                    items: [
                        {
                            text: "requestPayment",
                            link: "/api-proxy/payment/requestPayment",
                        },
                    ],
                },
                {
                    text: "数据缓存",
                    collapsed: true,
                    items: [
                        { text: "setStorage", link: "/api-proxy/storage/setStorage" },
                        {
                            text: "setStorageSync",
                            link: "/api-proxy/storage/setStorageSync",
                        },
                        { text: "getStorage", link: "/api-proxy/storage/getStorage" },
                        {
                            text: "getStorageSync",
                            link: "/api-proxy/storage/getStorageSync",
                        },
                        { text: "removeStorage", link: "/api-proxy/storage/removeStorage" },
                        {
                            text: "removeStorageSync",
                            link: "/api-proxy/storage/removeStorageSync",
                        },
                        { text: "clearStorage", link: "/api-proxy/storage/clearStorage" },
                        {
                            text: "clearStorageSync",
                            link: "/api-proxy/storage/clearStorageSync",
                        },
                        {
                            text: "getStorageInfo",
                            link: "/api-proxy/storage/getStorageInfo",
                        },
                        {
                            text: "getStorageInfoSync",
                            link: "/api-proxy/storage/getStorageInfoSync",
                        },
                    ],
                },
                {
                    text: "画布",
                    collapsed: true,
                    items: [
                        {
                            text: "canvasToTempFilePath",
                            link: "/api-proxy/canvas/canvasToTempFilePath",
                        },
                        {
                            text: "canvasGetImageData",
                            link: "/api-proxy/canvas/canvasGetImageData",
                        },
                    ],
                },
                {
                    text: "媒体",
                    collapsed: true,
                    items: [
                        {
                            text: "音频",
                            collapsed: true,
                            items: [
                                {
                                    text: "createInnerAudioContext",
                                    link: "/api-proxy/media/audio/createInnerAudioContext",
                                },
                            ],
                        },
                        {
                            text: "图片",
                            collapsed: true,
                            items: [
                                {
                                    text: "previewImage",
                                    link: "/api-proxy/media/image/previewImage",
                                },
                                {
                                    text: "compressImage",
                                    link: "/api-proxy/media/image/compressImage",
                                },
                                {
                                    text: "getImageInfo",
                                    link: "/api-proxy/media/image/getImageInfo",
                                },
                            ],
                        },
                        {
                            text: "视频",
                            collapsed: true,
                            items: [
                                {
                                    text: "chooseMedia",
                                    link: "/api-proxy/media/video/chooseMedia",
                                },
                            ],
                        },
                    ],
                },
                {
                    text: "位置",
                    collapsed: true,
                    items: [
                        { text: "getLocation", link: "/api-proxy/location/getLocation" },
                        {
                            text: "chooseLocation",
                            link: "/api-proxy/location/chooseLocation",
                        },
                        { text: "openLocation", link: "/api-proxy/location/openLocation" },
                        {
                            text: "onLocationChange",
                            link: "/api-proxy/location/onLocationChange",
                        },
                        {
                            text: "offLocationChange",
                            link: "/api-proxy/location/offLocationChange",
                        },
                        {
                            text: "startLocationUpdate",
                            link: "/api-proxy/location/startLocationUpdate",
                        },
                        {
                            text: "stopLocationUpdate",
                            link: "/api-proxy/location/stopLocationUpdate",
                        },
                    ],
                },
                {
                    text: "开放接口",
                    collapsed: true,
                    items: [
                        {
                            text: "登录",
                            collapsed: true,
                            items: [
                                { text: "login", link: "/api-proxy/open-api/login/login" },
                                {
                                    text: "checkSession",
                                    link: "/api-proxy/open-api/login/checkSession",
                                },
                            ],
                        },
                        {
                            text: "用户信息",
                            collapsed: true,
                            items: [
                                { text: "getUserInfo", link: "/api-proxy/open-api/user-info/getUserInfo" }
                            ],
                        },
                        {
                            text: "设置",
                            collapsed: true,
                            items: [
                                {
                                    text: "getSetting",
                                    link: "/api-proxy/open-api/setting/getSetting",
                                },
                                {
                                    text: "openSetting",
                                    link: "/api-proxy/open-api/setting/openSetting",
                                },
                            ],
                        },
                    ],
                },
                {
                    text: "设备",
                    collapsed: true,
                    items: [
                        {
                            text: "联系人",
                            collapsed: true,
                            items: [
                                {
                                    text: "addPhoneContact",
                                    link: "/api-proxy/device/contacts/addPhoneContact",
                                },
                            ],
                        },
                        {
                            text: "蓝牙-低功耗中心设备",
                            collapsed: true,
                            items: [
                                {
                                    text: "closeBLEConnection",
                                    link: "/api-proxy/device/bluetooth-ble/closeBLEConnection",
                                },
                                {
                                    text: "createBLEConnection",
                                    link: "/api-proxy/device/bluetooth-ble/createBLEConnection",
                                },
                                {
                                    text: "onBLEConnectionStateChange",
                                    link: "/api-proxy/device/bluetooth-ble/onBLEConnectionStateChange",
                                },
                            ],
                        },
                        {
                            text: "剪贴板",
                            collapsed: true,
                            items: [
                                {
                                    text: "setClipboardData",
                                    link: "/api-proxy/device/clipboard/setClipboardData",
                                },
                                {
                                    text: "getClipboardData",
                                    link: "/api-proxy/device/clipboard/getClipboardData",
                                },
                            ],
                        },
                        {
                            text: "网络",
                            collapsed: true,
                            items: [
                                {
                                    text: "getNetworkType",
                                    link: "/api-proxy/device/network/getNetworkType",
                                },
                                {
                                    text: "onNetworkStatusChange",
                                    link: "/api-proxy/device/network/onNetworkStatusChange",
                                },
                                {
                                    text: "offNetworkStatusChange",
                                    link: "/api-proxy/device/network/offNetworkStatusChange",
                                },
                            ],
                        },
                        {
                            text: "屏幕",
                            collapsed: true,
                            items: [
                                {
                                    text: "getScreenBrightness",
                                    link: "/api-proxy/device/screen/getScreenBrightness",
                                },
                                {
                                    text: "setScreenBrightness",
                                    link: "/api-proxy/device/screen/setScreenBrightness",
                                },
                                {
                                    text: "setVisualEffectOnCapture",
                                    link: "/api-proxy/device/screen/setVisualEffectOnCapture",
                                },
                                {
                                    text: "onUserCaptureScreen",
                                    link: "/api-proxy/device/screen/onUserCaptureScreen",
                                },
                                {
                                    text: "offUserCaptureScreen",
                                    link: "/api-proxy/device/screen/offUserCaptureScreen",
                                },
                            ],
                        },
                        {
                            text: "键盘",
                            collapsed: true,
                            items: [
                                {
                                    text: "hideKeyboard",
                                    link: "/api-proxy/device/keyboard/hideKeyboard",
                                },
                                {
                                    text: "onKeyboardHeightChange",
                                    link: "/api-proxy/device/keyboard/onKeyboardHeightChange",
                                },
                                {
                                    text: "offKeyboardHeightChange",
                                    link: "/api-proxy/device/keyboard/offKeyboardHeightChange",
                                },
                            ],
                        },
                        {
                            text: "电话",
                            collapsed: true,
                            items: [
                                {
                                    text: "makePhoneCall",
                                    link: "/api-proxy/device/phone/makePhoneCall",
                                },
                            ],
                        },
                        {
                            text: "扫码",
                            collapsed: true,
                            items: [
                                { text: "scanCode", link: "/api-proxy/device/scan/scanCode" },
                            ],
                        },
                        {
                            text: "震动",
                            collapsed: true,
                            items: [
                                {
                                    text: "vibrateShort",
                                    link: "/api-proxy/device/vibrate/vibrateShort",
                                },
                                {
                                    text: "vibrateLong",
                                    link: "/api-proxy/device/vibrate/vibrateLong",
                                },
                            ],
                        },
                    ],
                },
                {
                    text: "WXML",
                    collapsed: true,
                    items: [
                        {
                            text: "createIntersectionObserver",
                            link: "/api-proxy/wxml/createIntersectionObserver",
                        },
                        {
                            text: "createSelectorQuery",
                            link: "/api-proxy/wxml/createSelectorQuery",
                        },
                    ],
                },
                {
                    text: "第三方平台",
                    collapsed: true,
                    items: [
                        { text: "getExtConfig", link: "/api-proxy/ext/getExtConfig" },
                        {
                            text: "getExtConfigSync",
                            link: "/api-proxy/ext/getExtConfigSync",
                        },
                    ],
                },
            ],
        },
    ],
    "/articles/": [
        {
            text: "文章",
            items: [
                { text: "滴滴开源小程序框架Mpx", link: "/articles/1.0" },
                {
                    text: "Mpx 发布2.0，完美支持跨平台开发",
                    link: "/articles/2.0",
                },
                {
                    text: "小程序框架运行时性能大测评",
                    link: "/articles/performance",
                },
                {
                    text: "小程序开发者，为什么你应该尝试下MPX",
                    link: "/articles/mpx1",
                },
                { text: "Mpx 小程序框架技术揭秘", link: "/articles/mpx2" },
                {
                    text: "滴滴出行小程序体积优化实践",
                    link: "/articles/size-control",
                },
                {
                    text: "使用Typescript新特性Template Literal Types完善链式key的类型推导",
                    link: "/articles/ts-derivation",
                },
                {
                    text: "Mpx2.7 版本正式发布，大幅提升编译构建速度",
                    link: "/articles/2.7-release",
                },
                {
                    text: "Mpx2.8 版本正式发布，使用组合式 api-proxy 开发小程序",
                    link: "/articles/2.8-release",
                },
                {
                    text: "Mpx2.9 版本正式发布，支持原子类、SSR 和包体积优化",
                    link: "/articles/2.9-release",
                },
                {
                    text: "小程序跨端组件库 Mpx-cube-ui 开源啦",
                    link: "/articles/mpx-cube-ui",
                },
                {
                    text: "@mpxjs/cli 插件化改造",
                    link: "/articles/mpx-cli-next",
                },
                {
                    text: "Mpx 小程序单元测试能力建设与实践",
                    link: "/articles/unit-test",
                },
            ],
        },
    ],
}

export default withPwa(
    defineConfig({
        base: "/",
        head: [
            ["link", { rel: "icon", href: "/favicon.ico" }],
            ["link", { rel: "manifest", href: "/manifest.webmanifest" }],
            [
                "script",
                { type: "text/javascript" },
                `(function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "jtvvy52wxy");`,
            ],
            ["meta", { name: "author", content: title }],
            ["meta", { property: "og:type", content: "website" }],
            ["meta", { name: "og:title", content: title }],
            ["meta", { name: "og:description", content: description }],
            ["meta", { property: "og:image", content: ogImage }],
            ["meta", { property: "og:url", content: ogUrl }],
        ],
        title,
        locales: {
            // 如果有其他语言，也可以在这里添加
            // '/zh/': {
            //   prev: '上一页',
            // },
            "/": {
                label: "中文",
                lang: "zh-CN", // 将会被设置为 <html> 的 lang 属性
                title,
                description,
            },
        },
        ignoreDeadLinks: true,
        markdown: {
            theme: {
                light: "github-light",
                dark: "github-dark",
            },
            // @ts-ignore
            codeTransformers: [transformerTwoslash()],
            config(md) {
                md.use(groupIconMdPlugin)
            },
        },
        pwa: {
            base: "/",
            scope: "/",
            registerType: "prompt",
            includeAssets: ["favicon.ico", "logo.png"],
            manifest: {
                name: "Mpx",
                short_name: "Mpx",
                description,
                theme_color: "#ffffff",
                icons: [
                    {
                        src: "https://dpubstatic.udache.com/static/dpubimg/1ESVodfAED/logo.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                ],
            },
            workbox: {
                globPatterns: ["**/*.{css,js,html,svg,png,ico,txt,woff2}"],
                sourcemap: true,
                navigateFallbackDenylist: [/^\/mpx-cube-ui/],
            },
            devOptions: {
                enabled: false,
                suppressWarnings: true,
                navigateFallback: "/",
            },
        },
        themeConfig: {
            // navbar: false,
            search: {
                provider: "local",
                options: {
                    // // apiKey: '7849f511f78afc4383a81f0137a91c0f',
                    // appId: "DZ8S6HN0MP",
                    // apiKey: "a34809e24ae1eb13ca3afc255d0a0cef",
                    // indexName: "mpxjs",
                    // placeholder: "搜索文档",
                    translations: localSearchTranslations,
                },
            },
            logo: "/favicon.ico",
            socialLinks: [{ icon: "github", link: "https://github.com/didi/mpx" }],
            nav: [
                {
                    text: "指南",
                    activeMatch: "^/guide/",
                    items: [
                        {
                            text: "快速开始",
                            activeMatch: "^/guide/start/",
                            link: "/guide/basic/start"
                        },
                        {
                            text: "跨端输出 RN",
                            activeMatch: "^/rn/",
                            link: "/rn/basic/start"
                        },
                    ],
                },
                {
                    text: "API",
                    activeMatch: "^/(api|api-proxy)/",
                    items: [
                        { text: "运行时 API", activeMatch: "^/api/", link: "/api/" },
                        { text: "跨端转换 API", activeMatch: "^/api-proxy/", link: "/api-proxy/" },
                    ],
                },
                {
                    text: "文章",
                    activeMatch: "^/articles/",
                    link: "/articles/",
                },
                {
                    text: "更新记录",
                    activeMatch: "^/releases/",
                    link: "https://github.com/didi/mpx/releases",
                    target: "_blank",
                },
            ],
            outline: {
                level: [2, 3],
                label: "本页目录",
            },
            sidebar,
            darkModeSwitchLabel: "外观",
            sidebarMenuLabel: "菜单",
            returnToTopLabel: "返回顶部",
            langMenuLabel: "语言",
            notFound: {
                title: "页面未找到",
                linkText: "返回首页",
                quote: "😩 抱歉，迷路了～",
            },
            lastUpdated: {
                text: "最后更新于",
                formatOptions: {
                    dateStyle: "short",
                    timeStyle: "short",
                },
            },
            docFooter: {
                prev: "上一页",
                next: "下一页",
            },
        },
        vite: {
            logLevel: "info",
            plugins: [
                llmstxt({
                    customTemplateVariables: {
                        title,
                        description,
                    },
                    ignoreFiles: ["index.md", "api/index.md"],
                }),
                groupIconVitePlugin({
                    customIcon: {
                        ios: "logos:apple",
                        android: "logos:android-icon",
                        harmony: localIconLoader(
                            import.meta.url,
                            "../assets/images/harmonyOS.svg"
                        ),
                    },
                }),
            ],
        },
        // @ts-ignore
        chainWebpack: (config) => {
            // 添加node_modules避免resolve错误
            config.resolve.modules.add("node_modules")
        },
    })
)
