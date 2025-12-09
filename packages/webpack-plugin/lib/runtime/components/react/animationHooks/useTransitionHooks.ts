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
    if (Object.keys(easingKey).includes(val) || cubicBezierExp.test(val)) {
      const bezierParams = getBezierParams(val)
      return {
        easing: bezierParams?.length ? Easing.bezier(bezierParams[0], bezierParams[1], bezierParams[2], bezierParams[3]) : easingKey[val as TimingFunction] || Easing.inOut(Easing.ease)
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
  Object.entries(originalStyle).filter(arr => arr[0].includes('transition')).forEach(([prop, value]) => {
    if (prop === 'transition') {
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
  // 从style 中解析的动画数据，结构如下：
  // transitionMap= {"marginLeft": {"delay": 0, "duration": 3000, "easing": []}, "transform": {"delay": 0, "duration": 3000, "easing": []}}
  const transitionMap = transitionData.reduce((acc, cur) => {
    // hasOwn(transitionSupportedProperty, dash2hump(val)) || val === Transform
    const { property = '', duration = 0, delay = 0, easing = Easing.inOut(Easing.ease) } = cur
    if ((hasOwn(transitionSupportedProperty, dash2hump(property)) || property === 'transform') && duration > 0) {
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
  // style变更标识(首次render不执行)，初始值为0，首次渲染后为1
  const animationDeps = useRef(0)
  // 有动画样式的 style key(useAnimatedStyle使用)
  const animatedStyleKeys = useSharedValue([] as (string|string[])[])
  // 记录需要执行动画的 propName
  const animatedKeys = useRef([] as string[])
  // 记录上次style map
  const lastStyleRef = useRef({} as {[propName: keyof ExtendedViewStyle]: number|string})
  // ** 从 style 中获取动画数据
  const transitionMap = useMemo(() => {
    return parseTransitionStyle(originalStyle)
  }, [])
  // ** style prop sharedValue  interpolateOutput: SharedValue<InterpolateOutput>
  const shareValMap = useMemo(() => {
    return Object.keys(transitionMap).reduce((valMap, property) => {
      // const { property } = transition || {}
      if (property === 'transform') {
        Object.keys(originalStyle.transform ? getTransformObj(originalStyle.transform!) : transformInitial).forEach((key) => {
          const defaultVal = getInitialVal(originalStyle, key)
          // console.log(`shareValMap property=${key} defaultVal=${defaultVal}`)
          valMap[key] = makeMutable(defaultVal)
        })
      } else if (hasOwn(transitionSupportedProperty, property)) {
        const defaultVal = getInitialVal(originalStyle, property)
        // console.log(`shareValMap property=${property} defaultVal=${defaultVal}`)
        valMap[property] = makeMutable(defaultVal)
      }
      console.log('shareValMap = ', valMap)
      return valMap
    }, {} as { [propName: keyof ExtendedViewStyle]: SharedValue<string|number> })
  }, [])
  const runOnJSCallbackRef = useRef({})
  const runOnJSCallback = useRunOnJSCallback(runOnJSCallbackRef)
  // 设置 lastShareValRef & shareValMap
  function updateStyleVal () {
    let isUpdate = 0
    Object.keys(shareValMap).forEach(key => {
      let value = originalStyle[key]
      if (isTransform(key)) {
        value = originalStyle.transform
        Object.entries(getTransformObj(value)).forEach(([key, value]) => {
          if (value !== lastStyleRef.current[key]) {
            lastStyleRef.current[key] = value
            if (!isUpdate) isUpdate = 1
          }
        })
      } else if (hasOwn(shareValMap, key)) {
        if (value !== lastStyleRef.current[key]) {
          lastStyleRef.current[key] = value
          if (!isUpdate) isUpdate = 1
        }
      }
    })
    return isUpdate
  }
  // 根据 animation action 创建&驱动动画
  function createAnimation (animatedKeys: string[] = []) {
    let transformTransitionendDone = false
    animatedKeys.forEach(key => {
      // console.log(`createAnimation key=${key} originalStyle=`, originalStyle)
      const isTransformKey = isTransform(key)
      let ruleV = originalStyle[key]
      if (isTransformKey) {
        const transform = getTransformObj(originalStyle.transform!)
        ruleV = transform[key]
      }
      let toVal = ruleV !== undefined
        ? ruleV
        : transitionSupportedProperty[key]
      const shareVal = shareValMap[key].value
      if (percentExp.test(`${toVal}`) && !percentExp.test(shareVal as string) && !isNaN(+shareVal)) {
        // 获取到的toVal为百分比格式化shareValMap为百分比
        shareValMap[key].value = `${shareVal as number * 100}%`
      } else if (percentExp.test(shareVal as string) && !percentExp.test(toVal as string) && !isNaN(+toVal)) {
        // 初始值为百分比则格式化toVal为百分比
        toVal = `${toVal * 100}%`
      } else if (typeof toVal !== typeof shareVal) {
        // 动画起始值和终态值类型不一致报错提示一下
        error(`[Mpx runtime error]: Value types of property ${key} must be consistent during the animation`)
      }
      // console.log(`key=${key} oldVal=${shareValMap[key].value} newVal=${toVal}`)
      const { delay = 0, duration, easing } = transitionMap[isTransformKey ? 'transform' : key]
      // console.log('animationOptions=', { delay, duration, easing })
      let callback
      if (transitionend && (!isTransformKey || !transformTransitionendDone)) {
        runOnJSCallbackRef.current = {
          animationCallback: (duration: number, finished: boolean, current?: AnimatableValue) => {
            transitionend(finished, current, duration)
          }
        }
        callback = (finished?: boolean, current?: AnimatableValue) => {
          'worklet'
          // 动画结束后设置下一次transformOrigin
          if (finished) {
            runOnJS(runOnJSCallback)('animationCallback', duration, finished, current)
          }
        }
      }
      const animation = getAnimation({ key, value: toVal! }, { delay, duration, easing }, callback)
      // Todo transform 有多个属性时也仅执行一次 transitionend（对齐wx）
      if (isTransformKey) {
        transformTransitionendDone = true
      }
      shareValMap[key].value = animation
      // console.log(`useTransitionHooks, ${key}=`, animation)
    })
  }
  // 从 transition 获取 AnimatedKeys
  function getAnimatedStyleKeys () {
    return Object.keys(transitionMap).reduce((animatedKeys, key) => {
      if (key === 'transform' && originalStyle.transform) {
        Object.keys(getTransformObj(originalStyle.transform)).forEach((prop: string) => {
          animatedKeys.push(prop)
        })
      } else {
        // 非 transform 属性可以不定义 style， 使用初始值动画
        animatedKeys.push(key)
      }
      return animatedKeys
    }, [] as string[])
  }
  // 获取动画样式&驱动动画
  function startAnimation () {
    // 更新动画样式 key map
    animatedKeys.current = getAnimatedStyleKeys()
    animatedStyleKeys.value = formatAnimatedKeys(animatedKeys.current)
    // 驱动动画
    createAnimation(animatedKeys.current)
  }
  // ** style 更新
  useEffect(() => {
    console.log('useEffect originalStyle animationDeps=', animationDeps.current, originalStyle)
    // 首次不执行
    if (!animationDeps.current) {
      animationDeps.current = 1
      // 更新 lastStyleRef
      updateStyleVal()
      return
    }
    if (updateStyleVal()) startAnimation()
  }, [originalStyle])
  // ** 清空动画
  useEffect(() => {
    return () => {
      Object.values(shareValMap).forEach((value) => {
        cancelAnimation(value)
      })
    }
  }, [])
  // ** 生成动画样式
  return useAnimatedStyle(() => {
    // console.info(`useAnimatedStyle styles=`, originalStyle)
    return animatedStyleKeys.value.reduce((styles, key) => {
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
      // console.log('animationStyle', styles)
      return styles
    }, {} as ExtendedViewStyle)
  })
}
