import { createAnimation as createAnimationApi } from './animation'
import { useRef, useState, useEffect } from 'react'
import { Animated, Easing, StyleSheet } from 'react-native'
// 微信 timingFunction 和 RN Easing 对应关系
const EasingKey = {
  linear: Easing.linear,
  ease: Easing.ease,
  'ease-in': Easing.in(Easing.ease),
  'ease-in-out': Easing.inOut(Easing.ease),
  'ease-out': Easing.out(Easing.ease)
  // 'step-start': '', // Todo
  // 'step-end': ''
}
// 动画默认初始值
const InitialValue = {
  translateX: 0,
  translateY: 0,
  translateZ: 0,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  scaleX: 0,
  scaleY: 0,
  scaleZ: 0,
  skewX: 0,
  skewY: 0
  // matrix
  // matrix3d
  // opacity: 1,
  // backgroundColor
  // width
  // height
  // top
  // right
  // bottom
  // left
}

export default function useAnimationHooks<T, P>(props: P) {
  let animationStyle = useRef({}).current
  // 分步动画
  let steps = []
  // 动画属性Val
  let rulesMap = new Map()
  const {
    style = [],
    animation = []
  } = props
  const styleObj = StyleSheet.flatten(style)
  if (!animation.length) return animationStyle

  // 测试模拟兜底 start
  // const animationInstance = createAnimationApi({
  //   duration: 500,
  //   style: {
  //     width: 10,
  //     height: 10,
  //     opacity: 0
  //   }
  // })
  // animationInstance.width(100).width(200).height(200).rotateZ(360).step().width(100).height(100).rotateZ(-360).opacity(1).step();
  // animationInstance.width(100).width(200).height(200).rotateZ(-90).step().width(100).height(100).rotateZ(-180).opacity(1).step();
  // animationInstance.width(100).height(100).opacity(1).rotateZ(-90).step().translateX(100).rotateY(180).step();
  // const animation = animationInstance.export()
  // 测试模拟兜底 end

  const isDeg = (key) => ['rotateX', 'rotateY', 'rotateZ', 'skewX', 'skewY'].includes(key)

  /** format rules */
  const formatRules = (rules, { delay, duration, timingFunction }, isTransform = false) => {
    return [...rules.entries()].reduce((arr, [key, value]) => {
      const initialVal = styleObj[key] === undefined ? InitialValue[key] : styleObj[key]
      if (initialVal === undefined) {
        console.error(`style rule ${key} 初始值为空`)
        return arr
      }
      if (!rulesMap.has(key)) {
        const animated = new Animated.Value(initialVal) // useRef().current
        rulesMap.set(key, animated)
        const styleVal = isDeg(key) ?  animated.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg']
        }) : animated
        if (isTransform) {
          const transformStyle = animationStyle.transform || []
          transformStyle.push({
            [key]: styleVal
          })
          // animationStyle.transform = transformStyle
          Object.assign(animationStyle, {
            transform: transformStyle
          })
        } else {
          Object.assign(animationStyle, {
            [key]: styleVal
          })
        }
      }
      const animated = rulesMap.get(key)
      arr.push(Animated.timing(animated, {
        toValue: value,
        duration,
        delay,
        easing: EasingKey[timingFunction]
      }))
      return arr
    }, [])
  }

  /** 创建动画 */
  const createAnimation = () => {
    if (!steps.length) {
      steps =  animation.map(({ animatedOption, rules, transform }) => {
        // 设置 transformOrigin
        Object.assign(animationStyle, {
          transformOrigin: animatedOption.transformOrigin
        })
        // 获取属性动画实例
        const parallels = [];
        const styleAnimation = formatRules(rules, animatedOption)
        parallels.push(...styleAnimation)
        const transformAnimation = formatRules(transform, animatedOption, true)
        parallels.push(...transformAnimation)
        return Animated.parallel(parallels)
      })
    }
    Animated.sequence(steps).start(({ finished }) => {
      console.error('is finished ?', finished) // Todo
    });
  }
  createAnimation()
  // animation 变更后清空之前的动画属性
  // useEffect(() => {
  //   steps = []
  // }, [animation])
  return animationStyle
}
