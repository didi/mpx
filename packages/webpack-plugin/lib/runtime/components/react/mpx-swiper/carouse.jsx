/**
 * react-native-swiper
 */
import React, { Component, useRef } from 'react'
import PropTypes from 'prop-types'
import {
  Animated,
  Easing,
  Text,
  View,
  ScrollView,
  Dimensions,
  Platform
} from 'react-native'

/**
 * Default styles
 * @type {StyleSheetPropType}
 */
const styles = {
  container_x: {
    backgroundColor: 'transparent',
    position: 'relative',
    flex: 1
  },
  container_y: {
    backgroundColor: '#ebeaaa', // 测试用
    position: 'relative',
  },

  wrapperIOS: {
    backgroundColor: 'transparent'
  },

  wrapperAndroid: {
    backgroundColor: 'transparent',
    flex: 1
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
    backgroundColor: 'transparent'
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
    backgroundColor: 'transparent'
  }
}

// missing `module.exports = exports['default'];` with babel6
// export default React.createClass({
export default class extends Component {
  /**
   * Props Validation
   * @type {Object}
   */
  static propTypes = {
    horizontal: PropTypes.bool,
    children: PropTypes.node.isRequired,
    containerStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.number]),
    style: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.number,
      PropTypes.array
    ]),
    scrollViewStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.number]),
    pagingEnabled: PropTypes.bool,
    showsHorizontalScrollIndicator: PropTypes.bool,
    showsVerticalScrollIndicator: PropTypes.bool,
    bounces: PropTypes.bool,
    scrollsToTop: PropTypes.bool,
    removeClippedSubviews: PropTypes.bool,
    automaticallyAdjustContentInsets: PropTypes.bool,
    showsPagination: PropTypes.bool,
    loop: PropTypes.bool,
    autoplay: PropTypes.bool,
    autoplayTimeout: PropTypes.number,
    autoplayDirection: PropTypes.bool,
    index: PropTypes.number,
    renderPagination: PropTypes.func,
    dotColor: PropTypes.string,
    activeDotColor: PropTypes.string,
    /**
     * Called when the index has changed because the user swiped.
     */
    onIndexChanged: PropTypes.func
  }

  /**
   * Default props
   * @return {object} props
   * @see http://facebook.github.io/react-native/docs/scrollview.html
   */
  static defaultProps = {
    // --------scroll-view的参数默认值----start-----
    horizontal: true,
    pagingEnabled: true,
    showsHorizontalScrollIndicator: false,
    showsVerticalScrollIndicator: false,
    bounces: false,
    scrollsToTop: false,
    removeClippedSubviews: true,
    automaticallyAdjustContentInsets: false,
    // --------scroll-view的参数-----end----
    showsPagination: true,
    loop: true,
    autoplay: false,
    autoplayTimeout: 2.5,
    autoplayDirection: true,
    index: 0,
    onIndexChanged: () => null
  }

  /**
   * Init states
   * @return {object} states
   */
  state = this.initState(this.props)

  /**
   * Initial render flag
   * @type {bool}
   */
  initialRender = true

  /**
   * autoplay timer
   * @type {null}
   */
  autoplayTimer = null
  loopJumpTimer = null
  animate = this.initAnimate()

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (!nextProps.autoplay && this.autoplayTimer)
      clearTimeout(this.autoplayTimer)
    if (nextProps.index === this.props.index) return
    this.setState(
      this.initState(nextProps, this.props.index !== nextProps.index)
    )
  }

  componentDidMount() {
    this.autoplay()
  }

  componentWillUnmount() {
    this.autoplayTimer && clearTimeout(this.autoplayTimer)
    this.loopJumpTimer && clearTimeout(this.loopJumpTimer)
  }

  UNSAFE_componentWillUpdate(nextProps, nextState) {
    if (this.state.index !== nextState.index)
      this.props.onIndexChanged(nextState.index)
  }

  componentDidUpdate(prevProps) {
    if (this.props.autoplay && !prevProps.autoplay) {
      this.autoplay()
    }
    if (this.props.children !== prevProps.children) {
      this.setState(
        this.initState({ ...this.props, index: this.state.index }, true)
      )
    }
  }

  initAnimate() {
    console.info('---------------luyongfang-initAnimate', this.props.easingFunction)
    if (this.props.easingFunction) {
      let opacity = new Animated.Value(0);
      const animate = easing => {
        opacity.setValue(0);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1200,
          easing,
          useNativeDriver: true,
        }).start();
      };
      console.info('---------------luyongfang-this.animate', animate)
      return animate
    }
  }
  initState(props, updateIndex = false) {
    const state = this.state || { width: 0, height: 0, offset: { x: 0, y: 0 } }

    const initState = {
      autoplayEnd: false,
      children: null,
      loopJump: false,
      offset: {}
    }

    initState.children = Array.isArray(props.children)
      ? props.children.filter(child => child)
      : props.children

    initState.total = initState.children ? initState.children.length || 1 : 0

    if (state.total === initState.total && !updateIndex) {
      // retain the index
      initState.index = state.index
    } else {
      initState.index =
        initState.total > 1 ? Math.min(props.index, initState.total - 1) : 0
    }

    // Default: horizontal
    const { width, height } = Dimensions.get('window')
    console.info('---------luyongfang-dimension', width, height, props.width, this.state && this.state.width, props.height, this.state && this.state.height)

    initState.dir = props.horizontal === false ? 'y' : 'x'

    if (props.width) {
      initState.width = props.width
    } else if (this.state && this.state.width) {
      initState.width = this.state.width
    } else {
      initState.width = width
    }

    if (props.height) {
      initState.height = props.height
    } else if (this.state && this.state.height) {
      initState.height = this.state.height
    } else {
      // initState.height = height
      initState.height = 100
    }
    initState.offset[initState.dir] =
      initState.dir === 'y' ? height * props.index : width * props.index

    this.internals = {
      ...this.internals,
      isScrolling: false
    }
    console.info('-------------luyongfang-initState', initState)
    return initState
  }

  // include internals with state
  fullState() {
    return Object.assign({}, this.state, this.internals)
  }

  onLayout = event => {
    const { width, height } = event.nativeEvent.layout
    const offset = (this.internals.offset = {})
    const state = { width, height }
    console.info('--------------luyongfang-onLayout', width, height, this.props.horizontal)
    if (this.state.dir === 'y') {
      return
    }

    if (this.state.total > 1) {
      let setup = this.state.index
      if (this.props.loop) {
        setup++
      }
      console.info('-------------------dir', this.state.dir, width, setup)
      offset[this.state.dir] =
        this.state.dir === 'y' ? height * setup : width * setup
    }

    if (!this.state.offset) {
      state.offset = offset
    }

    if (this.initialRender && this.state.total > 1) {
      this.scrollView.scrollTo({ ...offset, animated: false })
      this.initialRender = false
    }
    this.setState(state)
    console.info('--------------luyongfang onLayout', state)
  }
  /**
   * 垂直方向滚动时
  */
  onItemLayout = event => {
    if (this.state.dir === 'x') {
      return
    }
    const { width, height } = event.nativeEvent.layout
    console.info('------------luyongfang onItemLayout', width, height)
    const offset = (this.internals.offset = {})
    const state = { width, height }
    if (this.state.total > 1) {
      let setup = this.state.index
      if (this.props.loop) {
        setup++
      }
      console.info('-------------------dir', this.state.dir, width, setup)
      offset[this.state.dir] =
        this.state.dir === 'y' ? height * setup : width * setup
    }

    if (!this.state.offset) {
      state.offset = offset
    }

    if (this.initialRender && this.state.total > 1) {
      this.scrollView.scrollTo({ ...offset, animated: false })
      this.initialRender = false
    }
    console.info('--------------luyongfang-onLayout-2', state)
    this.setState(state)
  }

  loopJump = () => {
    if (!this.state.loopJump) return
    const i = this.state.index + (this.props.loop ? 1 : 0)
    const scrollView = this.scrollView
    this.loopJumpTimer = setTimeout(
      () => {
        if (scrollView.setPageWithoutAnimation) {
          scrollView.setPageWithoutAnimation(i)
        } else {
          if (this.state.index === 0) {
            scrollView.scrollTo(
              this.props.horizontal === false
                ? { x: 0, y: this.state.height, animated: false }
                : { x: this.state.width, y: 0, animated: false }
            )
          } else if (this.state.index === this.state.total - 1) {
            this.props.horizontal === false
              ? this.scrollView.scrollTo({
                  x: 0,
                  y: this.state.height * this.state.total,
                  animated: false
                })
              : this.scrollView.scrollTo({
                  x: this.state.width * this.state.total,
                  y: 0,
                  animated: false
                })
          }
        }
      },
      scrollView.setPageWithoutAnimation ? 50 : 300
    )
  }

  /**
   * Automatic rolling
   */
  autoplay = () => {
    if (
      !Array.isArray(this.state.children) ||
      !this.props.autoplay ||
      this.internals.isScrolling ||
      this.state.autoplayEnd
    )
      return

    this.autoplayTimer && clearTimeout(this.autoplayTimer)
    this.autoplayTimer = setTimeout(() => {
      if (
        !this.props.loop &&
        (this.props.autoplayDirection
          ? this.state.index === this.state.total - 1
          : this.state.index === 0)
      )
        return this.setState({ autoplayEnd: true })

      this.scrollBy(this.props.autoplayDirection ? 1 : -1)
    }, this.props.autoplayTimeout * 1000)
  }

  /**
   * 当用户开始拖动此视图时调用此函数。
   */
  onScrollBegin = e => {
    this.internals.isScrolling = true
    this.props.onScrollBeginDrag &&
      this.props.onScrollBeginDrag(e, this.fullState(), this)
  }

  /*
   * 当用户停止拖动此视图时调用此函数。如果是第一个或者最后一个禁止滚动
   */
  onScrollEndDrag = e => {
    const { contentOffset } = e.nativeEvent
    const { horizontal } = this.props
    const { children, index } = this.state
    const { offset } = this.internals
    const previousOffset = horizontal ? offset.x : offset.y
    const newOffset = horizontal ? contentOffset.x : contentOffset.y

    if (previousOffset === newOffset && (index === 0 || index === children.length - 1)
    ) {
      this.internals.isScrolling = false
    }
  }

  /**
  * 滚动动画结束时调用此函数，更新scrollView的xy偏移量
  * @params e scrollView的事件
  */
  onScrollEnd = e => {
    this.internals.isScrolling = false
    console.info('------------luyongfang-onScrollEnd', e.nativeEvent, this.props.nextMargin)
    if (!e.nativeEvent.contentOffset) {
      if (this.state.dir === 'x') {
        e.nativeEvent.contentOffset = {
          x: e.nativeEvent.position * this.state.width
        }
      } else {
        e.nativeEvent.contentOffset = {
          y: e.nativeEvent.position * this.state.height
        }
      }
    }
    this.updateIndex(e.nativeEvent.contentOffset, this.state.dir, () => {
      this.autoplay()
      this.loopJump()
    })
    this.props.onMomentumScrollEnd &&
      this.props.onMomentumScrollEnd(e, this.fullState(), this)
  }

  /**
   * 更新当前滑动到的index索引
   * @params offset: scrollView元素的偏移量，e.nativeEvent.contentOffset = 设置初始的滚动坐标
   * @params dir: 水平x、垂直y
   * @params cb 回调函数
   */
  updateIndex = (offset, dir, cb) => {
    const state = this.state
    // Android ScrollView will not scrollTo certain offset when props change
    let index = state.index
    // Android ScrollView will not scrollTo certain offset when props change
    if (!this.internals.offset) {
      this.internals.offset = {}
    }
    // Android not setting this onLayout first? https://github.com/leecade/react-native-swiper/issues/582
    const diff = offset[dir] - this.internals.offset[dir]
    console.info('------------luyongfang-updateIndex:1', offset, this.internals, diff)
    if (!diff) return

    const step = dir === 'x' ? state.width : state.height
    let loopJump = false
    index = parseInt(index + Math.round(diff / step))

    if (this.props.loop) {
      if (index <= -1) {
        index = state.total - 1
        offset[dir] = step * state.total
        loopJump = true
      } else if (index >= state.total) {
        index = 0
        offset[dir] = step
        loopJump = true
      }
    }

    const newState = {}
    newState.index = index
    newState.loopJump = loopJump
    console.info('------------luyongfang updateIndex:2', index, diff, step, newState)
    this.internals.offset = offset

    if (loopJump) {
      if (offset[dir] === this.internals.offset[dir]) {
        newState.offset = { x: 0, y: 0 }
        newState.offset[dir] = offset[dir] + 1
        this.setState(newState, () => {
          this.setState({ offset: offset }, cb)
        })
      } else {
        newState.offset = offset
        this.setState(newState, cb)
      }
    } else {
      this.setState(newState, cb)
    }
  }

  /**
   * autoplay模式下初始化
   */

  scrollBy = (index, animated = true) => {
    if (this.internals.isScrolling || this.state.total < 2) return
    const state = this.state
    const diff = (this.props.loop ? 1 : 0) + index + this.state.index
    let x = 0
    let y = 0
    if (state.dir === 'x') x = diff * state.width
    if (state.dir === 'y') y = diff * state.height

    this.scrollView && this.scrollView.scrollTo({ x, y, animated })

    // update scroll state
    this.internals.isScrolling = true
    this.setState({
      autoplayEnd: false
    })

    // trigger onScrollEnd manually in android
    if (!animated || Platform.OS !== 'ios') {
      setImmediate(() => {
        this.onScrollEnd({
          nativeEvent: {
            position: diff
          }
        })
      })
    }
  }

  /**
   * 滚动到特定的位置
   */

  scrollTo = (index, animated = true) => {
    if (
      this.internals.isScrolling ||
      this.state.total < 2 ||
      index == this.state.index
    )
      return

    const state = this.state
    const diff = this.state.index + (index - this.state.index)

    let x = 0
    let y = 0
    if (state.dir === 'x') x = diff * state.width
    if (state.dir === 'y') y = diff * state.height

    this.scrollView && this.scrollView.scrollTo({ x, y, animated })

    // update scroll state
    this.internals.isScrolling = true
    this.setState({
      autoplayEnd: false
    })

    // trigger onScrollEnd manually in android
    if (!animated || Platform.OS !== 'ios') {
      setImmediate(() => {
        this.onScrollEnd({
          nativeEvent: {
            position: diff
          }
        })
      })
    }
  }

  scrollViewPropOverrides = () => {
    const props = this.props
    let overrides = {}

    /*
    const scrollResponders = [
      'onMomentumScrollBegin',
      'onTouchStartCapture',
      'onTouchStart',
      'onTouchEnd',
      'onResponderRelease',
    ]
    */

    for (let prop in props) {
      // if(~scrollResponders.indexOf(prop)
      if (
        typeof props[prop] === 'function' &&
        prop !== 'onMomentumScrollEnd' &&
        prop !== 'renderPagination' &&
        prop !== 'onScrollBeginDrag'
      ) {
        let originResponder = props[prop]
        overrides[prop] = e => originResponder(e, this.fullState(), this)
      }
    }

    return overrides
  }

  /**
   * 渲染指示点
   */
  renderPagination = () => {
    // By default, dots only show when `total` >= 2
    if (this.state.total <= 1) return null

    let dots = []
    const ActiveDot = this.props.activeDot || (
      <View
        style={[
          {
            backgroundColor: this.props.activeDotColor || '#007aff',
            width: 8,
            height: 8,
            borderRadius: 4,
            marginLeft: 3,
            marginRight: 3,
            marginTop: 3,
            marginBottom: 3
          }
        ]}
      />
    )
    const Dot = this.props.dot || (
      <View
        style={[
          {
            backgroundColor: this.props.dotColor || 'rgba(0,0,0,.2)',
            width: 8,
            height: 8,
            borderRadius: 4,
            marginLeft: 3,
            marginRight: 3,
            marginTop: 3,
            marginBottom: 3
          }
        ]}
      />
    )
    for (let i = 0; i < this.state.total; i++) {
      dots.push(
        i === this.state.index
          ? React.cloneElement(ActiveDot, { key: i })
          : React.cloneElement(Dot, { key: i })
      )
    }
    return (
      <View
        pointerEvents="none"
        style={[
          styles['pagination_' + this.state.dir],
          this.props.paginationStyle
        ]}
      >
        {dots}
      </View>
    )
  }

  refScrollView = view => {
    this.scrollView = view
  }

  onPageScrollStateChanged = state => {
    switch (state) {
      case 'dragging':
        return this.onScrollBegin()

      case 'idle':
      case 'settling':
        if (this.props.onTouchEnd) this.props.onTouchEnd()
    }
  }

  renderScrollView = pages => {
    let style = {}
    return (
      <ScrollView
        ref={this.refScrollView}
        {...this.props}
        overScrollMode="always"
        contentContainerStyle={[styles.wrapperIOS, this.props.style]}
        contentOffset={this.state.offset}
        onScrollBeginDrag={this.onScrollBegin}
        onMomentumScrollEnd={this.onScrollEnd}
        onScrollEndDrag={this.onScrollEndDrag}
        {...this.scrollViewPropOverrides()}
      >
        {pages}
      </ScrollView>
    )
  }

  renderPages() {
    const { width, height, dir, total, children } = this.state
    const { showsPagination, loop, easingFunction, previousMargin, nextMargin } = this.props
    const pageStyle = { width: width, height: height }
    let pages = []
    if (total > 1) {
      pages = Object.keys(children)
      /* 无限循环的时候 */
      if (loop) {
        pages.unshift(total - 1 + '')
        pages.push('0')
      }
      // 支持的动画
      let easingMap = {
        linear: Easing.linear,
        easeInCubic: Easing.in,
        easeOutCubic: Easing.out,
        easeInOutCubic: Easing.inOut
      }
      console.info('----------luyongfang renderPages:3 before', easingFunction, this.animate)
      if (easingFunction && this.animate) {
        const easing = easingMap[easingFunction]
        const animatedStyle = this.animate(easing)
        console.info('----------luyongfang renderPages:3', animatedStyle)
        pages = pages.map((page, i) => {
          return (
            <Animated.View style={[pageStyle, animatedStyle]} key={ 'animate' + i} onLayout={this.onItemLayout}>
              {children[page]}
            </Animated.View>
          )
        })
      } else {
        pages = pages.map((page, i) => {
          let pageStyle2 = { width: width, height: height }
          const extraStyle = {}

          if (previousMargin) {
             extraStyle.left = previousMargin
          }
          if (nextMargin && this.state.index === i - 1) {
            const half = Math.floor(nextMargin / 2)
            extraStyle.marginLeft = - half
            extraStyle.paddingLeft = half
          }
          /*
          if ( i - 1 === this.state.index && nextMargin) {
            pageStyle2.width = width - nextMargin
          }
          */
          console.info('----------luyongfang renderPages:4', i, nextMargin, pageStyle2, this.state.index, extraStyle)
          return (
            <View style={[pageStyle2, extraStyle]} key={ 'page' + i} onLayout={this.onItemLayout}>
              {children[page]}
            </View>
          )
        })
      }
    } else {
      pages = (
        <View style={pageStyle} key={0}>
          {children}
        </View>
      )
    }
    return pages
  }
  /**
   * 渲染DOM节点
   */
  render() {
    const { width, height, dir, total, children } = this.state
    const { showsPagination, loop, nextMargin } = this.props
    let pages = this.renderPages()

    const vStyle = {}
    if (dir === 'y') {
      vStyle.height = height
    }
    if (dir === 'x') {
    }
    // 垂直滚动高度设置为和子元素一样的高度
    const strStyle = 'container_' + dir
    console.info('---------------------luyongfang---render---', width, height, vStyle, styles[strStyle], pages)
    return (
      <View style={[styles[strStyle], vStyle]} onLayout={this.onLayout}>
        {this.renderScrollView(pages)}
        {showsPagination && this.renderPagination()}
      </View>
    )
  }
}
