import { useEffect, useMemo, useRef } from 'react'
import { TransformsStyle } from 'react-native'
import {
  Easing,
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  withSequence,
  withDelay,
  makeMutable,
  cancelAnimation,
  SharedValue,
  WithTimingConfig,
  AnimationCallback
} from 'react-native-reanimated'
import { error, hasOwn } from '@mpxjs/utils'
import { createAnimation as createAnimationAPI } from '@mpxjs/api-proxy'
import type { ExtendedViewStyle } from './types/common'
import type { _ViewProps } from './mpx-view'

type AnimatedOption = {
  duration: number
  delay: number
  useNativeDriver: boolean
  timingFunction: 'linear' | 'ease' | 'ease-in' | 'ease-in-out'| 'ease-out'
  transformOrigin: string
}
type ExtendWithTimingConfig = WithTimingConfig & {
  delay: number
}
export type AnimationStepItem = {
  animatedOption: AnimatedOption
  rules: Map<string, number | string>
  transform: Map<string, number>
}
export type AnimationProp = {
  id: number,
  actions: AnimationStepItem[]
}

// 微信 timingFunction 和 RN Easing 对应关系
const EasingKey = {
  linear: Easing.linear,
  ease: Easing.inOut(Easing.ease),
  'ease-in': Easing.in(Easing.poly(3)),
  'ease-in-out': Easing.inOut(Easing.poly(3)),
  'ease-out': Easing.out(Easing.poly(3))
  // 'step-start': '',
  // 'step-end': ''
}
const TransformInitial: ExtendedViewStyle = {
  // matrix: 0,
  // matrix3d: 0,
  // rotate: '0deg',
  rotateX: '0deg',
  rotateY: '0deg',
  rotateZ: '0deg',
  // rotate3d:[0,0,0]
  // scale: 1,
  // scale3d: [1, 1, 1],
  scaleX: 1,
  scaleY: 1,
  // scaleZ: 1,
  // skew: 0,
  skewX: '0deg',
  skewY: '0deg',
  // translate: 0,
  // translate3d: 0,
  translateX: 0,
  translateY: 0
  // translateZ: 0,
}
// 动画默认初始值
const InitialValue: ExtendedViewStyle = Object.assign({
  opacity: 1,
  backgroundColor: 'transparent',
  width: 0,
  height: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  transformOrigin: ['50%', '50%', 0]
}, TransformInitial)
const PropSupportTransition = Object.assign({
  borderRadius: 0,
  borderColor: 'transparent',
  borderWidth: 0,
  // Todo 新增的 prop
  marginTop: 0,
  marginLeft: 0,
  marginRight: 0,
  marginBottom: 0
}, InitialValue)
const TransformOrigin = 'transformOrigin'
const Transform = 'transform'
const secondRegExp = /^\s*(\d*(?:\.\d+)?)(s|ms)\s*$/
// 动画类型
const enum AnimationType {
  None,
  API,
  CssTransition,
  CssAnimation
}
// transform
const isTransform = (key: string) => Object.keys(TransformInitial).includes(key)
// 多value解析
const parseValues = (str: string, char = ' ') => {
  let stack = 0
  let temp = ''
  const result = []
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '(') {
      stack++
    } else if (str[i] === ')') {
      stack--
    }
    // 非括号内 或者 非分隔字符且非空
    if (stack !== 0 || (str[i] !== char && str[i] !== ' ')) {
      temp += str[i]
    }
    if ((stack === 0 && str[i] === char) || i === str.length - 1) {
      result.push(temp)
      temp = ''
    }
  }
  return result
}
// parse string transform, eg: transform: 'rotateX(45deg) rotateZ(0.785398rad)'
const parseTransform = (transformStr: string) => {
  const values = parseValues(transformStr)
  const transform: {[propName: string]: string|number|number[]}[] = []
  values.forEach(item => {
    const match = item.match(/([/\w]+)\((.+)\)/)
    if (match && match.length >= 3) {
      let key = match[1]
      const val = match[2]
      switch (key) {
        case 'translateX':
        case 'translateY':
        case 'scaleX':
        case 'scaleY':
        case 'rotateX':
        case 'rotateY':
        case 'rotateZ':
        case 'rotate':
        case 'skewX':
        case 'skewY':
        case 'perspective':
          // rotate 处理成 rotateZ
          key = key === 'rotate' ? 'rotateZ' : key
          // 单个值处理
          transform.push({ [key]: global.__formatValue(val) })
          break
        case 'matrix':
          transform.push({ [key]: parseValues(val, ',').map(val => +val) })
          break
        case 'translate':
        case 'scale':
        case 'skew':
        case 'translate3d': // x y 支持 z不支持
        case 'scale3d': // x y 支持 z不支持
        {
          // 2 个以上的值处理
          key = key.replace('3d', '')
          const vals = parseValues(val, ',').splice(0, 3)
          // scale(.5) === scaleX(.5) scaleY(.5)
          if (vals.length === 1 && key === 'scale') {
            vals.push(vals[0])
          }
          const xyz = ['X', 'Y', 'Z']
          transform.push(...vals.map((v, index) => {
            return { [`${key}${xyz[index] || ''}`]: global.__formatValue(v.trim()) }
          }))
          break
        }
      }
    }
  })
  return transform
}
// format style
const formatStyle = (style: ExtendedViewStyle): ExtendedViewStyle => {
  if (!style.transform || Array.isArray(style.transform)) return style
  return Object.assign({}, style, {
    transform: parseTransform(style.transform)
  })
}
// transform 数组转对象
function getTransformObj (transforms: { [propName: string]: string | number }[]) {
  'worklet'
  return transforms.reduce((transformObj, item) => {
    return Object.assign(transformObj, item)
  }, {} as { [propName: string]: string | number })
}
// transition 解析相关方法
// 解析动画时长
function getUnit (duration: string) {
  const match = secondRegExp.exec(duration)
  return match ? match[2] === 's' ? +match[1] * 1000 : +match[1] : 0
}
// 解析 property timingFunction
function parseSingleTransition (options: string[]) {
  if (options.length < 2) return null
  const property = options[0]
  const duration = getUnit(options[1])
  if (!property || !duration) return null
  const timingFunction = Object.keys(EasingKey).includes(options[2]) ? options[2] : EasingKey.linear
  const delay = getUnit(options[2]) || getUnit(options[3])
  return {
    property,
    animatedOption: {
      duration,
      timingFunction,
      delay
    }
  }
}
// transition 解析
function parseTransition (transition: string) {
  const isMulti = transition.includes(',')
  if (isMulti) {
    const options = parseValues(transition, ' ')
    // Todo transition: margin-right 4s, color 1s 支持
    return null
  } else {
    const options = parseValues(transition)
    return parseSingleTransition(options)
  }
}
// 从 transition 获取 AnimatedKeys
function getAnimatedKeysFromTransition (propName: string, originalStyle: ExtendedViewStyle) {
  const animatedKeys = {} as { [propName: keyof ExtendedViewStyle]: boolean }
  if (propName === Transform) {
    const transform = originalStyle.transform
    console.log('parseValues transform=', transform)
    Object.keys(getTransformObj(originalStyle.transform!)).forEach((key) => {
      animatedKeys[key] = true
      // ins[key](value).step()
      // console.log(key, value, shareValMap[propName]?.value, lastStyleRef.current[propName]);
    })
  } else if (Object.keys(PropSupportTransition).includes(propName)) {
    animatedKeys[propName] = true
    // console.log(propName, value, shareValMap[propName]?.value, lastStyleRef.current[propName])
  }
  return animatedKeys
}

