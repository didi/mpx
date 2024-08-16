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
const TransformInitial = {
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
}
// 动画默认初始值
const InitialValue = {
  ...TransformInitial,
  opacity: 1,
  // backgroundColor: 0,
  width: 0,
  height: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0
}
// deg 角度
const isDeg = key => ['rotateX', 'rotateY', 'rotateZ', 'skewX', 'skewY', 'rotate'].includes(key)
// 背景色
const isBg = key => key === 'backgroundColor'
// transform
const isTransform = key => Object.keys(TransformInitial).includes(key)

export default function useAnimationHooks<T, P>(props) {
  // 动画规则 map
  const rulesMap = useRef(new Map())
  // id 标识
  let idRef = useRef(-1)
  const {
    style = [],
    animation = {}
  } = props
  const actions = animation.actions || []
  const originalStyle = StyleSheet.flatten(style)
  if (!actions.length) return {}

  /** 根据 ruleMap 获取对应的 animation style   */
  const getAnimationStyle = () => {
    return [...rulesMap.current.entries()].reduce((style, [key, value]) => {
      if (isTransform(key)) {
        const transform = style.transform || []
        transform.push({ [key]: value.getStyle() })
        style['transform'] = transform
      } else {
        style[key] = value.getStyle()
      }
      return style
    }, {})
  }
  if (idRef.current === animation.id) {
    // animation id 未变化 直接映射出 style
    const transformOrigin = actions[actions.length - 1].animatedOption.transformOrigin
    const style = getAnimationStyle()
    return transformOrigin ? {
      transformOrigin,
      ...style,
    } : style
  }
  /** 获取动画实例 */
  const getParallelsAnimation = ({ key, value, initialVal }, { delay, duration, timingFunction }) => {
    if (initialVal === undefined) {
      console.error(`style rule ${key} 初始值为空`)
      return false
    }
    if (!rulesMap.current.has(key)) {
      const animated = new Animated.Value(isBg(key) ? 0 : initialVal)
      rulesMap.current.set(key, {
        animated,
        getStyle: isBg(key)
          // 背景色映射
          ? () => animated.interpolate({
            inputRange: [0, 1],
            outputRange: [initialVal, value]
          })
          : isDeg(key)
            // deg 角度值映射
            ? () => animated.interpolate({
              inputRange: [0, 360],
              outputRange: ['0deg', '360deg']
            })
            : () => animated
      })
    }
    const animated = rulesMap.current.get(key).animated
    if (!EasingKey[timingFunction]) {
      console.error(`React Native 不支持 timingFunction = ${timingFunction}，请重新设置`)
    }
    return Animated.timing(animated, {
      toValue: isBg(key) ? 1 : value,
      duration,
      delay,
      ...EasingKey[timingFunction] ? { easing: EasingKey[timingFunction] } : {}
    })
  }
  /** 获取初始值 */
  const getInitialVal = (key) => {
    let initialVal
    if (isTransform(key) && originalStyle.transform?.length) {
      // 仅支持 { transform: [{rotateX: '45deg'}, {rotateZ: '0.785398rad'}] } 格式的初始样式
      originalStyle.transform.forEach(item => {
        if (item[key] !== undefined) {
          initialVal = isDeg(key) ? +item[key].replace(/[^0-9]/ig,'') : item[key]
        }
      })
      initialVal = initialVal !== undefined ? initialVal : InitialValue[key]
    } else {
      initialVal = originalStyle[key] === undefined ? InitialValue[key] : originalStyle[key]
    }
    return initialVal
  }

  /** 创建&播放动画 */
  const createAnimation = () => {
    const animationStyle = {}
    const steps = actions.map(({ animatedOption, rules, transform }) => {
      // 设置 transformOrigin
      if (animatedOption.transformOrigin) {
        Object.assign(animationStyle, {
          transformOrigin: animatedOption.transformOrigin
        })
      }
      // 获取动画序列
      const parallels = [
        ...rules.entries(),
        ...transform.entries()
      ].reduce((arr, [key, value]) => {
        const initialVal = getInitialVal(key)
        const animation = getParallelsAnimation({ key, value, initialVal }, animatedOption)
        animation && arr.push(animation)
        return arr
      }, [])
      return Animated.parallel(parallels || [])
    })
    Object.assign(animationStyle, getAnimationStyle())
    Animated.sequence(steps).start(({ finished }) => {
      console.error('is finished ?', finished) // Todo
    });
    // 更新id
    idRef.current = animation.id
    return animationStyle
  }
  return createAnimation()
}
