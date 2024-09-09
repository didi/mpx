/**
 * swiper 实现
 */
import { Animated, View, ScrollView, Dimensions, NativeSyntheticEvent, NativeScrollEvent, NativeScrollPoint } from 'react-native'
import { JSX, forwardRef, useState, useRef, useEffect, ReactNode } from 'react'
import { CarouseProps, CarouseState } from './type'
import { getCustomEvent } from '../getInnerListeners'
import useNodesRef, { HandlerRef } from '../useNodesRef' // 引入辅助函数

/**
 * 默认的Style类型
 */
const styles: { [key: string]: Object } = {
  slide: {
    backgroundColor: 'transparent'
  },
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


const _Carouse = forwardRef<HandlerRef<ScrollView, CarouseProps>, CarouseProps>((props , ref): JSX.Element => {
  // 默认取水平方向的width
  const { width } = Dimensions.get('window')
  const { styleObj } = props
  // const defaultHeight = (styleObj?.height || 150) - previousMargin - nextMargin
  // const defaultWidth = (styleObj?.width || width || 375) - previousMargin - nextMargin
  const defaultHeight = (styleObj?.height || 150)
  const defaultWidth = (styleObj?.width || width || 375)
  const dir = props.horizontal === false ? 'y' : 'x'
  // state的offset默认值
  // const initIndex = props.circular ? props.current + 1: (props.current || 0)
  // 记录真正的下标索引, 不包括循环前后加入的索引, 游标
  const initIndex = props.current || 0
  // 这里要排除超过元素个数的设置
  const initOffsetIndex = initIndex + (props.circular ? 1 : 0)
  // const defaultX = (defaultWidth * initOffsetIndex + previousMargin) || 0
  // const defaultY = (defaultHeight * initOffsetIndex + previousMargin) || 0
  const defaultX = (defaultWidth * initOffsetIndex) || 0
  const defaultY = (defaultHeight * initOffsetIndex) || 0
  // 内部存储上一次的offset值
  const newChild = Array.isArray(props.children) ? props.children.filter(child => child) : props.children
  const autoplayTimerRef = useRef<ReturnType <typeof setTimeout> | null>(null)
  const { nodeRef: scrollViewRef } = useNodesRef<ScrollView, CarouseProps>(props, ref, {
  })
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
    dir
  } as CarouseState);

  function createAutoPlay () {
    autoplayTimerRef.current && clearTimeout(autoplayTimerRef.current)
    autoplayTimerRef.current = setTimeout(() => {
      startAutoPlay()
    }, props.interval || 500)
  }

  

  useEffect(() => {
    // 确认这个是变化的props变化的时候才执行，还是初始化的时候就执行
    if (props.autoplay) {
      createAutoPlay()
    }
  }, [props.autoplay, props.current, state.index, state.width, state.height]);

  /**
   * 更新index，以视图的offset计算当前的索引
   * scrollViewOffset: 移动到的目标位置
  */
  function updateIndex (scrollViewOffset: NativeScrollPoint, useIndex = false) {
    const { nextIndex, nextOffset } = getNextConfig(scrollViewOffset)
    internalsRef.current.offset = nextOffset
    setState((preState) => {
      const newState =  {
        ...preState,
        index: nextIndex,
        // offset用来指示当前scrollView的偏移量,用来计算拖拽的计算
        offset: nextOffset,
      }
      return newState
    })
    internalsRef.current.isScrolling = false
    // getCustomEvent
    const eventData = getCustomEvent('change', {}, { detail: {current: nextIndex, source: 'touch' }, layoutRef: layoutRef })
    props.bindchange && props.bindchange(eventData)
    // 更新完状态之后, 开启新的loop
  }

  function getNextConfig (scrollViewOffset: NativeScrollPoint) {
    const step = state.dir === 'x' ? state.width : state.height
    let currentOffset = state.offset
    let nextIndex = state.index + 1
    let nextOffset = currentOffset
    let autoMoveOffset = currentOffset
    let isBack = false
    let isAutoEnd = false
    // 如果是循环反向的
    if (scrollViewOffset?.[state.dir] < currentOffset[state.dir]) {
      isBack = true
    }
    if (!props.circular) {
      nextIndex = isBack ? nextIndex - 2 : nextIndex
      nextOffset = Object.assign({}, currentOffset, { [state.dir]: step * nextIndex })
    } else {
      if (nextIndex > state.total - 1) {
        autoMoveOffset = Object.assign({}, currentOffset, { [state.dir]: step * ( nextIndex + 1 )})
        nextIndex = 0
        nextOffset = Object.assign({}, currentOffset, { [state.dir]: step }),
        isAutoEnd = true
      } else {
        // nextIndex =  nextIndex,
        nextOffset = Object.assign({}, currentOffset, { [state.dir]: (nextIndex + 1) * step })
      }
    }
    return {
      nextIndex,
      nextOffset,
      autoMoveOffset,
      isAutoEnd
    }
  }

  /**
   * 开启自动轮播
   * 每间隔interval scrollView的offset更改到下一个位置，通过onScrollEnd来获取contentOffset再计算要更新的索引index
  */
  function startAutoPlay () {
    if (state.width && isNaN(+state.width)) {
      createAutoPlay()
      return
    }
    if (!Array.isArray(state.children) || !props.autoplay || internalsRef.current.isScrolling || autoplayEndRef.current) {
      return
    }
    const { nextIndex, nextOffset, autoMoveOffset, isAutoEnd } = getNextConfig(state.offset)
    // scrollViewRef.current?.scrollTo({ x: nextOffset['x'], y: nextOffset['y'], animated: true })
    // 这里可以scroll到下一个元素, 但是把scrollView的偏移量在设置为content,视觉效果就没了吧
    // scrollViewRef.current?.scrollTo({ x: nextOffset['x'], y: nextOffset['y'], animated: true })
    if (!isAutoEnd) {
      scrollViewRef.current?.scrollTo({ x: nextOffset['x'], y: nextOffset['y'], animated: true })
    } else {
      scrollViewRef.current?.scrollTo({ x: autoMoveOffset['x'], y: autoMoveOffset['y'], animated: true })
      if (isAutoEnd) {
          onScrollEnd({
            nativeEvent: {
              // @ts-ignore
              x: +nextOffset['x'],
              y: +nextOffset['y']
            }
          })
      }
    }

  }

  /**
   * 当用户开始拖动此视图时调用此函数, 更新当前在滚动态
   */
  function onScrollBegin () {
    internalsRef.current.isScrolling = true
  }

  /**
   * 当用户开始拖动结束
   */
  function onScrollEnd (event: NativeSyntheticEvent<NativeScrollEvent>) {
    internalsRef.current.isScrolling = false
    // 用户手动滑动更新索引后，如果开启了自动轮播等重新开始
    updateIndex(event.nativeEvent.contentOffset, true)
  }

  /**
   * 当拖拽结束时，检测是否可滚动
  */
  function onScrollEndDrag (event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset } = event.nativeEvent
    const { index, total } = state
    isDragRef.current = true
    const internalOffset = internalsRef.current.offset
    const previousOffset = props.horizontal ? internalOffset.x : internalOffset.y
    const moveOffset = props.horizontal ? contentOffset.x : contentOffset.y
    const diff = moveOffset - previousOffset
    if (diff > 0 && state.index + 1 >= total) {
      // const { nextOffset } = getNextConfig(contentOffset)
      // scrollViewRef.current?.scrollTo({ x: nextOffset['x'], y: nextOffset['y'], animated: false })
    } else if ( diff < 0 && state.index -1 < 0) {
      // const { nextOffset } = getNextConfig(contentOffset)
      // console.log('------------------diff<0 onScrollEnd-')
      // scrollViewRef.current?.scrollTo({ x: nextOffset['x'], y: nextOffset['y'], animated: false })
    }
    if (previousOffset === moveOffset && (index === 0 || index === total - 1)) {
      internalsRef.current.isScrolling = false
    }
  }

  /**
   * 水平方向时，获取元素的布局，更新
  */
  function onWrapperLayout () {
    if (props.enableOffset) {
      // @ts-ignore
      scrollViewRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
        layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
        if (state.width !== width) {
          // state.offset[state.dir] = initOffsetIndex * width
          let correctOffset = Object.assign({}, state.offset, { [state.dir]: initOffsetIndex * (state.dir === 'x' ? width : defaultHeight)})
          state.offset = correctOffset
          state.width = width
          setState((preState) => {
            return {
              ...preState,
              offset: correctOffset,
              width
            }
          })
          scrollViewRef.current?.scrollTo({ x: correctOffset['x'], y: correctOffset['y'], animated: false })
        }
        if (state.height !== height) {
          state.offset = Object.assign({}, state.offset, { [state.dir]: initOffsetIndex * (state.dir === 'x' ? defaultWidth : height)})
          state.height = height
        }
        props.getInnerLayout && props.getInnerLayout(layoutRef)
      })
    }
  }

  function renderScrollView (pages: ReactNode) {
    let scrollElementProps = {
      ref: scrollViewRef,
      horizontal: props.horizontal,
      pagingEnabled: true,
      showsHorizontalScrollIndicator: false,
      showsVerticalScrollIndicator: false,
      bounces: false,
      scrollsToTop: false,
      removeClippedSubviews: true,
      automaticallyAdjustContentInsets: false
    }
    const layoutStyle = dir === 'x' ? { width: defaultWidth, height: defaultHeight } : { width: defaultWidth }
    return (
      <Animated.ScrollView
        {...scrollElementProps}
        style={[layoutStyle]}
        overScrollMode="always"
        contentOffset={state.offset}
        onScrollBeginDrag={onScrollBegin}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEndDrag}
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
    const { circular } = props
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
        return (
          <View style={[pageStyle, styles.slide]} key={ 'page' + i}>
            {children[+page]}
          </View>
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
  const layoutStyle = dir === 'x' ? { width: defaultWidth, height: defaultHeight } : { width: defaultWidth }

  return (<View style={[layoutStyle, {backgroundColor: 'red'}]}>
    <View
      style={[styles[strStyle], layoutStyle]}
      {...eventProps}
      onLayout={onWrapperLayout}>
      {renderScrollView(pages)}
    </View>
    <View>{props.showsPagination && renderPagination()}</View>
  </View>)
  
})

_Carouse.displayName = '_Carouse';

export default _Carouse
