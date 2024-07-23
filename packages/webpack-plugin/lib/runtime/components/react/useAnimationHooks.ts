import { useRef } from 'react'
import { Animated, Easing, StyleSheet } from 'react-native'
// 微信 timingFunction 和 RN Easing 对应关系
const EasingKey = {
  linear: Easing.linear,
  ease: Easing.ease,
  'ease-in': Easing.in(Easing.ease),
  'ease-in-out': Easing.inOut(Easing.ease),
  'ease-out': Easing.out(Easing.ease),
  'step-start': '',
  'step-end': ''
}
// 动画默认初始值
const InitialValue = {
  // matrix: 0,
  // matrix3d: 0,
  rotate: 0,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  // rotate3d:[0,0,0]
  scale: 1,
  // scale3d: [1, 1, 1],
  scaleX: 1,
  scaleY: 1,
  // scaleZ: 1,
  skew: 0,
  skewX: 0,
  skewY: 0,
  translate: 0,
  // translate3d: 0,
  translateX: 0,
  translateY: 0,
  // translateZ: 0,
  opacity: 0,
  // backgroundColor: 0,
  width: 0,
  height: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0
}

export default function useAnimationHooks<T, P>() {
  let rulesMap = new Map()

  const isDeg = key => ['rotateX', 'rotateY', 'rotateZ', 'skewX', 'skewY'].includes(key)

  const isBg = key => key === 'backgroundColor'

  /** format rules */
  const formatRules = ({ rules, animatedOption: { delay, duration, timingFunction }, isTransform = false }, style, animationStyle) => {
    return [...rules.entries()].reduce((arr, [key, value]) => {
      const initialVal = style[key] === undefined ? InitialValue[key] : style[key]
      if (initialVal === undefined) {
        console.error(`style rule ${key} 初始值为空`)
        return arr
      }
      if (!rulesMap.has(key)) {
        const animated = new Animated.Value(isBg(key) ? 0 : initialVal)
        rulesMap.set(key, animated)
        const styleVal = isBg
          // 背景色映射
          ? animated.interpolate({
            inputRange: [0, 1],
            outputRange: [initialVal, value]
          })
          : isDeg(key)
            // deg 角度值映射
            ? animated.interpolate({
              inputRange: [0, 360],
              outputRange: ['0deg', '360deg']
            })
            : animated
        // transform
        if (isTransform) {
          const transformStyle = animationStyle.transform || []
          transformStyle.push({
            [key]: styleVal
          })
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
      if (!EasingKey[timingFunction]) {
        console.error(`React Native 不支持 timingFunction = ${timingFunction}，请重新设置`)
      }
      arr.push(Animated.timing(animated, {
        toValue: isBg(key) ? 1 : value,
        duration,
        delay,
        ...EasingKey[timingFunction] ? { easing: EasingKey[timingFunction] } : {}
      }))
      return arr
    }, [])
  }

  /** 创建动画 */
  const createAnimation = (props) => {
    // 动画样式
    let animationStyle = useRef({}).current
    // 分步动画
    let steps = []
    const {
      style = [],
      animation = []
    } = props
    const styleObj = StyleSheet.flatten(style)
    if (!animation.length) return animationStyle
    if (!steps.length) {
      steps =  animation.map(({ animatedOption, rules, transform }) => {
        // 设置 transformOrigin
        Object.assign(animationStyle, {
          transformOrigin: animatedOption.transformOrigin
        })
        // 获取属性动画实例
        const parallels = [];
        const styleAnimation = formatRules({ rules, animatedOption }, styleObj, animationStyle)
        parallels.push(...styleAnimation)
        const transformAnimation = formatRules({ rules: transform, animatedOption, isTransform: true }, styleObj, animationStyle)
        parallels.push(...transformAnimation)
        return Animated.parallel(parallels)
      })
    }
    Animated.sequence(steps).start(({ finished }) => {
      console.error('is finished ?', finished) // Todo
    });
    return animationStyle
  }

  return {
    createAnimation
  }
}
