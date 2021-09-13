import Animation from './animation'

const createAnimation = function (options = {}) {
  // timingFunction 修改为easing
  options = Object.assign({
    duration: 400,
    timingFunction: 'linear',
    delay: 0,
    transformOrigin: '50% 50% 0'
  }, options)
  return new Animation(options)
}
// tennon需要返回的是一个对象
// 基础动画
// {
//   duration: 5000,
//   repeatCount: -1,
//   easing: "linear",
//   onStart: () => {console.log('Basic Animation Start!')},
//   onEnd: () => {console.log('Basic Animation End!')},
//   styles: {
//     position: {
//       x: '100hm',
//       y: 0
//     },
//     opacity: 0.8
//   }
// }
// 关键帧动画
// {
//   duration: 5000, // 动画持续时间，单位 ms
//   repeatCount: -1, // 重复的次数
//   easing: "linear",
//   onStart: () => {console.log('Frame Animation Start!')},
//   onEnd: () => {console.log('Frame Animation End!')},
//   keyframes: [{
//     styles: {
//       position: {
//         x: '100hm',
//         y: 0
//       },
//       opacity: 0.8
//     },
//     percent: 0.5
//   }, {
//     styles: {
//       position: {
//         x: '200hm',
//         y: 0
//       },
//       opacity: 1
//     },
//     percent: 1
//   }]
// }
// 次序动画
// {
//   steps: [{
//     duration: 5000,
//     repeatCount: 1,
//     easing: "linear",
//     onStart: () => {console.log('Animation Start!')},
//     onEnd: () => {console.log('Animation End!')},
//     styles: {
//       position: {
//         x: '100hm',
//         y: 0
//       },
//       opacity: 0.8
//     }
//   }, {
//     duration: 5000,
//     repeatCount: 1,
//     easing: "linear",
//     onStart: () => {console.log('Animation Start!')},
//     onEnd: () => {console.log('Animation End!')},
//     styles: {
//       position: {
//         x: '200hm',
//         y: 0
//       },
//       opacity: 0.8
//     }
//   }]
// }

export {
  createAnimation
}