export default function useAnimationHooks<T, P> (props: _ViewProps & { enableAnimation?: boolean }) {
  const { style = {}, enableAnimation } = props
  let animation = props.animation
  const enableStyleAnimation = enableAnimation || !!animation || !!style.transition
  const enableAnimationRef = useRef(enableStyleAnimation)
  if (enableAnimationRef.current !== enableStyleAnimation) {
    error('[Mpx runtime error]: animation usage should be stable in the component lifecycle, or you can set [enable-animation] with true.')
  }
  // 记录动画类型
  const animationType = style.transition ? AnimationType.CssTransition : style.animation ? AnimationType.CssAnimation : animation ? AnimationType.API : AnimationType.None
  const animationTypeRef = useRef(animationType)
  if (animationTypeRef.current !== AnimationType.None && animationTypeRef.current !== animationType) {
    error('[Mpx runtime error]: animationType should be stable, it is not allowed to switch CSS animation, API animation or CSS animation in the component lifecycle')
  }
  if (!enableAnimationRef.current) return { enableStyleAnimation: false }

  const originalStyle = formatStyle(style)
  // id 标识
  // const id = animation?.id || -1
  // 有动画样式的 style key
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const animatedStyleKeys = useSharedValue([] as (string|string[])[])
  // 记录有动画的 propName
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const animatedKeys = useRef({} as {[propName: keyof ExtendedViewStyle]: boolean})
  // 记录上次style map
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const lastStyleRef = useRef({} as {[propName: keyof ExtendedViewStyle]: number|string})
  // ** 全量 style prop sharedValue
  // 不能做增量的原因：
  // 1 尝试用 useRef，但 useAnimatedStyle 访问后的 ref 不能在增加新的值，被冻结
  // 2 尝试用 useSharedValue，因为实际触发的 style prop 需要是 sharedValue 才能驱动动画，若外层 shareValMap 也是 sharedValue，动画无法驱动。
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const shareValMap = useMemo(() => {
    return Object.keys(InitialValue).reduce((valMap, key) => {
      const defaultVal = getInitialVal(key, isTransform(key))
      valMap[key] = makeMutable(defaultVal)
      return valMap
    }, {} as { [propName: keyof ExtendedViewStyle]: SharedValue<string|number> })
  }, [])
  // ** style更新同步
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (style.transition) {
      animationTypeRef.current = AnimationType.CssTransition
      const { property, animatedOption = {} } = parseTransition(style.transition) || {}
      if (property && animatedOption.duration) {
        console.log('parseTransition property=', property, ' animatedOption=', animatedOption, `, animatedKeys.current[${property}]=`, animatedKeys.current[property])
        if (originalStyle[property]) {
          animatedKeys.current = getAnimatedKeysFromTransition(property, originalStyle)
          animation = getAnimationFromTransition({ property, animatedOption })
          startAnimation()
        }
      }
    } else {
      // style 更新后同步更新 lastStyleRef & shareValMap
      updateStyleVal()
    }
  }, [style])
  // ** 获取动画样式prop & 驱动动画
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (animation?.id === -1) return
    // 更新动画样式 key map
    animatedKeys.current = getAnimatedStyleKeys()
    startAnimation()
  }, [animation?.id])
  // ** 清空动画
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    return () => {
      Object.values(shareValMap).forEach((value) => {
        cancelAnimation(value)
      })
    }
  }, [])
  // 开始动画
  function startAnimation () {
    const keys = Object.keys(animatedKeys.current)
    animatedStyleKeys.value = formatAnimatedKeys([TransformOrigin, ...keys])
    // 驱动动画
    createAnimation(keys)
  }
  // 从transition & style 变更中获取动画数据
  function getAnimationFromTransition ({ property, animatedOption }: { property: string, animatedOption: Object }) {
    const ins = createAnimationAPI(animatedOption)
    if (property === Transform) {
      const transform = originalStyle.transform
      console.log('parseValues transform=', transform)
      Object.entries(getTransformObj(originalStyle.transform!)).forEach(([key, value]) => {
        ins[key](value).step()
        // console.log(key, value, shareValMap[propName]?.value, lastStyleRef.current[propName]);
      })
    } else if (hasOwn(animatedKeys.current, property)) {
      const value = originalStyle[property]
      ins[property](value).step()
      // console.log(propName, value, shareValMap[propName]?.value, lastStyleRef.current[propName])
    }
    return ins.export()
  }
  // 根据 animation action 创建&驱动动画
  function createAnimation (animatedKeys: string[] = []) {
    const actions = animation?.actions || []
    const sequence = {} as { [propName: keyof ExtendedViewStyle]: (string|number)[] }
    const lastValueMap = {} as { [propName: keyof ExtendedViewStyle]: string|number }
    actions.forEach(({ animatedOption, rules, transform }, index) => {
      const { delay, duration, timingFunction, transformOrigin } = animatedOption
      const easing = EasingKey[timingFunction] || Easing.inOut(Easing.quad)
      let needSetCallback = true
      const setTransformOrigin: AnimationCallback = (finished: boolean) => {
        'worklet'
        // 动画结束后设置下一次transformOrigin
        if (finished) {
          if (index < actions.length - 1) {
            const transformOrigin = actions[index + 1].animatedOption?.transformOrigin
            transformOrigin && (shareValMap[TransformOrigin].value = transformOrigin)
          }
        }
      }
      if (index === 0) {
        // 设置当次中心
        shareValMap[TransformOrigin].value = transformOrigin
      }
      // 添加每个key的多次step动画
      animatedKeys.forEach(key => {
        const ruleV = isTransform(key) ? transform.get(key) : rules.get(key)
        // key不存在，第一轮取shareValMap[key]value，非第一轮取上一轮的
        const toVal = ruleV !== undefined
          ? ruleV
          : index > 0
            ? lastValueMap[key]
            : shareValMap[key].value
        const animation = getAnimation({ key, value: toVal! }, { delay, duration, easing }, needSetCallback ? setTransformOrigin : undefined)
        needSetCallback = false
        if (!sequence[key]) {
          sequence[key] = [animation]
        } else {
          sequence[key].push(animation)
        }
        // 更新一下 lastValueMap
        lastValueMap[key] = toVal!
      })
      // 赋值驱动动画
      animatedKeys.forEach((key) => {
        const animations = sequence[key]
        shareValMap[key].value = animations.length > 1 ? withSequence(...animations) : animations[0]
      })
    })
  }
  // 创建单个animation
  function getAnimation ({ key, value }: { key: string, value: string|number }, { delay, duration, easing }: ExtendWithTimingConfig, callback?: AnimationCallback) {
    const animation = typeof callback === 'function'
      ? withTiming(value, { duration, easing }, callback)
      : withTiming(value, { duration, easing })
    return delay ? withDelay(delay, animation) : animation
  }
  // 获取样式初始值（prop style or 默认值）
  function getInitialVal (key: keyof ExtendedViewStyle, isTransform = false) {
    if (isTransform && Array.isArray(originalStyle.transform)) {
      let initialVal = InitialValue[key]
      // 仅支持 { transform: [{rotateX: '45deg'}, {rotateZ: '0.785398rad'}] } 格式的初始样式
      originalStyle.transform.forEach(item => {
        if (item[key] !== undefined) initialVal = item[key]
      })
      return initialVal
    }
    return originalStyle[key] === undefined ? InitialValue[key] : originalStyle[key]
  }
  // 循环 animation actions 获取所有有动画的 style prop name
  function getAnimatedStyleKeys () {
    return (animation?.actions || []).reduce((keyMap, action) => {
      const { rules, transform } = action
      const ruleArr = [...rules.keys(), ...transform.keys()]
      ruleArr.forEach(key => {
        if (!keyMap[key]) keyMap[key] = true
      })
      return keyMap
    }, animatedKeys.current)
  }
  // animated key transform 格式化
  function formatAnimatedKeys (keys: string[]) {
    const animatedKeys = [] as (string|string[])[]
    const transforms = [] as string[]
    keys.forEach(key => {
      if (isTransform(key)) {
        transforms.push(key)
      } else {
        animatedKeys.push(key)
      }
    })
    if (transforms.length) animatedKeys.push(transforms)
    return animatedKeys
  }
  // 设置 lastShareValRef & shareValMap
  function updateStyleVal () {
    Object.entries(originalStyle).forEach(([key, value]) => {
      if (key === 'transform') {
        Object.entries(getTransformObj(value)).forEach(([key, value]) => {
          if (value !== lastStyleRef.current[key]) {
            lastStyleRef.current[key] = value
            shareValMap[key].value = value
          }
        })
      } else if (hasOwn(shareValMap, key)) {
        if (value !== lastStyleRef.current[key]) {
          lastStyleRef.current[key] = value
          shareValMap[key].value = value
        }
      }
    })
  }
  // ** 生成动画样式
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const animationStyle = useAnimatedStyle(() => {
    // console.info(`useAnimatedStyle styles=`, originalStyle)
    return animatedStyleKeys.value.reduce((styles, key) => {
      // console.info('getAnimationStyles', key, shareValMap[key].value)
      if (Array.isArray(key)) {
        const transformStyle = getTransformObj(originalStyle.transform || [])
        key.forEach((transformKey) => {
          transformStyle[transformKey] = shareValMap[transformKey].value
        })
        styles.transform = Object.entries(transformStyle).map(([key, value]) => {
          return { [key]: value }
        }) as Extract<'transform', TransformsStyle>
      } else {
        styles[key] = shareValMap[key].value
      }
      return styles
    }, {} as ExtendedViewStyle)
  })

  return {
    enableStyleAnimation: enableAnimationRef.current,
    animationStyle
  }
}
