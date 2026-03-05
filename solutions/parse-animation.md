# 抹平 css transition animation 和 reanimated transition animation 的差异

## 问题描述

将 web css 中 transition animation 规范转换成 react-native-reanimated 能支持的 transition（参考文档 https://docs.swmansion.com/react-native-reanimated/docs/category/css-transitions/） 和 animation（参考文档 https://docs.swmansion.com/react-native-reanimated/docs/category/css-animations）

```js
// 输入
parseStyleTransition({
    transtion: 'margin-right 2s,transform 1s',
    transitionTimingFunction: 'ease, cubic-bezier(0.1, 0.7, 1, 0.1)'
})
// 输出
// {
//     transitionProperty: ['marginRight', 'transform'],
//     transitionDuration: ['2s', '1s'],
//     transitionTimingFunction: ['ease', cubicBezier(0.1, 0.7, 1, 0.1)]
// }
// 输入
parseStyleAnimation({
    animationDelay: '5s',
    animation: '3s linear ball-beat, 3s ease-out 5s identifier',
    animationDelay: '5s, 6s'
})
// 输出
// {
//     animationName: ['ball-beat', 'identifier'],
//     animationDuration: ['3s', '3s'],
//     transitionTimingFunction: ['ease', cubicBezier(0.1, 0.7, 1, 0.1)]
//     animationDelay: ['5s', '6s'],
// }
```

## 解决方案

期望输入 style 对象为 css 标准下的 transition 和 animation 规范， 输出为 react-native-reanimated 能支持的 transition（参考文档 https://docs.swmansion.com/react-native-reanimated/docs/category/css-transitions/） 和 animation（参考文档 https://docs.swmansion.com/react-native-reanimated/docs/category/css-animations）

初版实现在`packages/core/src/platform/builtInMixins/parseAnimation.js`中，我帮检查以及补充一下所有场景是否支持完整，并补充对应的单测case
单测 case 场景比如：animation简写解析、animation 与子属性合并、使用 steps, linear, cubic-bezier、时间使用s和ms单位、多动画解析和对应的子属性合并、所有有效枚举值等等
