/**
 * swiper 实现
 */
import { Animated, Easing, View, ScrollView, Dimensions, LayoutChangeEvent, NativeSyntheticEvent, NativeScrollEvent, NativeScrollPoint } from 'react-native'
import { JSX, forwardRef, useState, useRef, useEffect, ReactNode } from 'react'
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

// next-margin , previous-margin: 宽度都会变短, 同时设置previous-margin,初始化offset为previous-margin
const _Carouse = forwardRef<HandlerRef<ScrollView, CarouseProps>, CarouseProps>((props , ref): JSX.Element => {
  // 默认取水平方向的width
  const { width } = Dimensions.get('window')
  const { styleObj, easingFunction = 'default', previousMargin = 0, nextMargin = 0 } = props
  const defaultHeight = (styleObj?.height || 150) - previousMargin - nextMargin
  const defaultWidth = (styleObj?.width || width || 375) - previousMargin - nextMargin
  const dir = props.horizontal === false ? 'y' : 'x'
  // state的offset默认值
  // const initIndex = props.circular ? props.current + 1: (props.current || 0)
  // 记录真正的下标索引, 不包括循环前后加入的索引, 游标
  const initIndex = props.current || 0
  // 这里要排除超过元素个数的设置
  const initOffsetIndex = initIndex + (props.circular ? 1 : 0)
  const defaultX = (defaultWidth * initOffsetIndex + previousMargin) || 0
  const defaultY = (defaultHeight * initOffsetIndex + previousMargin) || 0
  // 内部存储上一次的offset值
  const newChild = Array.isArray(props.children) ? props.children.filter(child => child) : props.children
  // 默认设置为初次渲染
  const initRenderRef = useRef(true)
  const autoplayTimerRef = useRef<ReturnType <typeof setTimeout> | null>(null)
  const { nodeRef: scrollViewRef } = useNodesRef<ScrollView, CarouseProps>(props, ref, {
  })
  const fadeAnim = useRef(new Animated.Value(dir === 'x' ? defaultX : defaultY)).current; // 1:初始化动画属性
  const autoplayEndRef = useRef(false)
  // 存储layout布局信息
  const layoutRef = useRef({})
  // 内部存储上一次的偏移量
  const internalsRef = useRef({
    offset: {
      x: defaultX || 0,
      y: defaultY || 0
    },
    isScrolling: false
  })
  const isDragRef = useRef(false)
  const [state, setState] = useState({
    children: newChild,
    width: defaultWidth || 375,
    height: defaultHeight,
    // 真正的游标索引
    index: initIndex,
    total: Array.isArray(newChild) ? newChild.length : ( newChild ? 1 : 0),
    offset: {
      x: dir === 'x' ? defaultX : 0,
      y: dir === 'y' ? defaultY: 0
    },
    loopJump: false,
    dir,
    isScrollEnd: true
  } as CarouseState);

  useEffect(() => {
    // 确认这个是变化的props变化的时候才执行，还是初始化的时候就执行
    if (props.autoplay) {
      startAutoPlay()
    } else {
      // startSwiperLoop()
    }
  }, [props.autoplay, props.current, state.index]);

  /**
   * 1. 更新index，指示条更新
   * 2. 视图的offset计算当前的索引, 目标值设置fadeAnim
   * 3. scrollViewOffset 如果是onScroll 就不是目标值了
  */
  function updateIndex (scrollViewOffset: NativeScrollPoint, useIndex = false) {
    const preOffset = internalsRef.current.offset[state.dir]
    const currentMoveOffset = scrollViewOffset[dir]
    let nextOffset = preOffset
    // const diff = scrollViewOffset[dir] - internalsRef.current.offset[state.dir]
    const diff = currentMoveOffset - preOffset
    console.log('--------------updateIndex-1--', internalsRef.current.offset)
    if (!diff) return
    const step = dir === 'x' ? state.width : state.height
    let newIndex = state.index + Math.round(diff / step)
    if (useIndex) {
      // 非循环时的计算, 循环的逻辑后面会覆盖
      newIndex = diff < 0 ? state.index - 1 : state.index + 1
    }
    let loopJump = false
    // let newIndex = useIndex ? state.index + 1 : state.index + Math.round(diff / step)
    // 若是循环circular
    // 1. 当前索引-1, 初始化为最后一个索引, 且scrollView的偏移量设置为 每个元素的步长 * 一共多少个元素， 这里为什么不减一呢
    // 2. 当前索引>total, 初始化为第一个元素，且scrollView的偏移量设置为一个元素的步长
    if (props.circular ) {
      if (newIndex > state.total - 1) {
        newIndex = 0
        // scrollViewOffset[state.dir] = step
        nextOffset = step
        loopJump = true
      } else if (newIndex < 0) {
        newIndex = state.total - 1
        // scrollViewOffset[state.dir] = step * state.total - 1
        nextOffset = step * state.total - 1
        loopJump = true
      }
    } else {
      // scrollViewOffset[state.dir] = step * newIndex
      nextOffset = step * newIndex
    }
    // 存储当前的偏移量, 这里是不是只用存储初始值就好了????
    // internalsRef.current.offset = scrollViewOffset
    const next = Object.assign({}, state.offset, {
      [state.dir]: nextOffset
    })
    internalsRef.current.offset = next
    console.log('--------------updateIndex----', newIndex, nextOffset)
    // 这里需不需要区分是否loop，初始化？？？？
    setState((preState) => {
      const newState =  {
        ...preState,
        // 索引用来指示游标
        index: newIndex,
        // offset用来指示当前scrollView的偏移量,用来计算拖拽的计算
        // offset: scrollViewOffset,
        offset: next,
        loopJump
      }
      return newState
    })
    // internalsRef.current.isScrolling = false
    // getCustomEvent
    const eventData = getCustomEvent('change', {}, { detail: {current: newIndex, source: 'touch' }, layoutRef: layoutRef })
    props.bindchange && props.bindchange(eventData)
    // 更新完状态之后, 开启新的loop
  }

  /**
   * 用户手动点击播放
   * 触发scrollView的onScrollEnd事件 => 然后更新索引 => 通过useEffect事件 => startSwiperLoop => 主动更新scrollView到指定的位置
   * 若是circular, 到最后一个索引会更新为0，但是视觉要scrollView到下一个
   * 若是circular, 到第一个再往前索引会更新为total-1, 但是视觉是展示的最后一个
  */
  function startSwiperLoop () {
    let offset = { x: 0, y: 0, animated: true}
    if (state.index > 0){
      offset = props.horizontal ? { x: state.width * state.index, y: 0, animated: true } : { x: 0, y: state.height * state.index, animated: true }
    }
    if (props.circular) {
      offset = props.horizontal ? { x: state.width * (state.index + 1), y: 0, animated: true } : { x: 0, y: state.height * (state.index + 1), animated: true }
    }
    console.log('--------------startSwiperLoop---', state.index, offset.x)
    /*
    Animated.timing(
      fadeAnim,
      {
        toValue: offset,
        easing: EaseMap[easingFunction],
        duration:  props.duration || 500,  // 动画时长
        useNativeDriver: true,  // 启用原生动画驱动
      }
    ).start();
    */
    internalsRef.current.offset = offset
  }

  /**
   * 开启自动轮播
   * 每间隔interval scrollView的offset更改到下一个位置，通过onScrollEnd来获取contentOffset再计算要更新的索引index
  */
  function startAutoPlay () {
    // 已经开启过autopaly则不重新创建
    if (!Array.isArray(state.children) || !props.autoplay || internalsRef.current.isScrolling || autoplayEndRef.current) {
      return
    }
    autoplayTimerRef.current && clearTimeout(autoplayTimerRef.current)
    // 非循环自动播放的形式下 到最后一帧 结束自动播放
    if (!props.circular && state.index === state.total -1) {
      autoplayEndRef.current = true
      return
    }
    
    // 开启自动播放
    autoplayTimerRef.current = setTimeout(() => {
      if (state.total < 2) return
      const nexStep = 1
      const toIndex = (props.circular ? 1 : 0) + nexStep + state.index
      let x = 0
      let y = 0
      if (state.dir === 'x') x = toIndex * state.width
      if (state.dir === 'y') y = toIndex * state.height
      // animated会影响切换的offset，先改为false
      console.log('----------------------------------startAutoPlay----')
      scrollViewRef.current?.scrollTo({ x, y, animated: true })

      internalsRef.current.isScrolling = true

      autoplayEndRef.current = false
      updateIndex({ x, y }, true)
    }, props.interval || 5000)
  }

  /**
   * 当用户开始拖动此视图时调用此函数, 更新当前在滚动态
   */
  function onScrollBegin () {
    // internalsRef.current.isScrolling = true
  }

  function onScroll (event: NativeSyntheticEvent<NativeScrollEvent>) {
    // 动画滚动呢? transform, 每次滚动完设置一个值, toValue设置另外一个值
    updateIndex(event.nativeEvent.contentOffset, true)
    console.log('-------------------------onScroll----', state.offset)
    if (!internalsRef.current.isScrolling) {
      console.log('-------------------------onScroll---1-', state.offset)
      internalsRef.current.isScrolling = true
      Animated.timing(
        fadeAnim,
        {
          toValue: state.offset,
          easing: EaseMap[easingFunction],
          duration:  props.duration || 500,  // 动画时长
          useNativeDriver: true,  // 启用原生动画驱动
        }
      ).start();
    }
  }
  /**
   * 当用户开始拖动结束
   */
  function onScrollEnd (event: NativeSyntheticEvent<NativeScrollEvent>) {
    state.isScrollEnd = true
    internalsRef.current.isScrolling = false
    fadeAnim.setValue(state.offset[state.dir])
    console.log('----------------onScrollEnd---', event.nativeEvent.contentOffset)
    // 用户手动滑动更新索引后，如果开启了自动轮播等重新开始
    // updateIndex(event.nativeEvent.contentOffset, true)
  }

  /**
   * 当拖拽结束时，检测是否可滚动
  */
  function onScrollEndDrag (event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset } = event.nativeEvent
    const { index, total } = state
    isDragRef.current = true
    console.log('------------onScrollEndDrag------', contentOffset)
    const internalOffset = internalsRef.current.offset
    const previousOffset = props.horizontal ? internalOffset.x : internalOffset.y
    const newOffset = props.horizontal ? contentOffset.x : contentOffset.y

    if (previousOffset === newOffset && (index === 0 || index === total - 1)) {
      internalsRef.current.isScrolling = false
    }
  }
  /**
   * 垂直方向时，获取单个元素的布局，更新
  */
  function onItemLayout (event: LayoutChangeEvent) {
    if (!initRenderRef.current || state.dir === 'x') return
    console.log('--------------onItemLayout---')
    const { width, height } = event.nativeEvent.layout
    if (state.total > 1) {
      internalsRef.current.offset[state.dir] = (state.dir === 'y' ? height * state.index : state.width * state.index)
    }

    if (!state.offset.x && !state.offset.y) {
      console.log('--------------onItemLayout---1')
      state.offset = internalsRef.current.offset
    }

    if (initRenderRef.current && state.total > 1) {
      scrollViewRef.current?.scrollTo({ ...internalsRef.current.offset, animated: true })
      initRenderRef.current = false
    }
    setState((preState) => {
      return {
        ...preState,
        height
      }
    })
  }
  /**
   * 水平方向时，获取单个元素的布局，更新
  */
  function onWrapperLayout () {
    console.log('--------------onWrapperLayout---')
    if (props.enableOffset) {
      // @ts-ignore
      scrollViewRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
        layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
        props.getInnerLayout && props.getInnerLayout(layoutRef)
      })
    }
    if (state.dir === 'y') return
    if (!state.offset.x && !state.offset.y) {
      state.offset = internalsRef.current.offset
    }
    if (!initRenderRef.current && state.total > 1) {
      scrollViewRef.current?.scrollTo({ ...state.offset, animated: true })
      initRenderRef.current = false
    }
  }

  function renderScrollView (pages: ReactNode) {
    const transformObj = state.dir === 'x' ? [{ translateX: fadeAnim }] : [{ translateY: fadeAnim }]
    let scrollElementProps = {
      ref: scrollViewRef,
      horizontal: props.horizontal,
      pagingEnabled: true,
      showsHorizontalScrollIndicator: false,
      showsVerticalScrollIndicator: false,
      bounces: false,
      scrollsToTop: false,
      removeClippedSubviews: true,
      automaticallyAdjustContentInsets: false,
      scrollEventThrottle: 1
    }
    return (
      <Animated.ScrollView
        {...scrollElementProps}
        style={[{height: defaultHeight}, { transform: transformObj }]}
        // style={[{height: defaultHeight}]}
        overScrollMode="always"
        contentOffset={state.offset}
        onScrollBeginDrag={onScrollBegin}
        onMomentumScrollEnd={onScrollEnd}
        // onScrollEndDrag={onScrollEndDrag}
        onScroll={onScroll}
      >
        {pages}
      </Animated.ScrollView>
    )
  }

  function renderPagination () {
    if (state.total <= 1) return null
    let dots: Array<ReactNode> = []
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
    for (let i = 0; i < state.total; i++) {
      if (i === state.index) {
        dots.push(<View style={activeDotStyle} key={i}></View>)
      } else {
        dots.push(<View style={dotStyle} key={i}></View>)
      }
    }
    return (
      <View
        pointerEvents="none"
        style={[styles['pagination_' + state.dir]]}
      >
        {dots}
      </View>
    )
  }
  
  function renderPages () {
    const { width, height, total, children } = state
    const { circular, previousMargin, nextMargin, innerProps } = props
    const pageStyle = { width: width, height: height }
    if (total > 1 && Array.isArray(children)) {
      let arrElements: (Array<ReactNode>) = []
      // pages = ["2", "0", "1", "2", "0"]
      let pages = Array.isArray(children) && Object.keys(children) || []
      /* 无限循环的时候 */
      if (circular) {
        pages.unshift(total - 1 + '')
        pages.push('0')
      }
      arrElements = pages.map((page, i) => {
        let commonStyle = { width: width, height: height }
        let animatedValue = i * width
        const animationStyles = {
          transform: [
            { translateX: animatedValue }
          ]
        }
        /*
        const extraStyle = {} as {
          left? : number;
          marginLeft?: number;
          paddingLeft?: number
        }

        if (previousMargin) {
            extraStyle.left = +previousMargin
        }
        if (nextMargin && state.index === i - 1) {
          const half = Math.floor(+nextMargin / 2)
          extraStyle.marginLeft = - half
          extraStyle.paddingLeft = half
        }
        */
        // 给View通过transform定义位置
        return (
          <Animated.View style={[commonStyle]} key={ 'page' + i} onLayout={onItemLayout}>
            {children[+page]}
          </Animated.View>
        )
      })
      return arrElements
    } else {
      return (
        <View style={pageStyle} key={0}>
          {children}
        </View>
      )
    }
  }

  const vStyle = {} as { height: number }
  if (dir === 'y') {
    vStyle.height = defaultHeight
  }
  const pages: Array<ReactNode> | ReactNode = renderPages()
  const strStyle: string = 'container_' + state.dir
  const eventProps = props.innerProps || {}

  return (<View>
    <View
      style={[styles[strStyle], vStyle, styleObj]}
      {...eventProps}
      onLayout={onWrapperLayout}>
      {renderScrollView(pages)}
    </View>
    <View>{props.showsPagination && renderPagination()}</View>
  </View>)
  
})

_Carouse.displayName = '_Carouse';

export default _Carouse
