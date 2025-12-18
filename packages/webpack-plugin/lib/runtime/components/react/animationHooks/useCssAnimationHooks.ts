import { hasOwn, dash2hump, error } from '@mpxjs/utils'
import { useMemo, useRef, useEffect } from 'react'
import {
  Easing,
  makeMutable,
  runOnJS,
  useSharedValue,
  useAnimatedStyle,
  cancelAnimation
} from 'react-native-reanimated'
import {
  easingKey,
  transitionSupportedProperty,
  transformInitial,
  cubicBezierExp,
  secondRegExp,
  percentExp,
  getTransformObj,
  getUnit,
  getInitialVal,
  getAnimation,
  isTransform,
  formatAnimatedKeys
} from './utils'
import { parseValues, useRunOnJSCallback } from '../utils'
import type { SharedValue, AnimatableValue, EasingFunction } from 'react-native-reanimated'
import type { TransformsStyle } from 'react-native'
import type { ExtendedViewStyle } from '../types/common'
import type { AnimationHooksPropsType, TransitionMap, TimingFunction } from './utils'

type AnimationItem = {
  [propName: string]: ExtendedViewStyle
}

type AnimationDataType = {
  steps?: AnimationItem[]
  duration?: number
  delay?: number
  easing: EasingFunction,
  iterationCount?: number
  fillMode?: string
  direction?: string
}
const propName = {
  animation: '',
  animationName: 'name',
  animationDuration: 'duration',
  animationDelay: 'delay',
  animationDirection: 'direction',
  animationTimingFunction: 'easing',
  animationFillMode: 'fillMode',
  animationIterationCount: 'iterationCount'
  // animation-play-state 动画状态(暂不支持)
}
const defaultValueExp = /^(inherit|initial|revert|revert-layer|unset)$/
// Todo linear() https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/easing-function/linear
const timingFunctionExp = /^(step-start|step-end|steps|(linear\())/
const directionExp = /^(normal|reverse|alternate|alternate-reverse)$/
const fillModeExp = /^(none|forwards|backwards|both)$/
// cubic-bezier 参数解析
function getBezierParams (str: string) {
  // ease 0.25, 0.1, 0.25, 1.0
  return str.match(cubicBezierExp)?.[1]?.split(',').map(item => +item)
}
// 解析 animation-prop
function parseAnimationSingleProp (vals: string[], property: string) {
  let setDuration = false
  property = propName[property as keyof typeof propName]
  return vals.map(val => {
    // global values
    if (defaultValueExp.test(val)) {
      error('[Mpx runtime error]: global values is not supported')
      return undefined
    }
    if (timingFunctionExp.test(val)) {
      error('[Mpx runtime error]: the timingFunction in step-start,step-end,steps(),liner() is not supported')
      return undefined
    }
    // timingFunction
    if (Object.keys(easingKey).includes(val) || cubicBezierExp.test(val)) {
      const bezierParams = getBezierParams(val)
      return {
        easing: bezierParams?.length
          ? Easing.bezier(bezierParams[0], bezierParams[1], bezierParams[2], bezierParams[3])
          : easingKey[val] || Easing.inOut(Easing.ease)
      }
    }
    // direction
    if (directionExp.test(val)) {
      return {
        direction: val
      }
    }
    // fill-mode
    if (fillModeExp.test(val)) {
      return {
        fillMode: val
      }
    }
    // duration & delay
    if (secondRegExp.test(val)) {
      const newProperty = property || (!setDuration ? 'duration' : 'delay')
      setDuration = true
      return {
        [newProperty]: getUnit(val)
      }
    }
    if (!isNaN(+val)) {
      return {
        iterationCount: +val
      }
    }
    // name
    return {
      name: val
    }
  }).filter(item => item !== undefined)
}
// transition 解析
function parseAnimationStyle (originalStyle: ExtendedViewStyle) {
  let animationData: AnimationDataType[] = []
  Object.entries(originalStyle).filter(arr => arr[0].includes('animation')).forEach(([prop, value]) => {
    if (prop === 'animation') {
      const vals = parseValues(value, ',').map(item => {
        return parseAnimationSingleProp(parseValues(item), prop).reduce((map, subItem) => {
          const { name } = subItem || {}
          const steps = originalStyle.keyframes?.[name || '']
          const data = Object.assign(map, steps ? { steps } : subItem)
          // console.error(`parseAnimationStyle animation ${prop}=${value}  formatVal=`, item, data);
          return data
        }, {} as AnimationDataType)
      })
      if (animationData.length) {
        animationData = (vals.length > animationData.length ? vals : animationData).map((transitionItem, i) => {
          const valItem = vals[i] || {}
          const current = animationData[i] || {}
          // console.log('parseTransitionStyle current=', current)
          // console.log('parseTransitionStyle valItem=', valItem)
          // console.log('parseTransitionStyle mergeObj=', Object.assign({}, current, valItem))
          return Object.assign({}, current, valItem)
        })
        // console.log(`parseTransitionStyle ${prop}=${value}, transitionData=`, transitionData)
      } else {
        animationData = vals
      }
      console.error(vals, 999000)
    } else {
      const vals = parseAnimationSingleProp(parseValues(value, ','), prop)
      // console.log(`parseTransitionStyle ${prop}=${value}  formatVal=`, vals)
      // formatVal [{"property": "transform"}, {"property": "marginLeft"}]
      if (animationData.length) {
        animationData = (vals.length > animationData.length ? vals : animationData).map((transitionItem, i) => {
          const valItem = vals[i] || vals[vals.length - 1]
          const current = animationData[i] || animationData[animationData.length - 1]
          // console.log('parseTransitionStyle current=', current)
          // console.log('parseTransitionStyle valItem=', valItem)
          // console.log('parseTransitionStyle mergeObj=', Object.assign({}, current, valItem))
          return Object.assign({}, current, valItem)
        })
        // console.log(`parseTransitionStyle ${prop}=${value}, transitionData=`, transitionData)
      } else {
        animationData = vals as AnimationDataType[]
      }
    }
  })
  // 从style 中解析的动画数据，结构如下：
  // transitionMap= {"marginLeft": {"delay": 0, "duration": 3000, "easing": []}, "transform": {"delay": 0, "duration": 3000, "easing": []}}
  // const animationMap = animationData.reduce((acc, cur) => {
  //   // hasOwn(transitionSupportedProperty, dash2hump(val)) || val === Transform
  //   const { property = '', duration = 0, delay = 0, easing = Easing.inOut(Easing.ease) } = cur
  //   if ((hasOwn(transitionSupportedProperty, dash2hump(property)) || property === 'transform') && duration > 0) {
  //     acc[property] = {
  //       duration,
  //       delay,
  //       easing
  //     }
  //   }
  //   return acc
  // }, {})
  return animationData
}

export default function useCssAnimationHooks<T, P> (props: AnimationHooksPropsType) {
  // console.log(`useTransitionHooks, props=`, props)
  const { style: originalStyle = {}, transitionend } = props
  // style变更标识(首次render不执行)，初始值为0，首次渲染后为1
  const animationDeps = useRef(0)
  // 有动画样式的 style key(useAnimatedStyle使用)
  const animatedStyleKeys = useSharedValue([] as (string|string[])[])
  // 记录需要执行动画的 propName
  const animatedKeys = useRef([] as string[])
  // 记录上次style map
  // const lastStyleRef = useRef({} as {[propName: keyof ExtendedViewStyle]: number|string})
  // ** 从 style 中获取动画数据
  // const animationMap = useMemo(() => {
  //   return parseAnimationStyle(originalStyle)
  // }, [])
  const animationData = parseAnimationStyle(originalStyle)
  console.log(animationData, 999000)
  // ** style prop sharedValue  interpolateOutput: SharedValue<InterpolateOutput>
  // const shareValMap = useMemo(() => {
  //   return Object.keys(transitionMap).reduce((valMap, property) => {
  //     // const { property } = transition || {}
  //     if (property === 'transform') {
  //       Object.keys(originalStyle.transform ? getTransformObj(originalStyle.transform!) : transformInitial).forEach((key) => {
  //         const defaultVal = getInitialVal(originalStyle, key)
  //         // console.log(`shareValMap property=${key} defaultVal=${defaultVal}`)
  //         valMap[key] = makeMutable(defaultVal)
  //       })
  //     } else if (hasOwn(transitionSupportedProperty, property)) {
  //       const defaultVal = getInitialVal(originalStyle, property)
  //       // console.log(`shareValMap property=${property} defaultVal=${defaultVal}`)
  //       valMap[property] = makeMutable(defaultVal)
  //     }
  //     // console.log('shareValMap = ', valMap)
  //     return valMap
  //   }, {} as { [propName: keyof ExtendedViewStyle]: SharedValue<string|number> })
  // }, [])
  const runOnJSCallbackRef = useRef({})
  const runOnJSCallback = useRunOnJSCallback(runOnJSCallbackRef)
  // 从 transitionMap 获取动画信息
  // function getAnimatedInfo () {
  //   const animatedKeysRef = [] as string[]
  //   const animatedKeysShareVal = [] as (string|string[])[]
  //   const transforms = [] as string[]
  //   Object.keys(shareValMap).forEach(key => {
  //     const value = originalStyle[key]
  //     if (isTransform(key) && originalStyle.transform) {
  //       Object.entries(getTransformObj(originalStyle.transform)).forEach(([prop, val]) => {
  //         if (val !== undefined && val !== shareValMap[key].value) {
  //           shareValMap[prop].value = val
  //         }
  //         animatedKeysRef.push(prop)
  //         transforms.push(prop)
  //       })
  //     } else {
  //       if (value !== undefined && value !== shareValMap[key].value) {
  //         shareValMap[key].value = value
  //       }
  //       animatedKeysRef.push(key)
  //       animatedKeysShareVal.push(key)
  //     }
  //   })
  //   if (transforms.length) animatedKeysShareVal.push(transforms)
  //   return {
  //     animatedKeysRef,
  //     animatedKeysShareVal
  //   }
  // }
  // 根据 animation action 创建&驱动动画
  // function createAnimation () {
  //   let transformTransitionendDone = false
  //   animatedKeys.current.forEach(key => {
  //     // console.log(`createAnimation key=${key} originalStyle=`, originalStyle)
  //     const isTransformKey = isTransform(key)
  //     let ruleV = originalStyle[key]
  //     if (isTransformKey) {
  //       const transform = getTransformObj(originalStyle.transform!)
  //       ruleV = transform[key]
  //     }
  //     let toVal = ruleV !== undefined
  //       ? ruleV
  //       : transitionSupportedProperty[key]
  //     const shareVal = shareValMap[key].value
  //     if (percentExp.test(`${toVal}`) && !percentExp.test(shareVal as string) && !isNaN(+shareVal)) {
  //       // 获取到的toVal为百分比格式化shareValMap为百分比
  //       shareValMap[key].value = `${shareVal as number * 100}%`
  //     } else if (percentExp.test(shareVal as string) && !percentExp.test(toVal as string) && !isNaN(+toVal)) {
  //       // 初始值为百分比则格式化toVal为百分比
  //       toVal = `${toVal * 100}%`
  //     } else if (typeof toVal !== typeof shareVal) {
  //       // 动画起始值和终态值类型不一致报错提示一下
  //       error(`[Mpx runtime error]: Value types of property ${key} must be consistent during the animation`)
  //     }
  //     // console.log(`key=${key} oldVal=${shareValMap[key].value} newVal=${toVal}`)
  //     const { delay = 0, duration, easing } = transitionMap[isTransformKey ? 'transform' : key]
  //     // console.log('animationOptions=', { delay, duration, easing })
  //     let callback
  //     if (transitionend && (!isTransformKey || !transformTransitionendDone)) {
  //       runOnJSCallbackRef.current = {
  //         animationCallback: (duration: number, finished: boolean, current?: AnimatableValue) => {
  //           transitionend(finished, current, duration)
  //         }
  //       }
  //       callback = (finished?: boolean, current?: AnimatableValue) => {
  //         'worklet'
  //         // 动画结束后设置下一次transformOrigin
  //         if (finished) {
  //           runOnJS(runOnJSCallback)('animationCallback', duration, finished, current)
  //         }
  //       }
  //     }
  //     const animation = getAnimation({ key, value: toVal! }, { delay, duration, easing }, callback)
  //     // Todo transform 有多个属性时也仅执行一次 transitionend（对齐wx）
  //     if (isTransformKey) {
  //       transformTransitionendDone = true
  //     }
  //     shareValMap[key].value = animation
  //     // console.log(`useTransitionHooks, ${key}=`, animation)
  //   })
  // }
  // ** style 更新
  // useEffect(() => {
  //   // console.log('useEffect originalStyle animationDeps=', animationDeps.current, originalStyle)
  //   // 首次不执行
  //   if (!animationDeps.current) {
  //     animationDeps.current = 1
  //     // 更新 shareVale & 获取动画key
  //     const { animatedKeysRef, animatedKeysShareVal } = getAnimatedInfo()
  //     animatedKeys.current = animatedKeysRef
  //     animatedStyleKeys.value = animatedKeysShareVal
  //     return
  //   }
  //   createAnimation()
  // }, [originalStyle])
  // ** 清空动画
  // useEffect(() => {
  //   return () => {
  //     Object.values(shareValMap).forEach((value) => {
  //       cancelAnimation(value)
  //     })
  //   }
  // }, [])
  return {}
  // // ** 生成动画样式
  // return useAnimatedStyle(() => {
  //   // console.info(`useAnimatedStyle styles=`, originalStyle)
  //   return animatedStyleKeys.value.reduce((styles, key) => {
  //     if (Array.isArray(key)) {
  //       const transformStyle = getTransformObj(originalStyle.transform || [])
  //       key.forEach((transformKey) => {
  //         transformStyle[transformKey] = shareValMap[transformKey].value
  //       })
  //       styles.transform = Object.entries(transformStyle).map(([key, value]) => {
  //         return { [key]: value }
  //       }) as Extract<'transform', TransformsStyle>
  //     } else {
  //       styles[key] = shareValMap[key].value
  //     }
  //     // console.log('animationStyle', styles)
  //     return styles
  //   }, {} as ExtendedViewStyle)
  // })
}
