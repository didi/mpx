/**
 * swiper 实现
 */
import { Animated, Easing, View, ScrollView, Dimensions, LayoutChangeEvent, NativeSyntheticEvent, NativeScrollEvent, NativeScrollPoint } from 'react-native'
import { JSX, forwardRef, useState, useRef, useEffect, ReactNode } from 'react'
import Swiper from 'react-native-swiper'
import { CarouseProps, CarouseState } from './type'
import { EaseMap } from './ease'
import { getCustomEvent } from '../getInnerListeners'
import useNodesRef, { HandlerRef } from '../useNodesRef' // 引入辅助函数

/**
 * 默认的Style类型
 */
const styles: { [key: string]: Object } = {
  container_x: {
    position: 'relative',
  },
  container_y: {
    position: 'relative',
  },
  pagination_x: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pagination_y: {
    position: 'absolute',
    right: 15,
    top: 0,
    bottom: 0,
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
}


const _Carouse = forwardRef<HandlerRef<View, CarouseProps>, CarouseProps>((props , ref): JSX.Element => {
  // 默认取水平方向的width
  const { width } = Dimensions.get('window')
  const {
    styleObj,
    innerProps,
    circular,
    current,
    autoplay,
    horizontal,
    previousMargin = 0,
    nextMargin = 0,
    easingFunction = 'default',
    bindchange
  } = props
  // 存储layout布局信息
  const layoutRef = useRef({})
  const defaultWidth = (styleObj?.width || width || 375) - previousMargin - nextMargin
  const defaultHeight = (styleObj?.height || 150) - previousMargin - nextMargin

  const { nodeRef: SwiperRef } = useNodesRef<View, CarouseProps>(props, ref, {})

  const swiperConfig = {
    horizontal,
    loop: circular,
    index: current,
    autoplay: autoplay,
    width: defaultWidth,
    height: defaultHeight,
    onIndexChanged: (index: number) => {
      // getCustomEvent
      const eventData = getCustomEvent('change', {}, { detail: {current: index, source: 'touch' }, layoutRef: layoutRef })
      bindchange && bindchange(eventData)
    }
  }

  /**
   * 水平方向时，获取单个元素的布局，更新
  */
  function onWrapperLayout () {
    console.log('--------------onWrapperLayout---')
    if (props.enableOffset) {
      // @ts-ignore
      SwiperRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
        layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
        console.log('--------------onWrapperLayout--layoutRef.current-', layoutRef.current)
        props.getInnerLayout && props.getInnerLayout(layoutRef)
      })
    }
  }

  function onItemLayout () {
    console.log('-----onItemLayout-')
  }

  function renderSwiperItmes () {
    const { children } = props
    if (!Array.isArray(children)) {
      return (
        <View key={0}>
          {children}
        </View>
      )
    }
    let pages = Array.isArray(children) && Object.keys(children) || []
    let arrElements: (Array<ReactNode>) = []
    arrElements = pages.map((page, i) => {
      let commonStyle = { width: defaultWidth, height: defaultHeight }
      console.log('-----------------1-----', commonStyle)
      return (
        <View key={ 'page' + i} style={[commonStyle]} onLayout={onItemLayout}>
          {children[+page]}
        </View>
      )
    })
    return arrElements || []
  }

  function renderDots () {
    if (props.showsPagination) {
      const activeDotStyle = [          {
        backgroundColor: props.activeDotColor || '#007aff',
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 3,
        marginRight: 3,
        marginTop: 3,
        marginBottom: 3
      }]
      const dotStyle = [{
        backgroundColor: props.dotColor || 'rgba(0,0,0,.2)',
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 3,
        marginRight: 3,
        marginTop: 3,
        marginBottom: 3
      }]
      return {
        dot: <View style={dotStyle}></View>,
        activeDot: <View style={activeDotStyle}></View>,
        paginationStyle: {
          bottom: 70
        }
      }
    }
    return {}
  }

  const dotsConfg = {
    showsPagination: props.showsPagination,
    ...renderDots()
  }
  console.log('-----swiperConfig', swiperConfig)
  console.log('----------styleObj', styleObj)
  return (<View style={[{ position: 'relative'}, styleObj]}     onLayout={onWrapperLayout} ref={SwiperRef}>
    <Swiper style={[styleObj, { position: 'relative', flex: 1}]} {...innerProps} {...dotsConfg} {...swiperConfig}>
      {renderSwiperItmes()}
    </Swiper>
  </View>)
})

_Carouse.displayName = '_Carouse';

export default _Carouse
