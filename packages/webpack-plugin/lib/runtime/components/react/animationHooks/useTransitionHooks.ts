import { hasOwn, dash2hump, error } from '@mpxjs/utils'
import { useMemo, useRef } from 'react'
import {
  Easing,
  makeMutable,
  runOnJS,
  useSharedValue
} from 'react-native-reanimated'
import {
  EasingKey,
  Transform,
  transitionSupportedProperty,
  TransformInitial,
  cubicBezierExp,
  secondRegExp,
  Transition,
  percentExp,
  getTransformObj,
  getUnit,
  getInitialVal,
  getAnimation,
  isTransform
} from './utils'
import { parseValues, useRunOnJSCallback } from '../utils'
import type { SharedValue, AnimatableValue, EasingFunction } from 'react-native-reanimated'
import type { ExtendedViewStyle } from '../types/common'
import type { AnimationHooksPropsType, TransitionMap, TimingFunction } from './utils'

type AnimationDataType = {
  property?: string
  duration?: number
  delay?: number
  easing: EasingFunction
}
const propName = {
  transition: '',
  transitionDuration: 'duration',
  transitionProperty: 'property',
  transitionTimingFunction: 'easing',
  transitionDelay: 'delay'
}
const behaviorExp = /^(allow-discrete|normal)$/
const defaultValueExp = /^(inherit|initial|revert|revert-layer|unset)$/
const timingFunctionExp = /^(step-start|step-end|steps)/
// cubic-bezier 参数解析
function getBezierParams (str: string) {
  // ease 0.25, 0.1, 0.25, 1.0
  return str.match(cubicBezierExp)?.[1]?.split(',').map(item => +item)
}
// 解析 transition-prop
function parseTransitionSingleProp (vals: string[], property: string) {
  let setDuration = false
  property = propName[property as keyof typeof propName]
  return vals.map(val => {
    // transition-property all
    if (val === 'all') {
      error('[Mpx runtime error]: the value of transition-property is not supported \'all\'')
      return undefined
    }
    // behavior
    if (behaviorExp.test(val)) {
      error('[Mpx runtime error]: transition-behavior is not supported')
      return undefined
    }
    // global values
    if (defaultValueExp.test(val)) {
      error('[Mpx runtime error]: global values is not supported')
      return undefined
    }
    if (timingFunctionExp.test(val)) {
      error('[Mpx runtime error]: the timingFunction in step-start,step-end,steps() is not supported')
      return undefined
    }
    // timingFunction
    if (Object.keys(EasingKey).includes(val) || cubicBezierExp.test(val)) {
      const bezierParams = getBezierParams(val)
      return {
        easing: bezierParams?.length ? Easing.bezier(bezierParams[0], bezierParams[1], bezierParams[2], bezierParams[3]) : EasingKey[val as TimingFunction] || Easing.inOut(Easing.ease)
      }
    }
    // duration & delay
    if (secondRegExp.test(val)) {
      const newProperty = property || (!setDuration ? 'duration' : 'delay')
      setDuration = true
      // console.log('parseTransitionSingleProp val=', val, property, setDuration)
      return {
        [newProperty]: getUnit(val)
      }
    }
    // property
    return {
      property: dash2hump(val)
    }
  }).filter(item => item !== undefined)
}
// transition 解析
function parseTransitionStyle (originalStyle: ExtendedViewStyle) {
  let transitionData: AnimationDataType[] = []
  Object.entries(originalStyle).filter(arr => arr[0].includes(Transition)).forEach(([prop, value]) => {
    if (prop === Transition) {
      const vals = parseValues(value, ',').map(item => {
        return parseTransitionSingleProp(parseValues(item), prop).reduce((map, subItem) => {
          return Object.assign(map, subItem)
        }, {} as AnimationDataType)
      })
      // console.log(`parseTransitionStyle ${prop}=${value}  formatVal=`, vals)
      if (transitionData.length) {
        transitionData = (vals.length > transitionData.length ? vals : transitionData).map((transitionItem, i) => {
          const valItem = vals[i] || {}
          const current = transitionData[i] || {}
          // console.log('parseTransitionStyle current=', current)
          // console.log('parseTransitionStyle valItem=', valItem)
          // console.log('parseTransitionStyle mergeObj=', Object.assign({}, current, valItem))
          return Object.assign({}, current, valItem)
        })
        // console.log(`parseTransitionStyle ${prop}=${value}, transitionData=`, transitionData)
      } else {
        transitionData = vals
      }
    } else {
      const vals = parseTransitionSingleProp(parseValues(value, ','), prop)
      // console.log(`parseTransitionStyle ${prop}=${value}  formatVal=`, vals)
      // formatVal [{"property": "transform"}, {"property": "marginLeft"}]
      if (transitionData.length) {
        transitionData = (vals.length > transitionData.length ? vals : transitionData).map((transitionItem, i) => {
          const valItem = vals[i] || vals[vals.length - 1]
          const current = transitionData[i] || transitionData[transitionData.length - 1]
          // console.log('parseTransitionStyle current=', current)
          // console.log('parseTransitionStyle valItem=', valItem)
          // console.log('parseTransitionStyle mergeObj=', Object.assign({}, current, valItem))
          return Object.assign({}, current, valItem)
        })
        // console.log(`parseTransitionStyle ${prop}=${value}, transitionData=`, transitionData)
      } else {
        transitionData = vals as AnimationDataType[]
      }
      // transitionData.push(...vals)
    }
  })
  // console.log(`parseTransitionStyle transitionData=`, transitionData)
  const transitionMap = transitionData.reduce((acc, cur) => {
    // hasOwn(transitionSupportedProperty, dash2hump(val)) || val === Transform
    const { property = '', duration = 0, delay = 0, easing = Easing.inOut(Easing.ease) } = cur
    if ((hasOwn(transitionSupportedProperty, dash2hump(property)) || property === Transform) && duration > 0) {
      acc[property] = {
        duration,
        delay,
        easing
      }
    }
    return acc
  }, {} as TransitionMap)
  // console.log(`parseTransitionStyle transitionMap=`, transitionMap)
  return transitionMap
}
export default function useTransitionHooks<T, P> (props: AnimationHooksPropsType) {
  // console.log(`useTransitionHooks, props=`, props)
  const { style: originalStyle = {}, transitionend } = props
  const propsRef = useRef<AnimationHooksPropsType>({})
  propsRef.current = props
  const transitionendRunJS = (duration: number, finished?: boolean, current?: AnimatableValue) => {
    const { transitionend } = propsRef.current
    transitionend && transitionend(finished, current, duration)
  }
  const runOnJSCallbackRef = useRef({
    transitionendRunJS
  })
  const runOnJSCallback = useRunOnJSCallback(runOnJSCallbackRef)
  // ** 从 style 中获取动画数据
  const transitionMap = useMemo(() => {
    return parseTransitionStyle(originalStyle)
  }, [])
  // ** style prop sharedValue  interpolateOutput: SharedValue<InterpolateOutput>
  const shareValMap = useMemo(() => {
    return Object.keys(transitionMap).reduce((valMap, property) => {
      // const { property } = transition || {}
      if (property === Transform) {
        Object.keys(originalStyle.transform ? getTransformObj(originalStyle.transform!) : TransformInitial).forEach((key) => {
          const defaultVal = getInitialVal(originalStyle, key)
          // console.log(`shareValMap property=${key} defaultVal=${defaultVal}`)
          valMap[key] = makeMutable(defaultVal)
        })
      } else if (hasOwn(transitionSupportedProperty, property)) {
        const defaultVal = getInitialVal(originalStyle, property)
        // console.log(`shareValMap property=${property} defaultVal=${defaultVal}`)
        valMap[property] = makeMutable(defaultVal)
      }
      // console.log('shareValMap = ', valMap)
      return valMap
    }, {} as { [propName: keyof ExtendedViewStyle]: SharedValue<string|number> })
  }, [])
  // 根据 animation action 创建&驱动动画
  function createAnimation (animatedKeys: string[] = []) {
    // duration 不同需要再次执行回调，这里记录一下上次propName动画的duration
    const callbackMap = new Map()
    animatedKeys.forEach(key => {
      // console.log(`createAnimation key=${key} originalStyle=`, originalStyle)
      let ruleV = originalStyle[key]
      if (isTransform(key)) {
        const transform = getTransformObj(originalStyle.transform!)
        ruleV = transform[key]
      }
      let toVal = ruleV !== undefined
        ? ruleV
        : transitionSupportedProperty[key]
      // 获取到的toVal为百分比格式化shareValMap为百分比
      if (percentExp.test(`${toVal}`) && typeof +shareValMap[key].value === 'number') {
        shareValMap[key].value = `${shareValMap[key].value as number * 100}%`
      } else if (percentExp.test(shareValMap[key].value as string) && typeof +toVal === 'number') {
        // 初始值为百分比则格式化toVal为百分比
        toVal = `${toVal * 100}%`
      } else if (typeof toVal !== typeof shareValMap[key].value) {
        // transition动画起始值和终态值类型不一致报错提示一下
        error(`[Mpx runtime error]: Value types of property ${key} must be consistent during the animation`)
      }
      // console.log(`key=${key} oldVal=${shareValMap[key].value} newVal=${toVal}`)
      const { delay = 0, duration, easing } = transitionMap[isTransform(key) ? Transform : key]
      // console.log('animationOptions=', { delay, duration, easing })
      let callback
      if (transitionend) {
        callback = (finished?: boolean, current?: AnimatableValue) => {
          'worklet'
          // 动画结束后设置下一次transformOrigin
          if (finished) {
            runOnJS(runOnJSCallback)('transitionendRunJS', duration, finished, current)
          }
        }
      }
      const animation = getAnimation({ key, value: toVal! }, { delay, duration, easing }, !callbackMap.get(duration) && callback ? callback : undefined)
      callbackMap.set(duration, true)
      shareValMap[key].value = animation
      // console.log(`useTransitionHooks, ${key}=`, animation)
    })
  }
  // 从 transition 获取 AnimatedKeys
  function getAnimatedStyleKeys (animatedKeys: {[propName: keyof ExtendedViewStyle]: boolean}) {
    return Object.entries(originalStyle).reduce((animatedKeys, [key, value]) => {
      // console.log('getAnimatedKeysFromTransition init', key, value)
      if (hasOwn(transitionMap, Transform) && key === Transform) {
        Object.keys(getTransformObj(value)).forEach((prop: string) => {
          animatedKeys[prop] = true
        })
      } else if (hasOwn(transitionMap, key)) {
        animatedKeys[key] = true
      }
      return animatedKeys
    }, animatedKeys)
  }
  return {
    shareValMap,
    createAnimation,
    getAnimatedStyleKeys
  }
}
