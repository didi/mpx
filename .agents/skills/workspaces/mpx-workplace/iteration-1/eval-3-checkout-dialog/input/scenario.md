# 结算弹层复现记录

checkout-dialog.mpx 接收 visible:boolean，包含姓名 input、数字金额 input、可滚动的 30 行费用明细及关闭按钮。蒙层点击关闭，对外发出 close 事件。全局页面可滚动。

现有根 view 设置 disable-scroll=true，蒙层和 scroll-view 都是其子节点。结果支付宝弹层内部也无法滚动。微信希望阻止触摸冒泡引发背景滚动。不要改全局 page 的 overflow。

输入框当前设置 `enableNative="{{__mpx_mode__ === 'ios'}}"`、全平台 `adjust-position=false` 和 `focus="{{visible}}"`。已复现：支付宝 iOS 光标偏移，支付宝 Android 大片留白；微信 Android 自动上推本身正常。RN 和 Web 未出现此问题，保留原有默认键盘处理。

弹层入场动画有可观察的完成回调 enterDone；首次打开后立即 focus 时，支付宝键盘弹起但弹层未上推。不可用固定 300ms 或写死键盘高度掩盖。

旧逻辑：focus 设置 currentField，blur 立即 keyboardOffset=0，keyboardheightchange 直接设置 offset。需覆盖两种事件序列：focus(B)→blur(A)，以及 blur(A)→focus(B)；键盘高度事件可早于 focus，也可能切换输入框时不再发出。最终失焦关闭才复位，切换期间不能闪回底部；自动避让有效时不叠加手动偏移。

size.js 当前返回 `screenHeight - statusBarHeight - 44`，再统一除以 pixelRatio；safeBottom 直接访问 safeArea.bottom。输入样本：windowHeight=700、screenHeight=800、pixelRatio=3、safeArea={bottom:780}，字段均为同一逻辑像素坐标；另一个样本 safeArea=null。弹层最大高度用可用窗口，窗口旋转后重新计算。

输出完整组件及公共 size.js。设备检测能力由 api-proxy 的设备信息入口提供，动画完成回调由组件自身的入场实现连接，不依赖外部未给定 SDK。
