import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Carouse from './carouse'

/**
 * class="resource-banner-swiper-item"
 * style 获取不到
*/
export const SwiperWrapper = (props) => {
 const {
  children
 } = props
  const onChange = (e) => {
    console.log(e)
  }
  const swiperProp = {
    loop: props.circular,
    index: props.current,
    onIndexChanged: props.onChange,
    autoplay: props.autoplay,
    showsPagination: props.indicatorDots,
    dotColor: props.indicatorColor,
    activeDotColor: props.indicatorActiveColor,
    horizontal: props.vertical !== undefined ? !props.vertical : true,
    onMomentumScrollEnd: props.animationfinish,
    dotStyle: {
      backgroundColor: '#bcbcbc'
    },
    style: props.style,
    easingFunction: props.easingFunction,
    previousMargin: props.previousMargin,
    nextMargin: props.nextMargin
  }
  console.log('-----------luyongfang-swiperProp', swiperProp)
  // 中滑线自动转驼峰再哪里实现的
  // style={{height: 300, backgroundColor: '#ababab'}}
  /*
  {"autoplay": true,
  "children": [<SwiperItem><View … /></SwiperItem>, <SwiperItem><View … /></SwiperItem>, <SwiperItem><View … /></SwiperItem>], 
  "circular": true, 
  "current": 0, 
  "easingFunction": "easeOutCubic", 
  "indicatorDots": true, 
  "interval": 5000, 
  "onChange": [Function onChange], 
  "style": [{}], "test": "height: 150;background: red;"}     
  */
  return (
      <Carouse {...swiperProp}>
        {children}
      </Carouse>

  )
}

export default SwiperWrapper
