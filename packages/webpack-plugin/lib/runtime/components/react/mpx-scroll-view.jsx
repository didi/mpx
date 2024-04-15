/**
 * @see https://facebook.github.io/react-native/docs/scrollview.html
 *
 * 注意事项：
 *   一般地，ScrollView 外面要套一个 View 并在这个 View 上设置高度，否则会出现 ScrollView 撑满外层出现不能滚动的假象
 *   hack: scrollTop 在设置过一次后经过滚动再次设置时失效，因为 state 没变，所以这时可以通过设置一个比 0 小的值
 *
 * ✔ scrollX(scroll-x): Either-or
 * ✘ scrollY(scroll-y): Either-or
 * ✔ upperThreshold(upper-threshold)
 * ✔ lowerThreshold(lower-threshold)
 * ✔ scrollTop(scroll-top)
 * ✔ scrollLeft(scroll-left)
 * ✘ scroll-into-view
 * ✔ scrollWithAnimation(scroll-with-animation)
 * ✔ enableBackToTop(enable-back-to-top)
 * ✔ onScrollToUpper(bindscrolltoupper)
 * ✔ onScrollToLower(bindscrolltolower)
 * ✔ onScroll(bindscroll)
 */

import * as React from 'react'
import {
  ScrollView,
  FlatList,
  StyleSheet
} from 'react-native'
import { omit, noop } from './utils'

// const SCROLLVIEW_CONT_STYLE = [
//   // Source code of ScrollView, ['alignItems','justifyContent']
//   'alignItems',
//   'justifyContent',
//   // Other
// ]

class _ScrollView extends React.Component {
  static defaultProps = {
    upperThreshold: 50,
    lowerThreshold: 50,
    enableBackToTop: false
  }

  static getDerivedStateFromProps(props, state) {
    return state.snapScrollTop !== props.scrollTop || state.snapScrollLeft !== props.scrollLeft
      ? {
        snapScrollTop: props.scrollTop || 0,
        snapScrollLeft: props.scrollLeft || 0
      }
      : null
  }

  state = {
    snapScrollTop: 0,
    snapScrollLeft: 0
  }

  _scrollMetrics = {
    contentLength: 0,
    dOffset: 0,
    dt: 10,
    offset: 0,
    offsetX: 0,
    offsetY: 0,
    timestamp: 0,
    velocity: 0,
    visibleLength: 0
  }

  $scrollView = React.createRef()
  _hasDataChangedSinceEndReached
  _sentEndForContentLength = 0
  _scrollEventThrottle = 50
  _hasCallScrollToUpperInRange = true
  _hasCallScrollToLowerInRange = false
  _initialScrollIndexTimeout

  _selectLength = (metrics) => {
    return !this.props.scrollX ? metrics.height : metrics.width
  }

  _selectOffset = (metrics) => {
    return !this.props.scrollX ? metrics.y : metrics.x
  }

  _maybeCallOnStartReached = () => {
    const { onScrollToUpper, upperThreshold } = this.props
    const { offset } = this._scrollMetrics
    if (onScrollToUpper && offset <= upperThreshold) {
      if (!this._hasCallScrollToUpperInRange) {
        onScrollToUpper({ distanceFromTop: offset })
        this._hasCallScrollToUpperInRange = true
      }
    } else {
      this._hasCallScrollToUpperInRange = false
    }
  }

  _maybeCallOnEndReached = () => {
    const { onScrollToLower, lowerThreshold } = this.props
    const { contentLength, visibleLength, offset } = this._scrollMetrics
    const distanceFromEnd = contentLength - visibleLength - offset
    // _hasDataChangedSinceEndReached的用处是???
    // if (onScrollToLower &&
    //     distanceFromEnd < lowerThreshold &&
    //     (this._hasDataChangedSinceEndReached || contentLength !== this._sentEndForContentLength)) {
    if (onScrollToLower && distanceFromEnd < lowerThreshold) {
      if (!this._hasCallScrollToLowerInRange) {
        this._hasDataChangedSinceEndReached = false
        this._hasCallScrollToLowerInRange = true
        this._sentEndForContentLength = this._scrollMetrics.contentLength
        onScrollToLower({ distanceFromEnd })
      }
    } else {
      this._hasCallScrollToLowerInRange = false
    }
  }

  _onContentSizeChange = (width, height) => {
    this._scrollMetrics.contentLength = this._selectLength({ height, width })
    // this._maybeCallOnStartReached()
    // this._maybeCallOnEndReached()
  }

  _onScrollEndDrag = (e) => {
    const { velocity } = e.nativeEvent
    if (velocity) {
      this._scrollMetrics.velocity = this._selectOffset(velocity)
    }
  }

  _onMomentumScrollEnd = () => {
    this._scrollMetrics.velocity = 0
  }

  _onLayout = (e) => {
    this._scrollMetrics.visibleLength = this._selectLength(e.nativeEvent.layout)
    // this._maybeCallOnStartReached()
    // this._maybeCallOnEndReached()
  }

  _onScroll = (e) => {
    const { onScroll = noop } = this.props
    const scrollLeft = e.nativeEvent.contentOffset.x
    const scrollTop = e.nativeEvent.contentOffset.y
    const scrollHeight = e.nativeEvent.contentSize.height
    const scrollWidth = e.nativeEvent.contentSize.width
    onScroll({
      detail: {
        scrollLeft,
        scrollTop,
        scrollHeight,
        scrollWidth,
        deltaX: scrollLeft - this._scrollMetrics.offsetX,
        deltaY: scrollTop - this._scrollMetrics.offsetY
      }
    })

    const timestamp = e.timeStamp
    const visibleLength = this._selectLength(e.nativeEvent.layoutMeasurement)
    const contentLength = this._selectLength(e.nativeEvent.contentSize)
    const offset = this._selectOffset(e.nativeEvent.contentOffset)
    const dt = Math.max(1, timestamp - this._scrollMetrics.timestamp)
    const dOffset = offset - this._scrollMetrics.offset
    const velocity = dOffset / dt
    this._scrollMetrics = {
      contentLength,
      dt,
      dOffset,
      offset,
      offsetX: scrollLeft,
      offsetY: scrollTop,
      timestamp,
      velocity,
      visibleLength
    }
    this._maybeCallOnStartReached()
    this._maybeCallOnEndReached()
  }

  scrollToOffset = (x = 0, y = 0) => {
    const { scrollX, data, renderItem } = this.props
    const node = this.$scrollView.current
    if (node) {
      if (data && renderItem) {
        node.scrollToOffset({ offset: scrollX ? x : y, animated: !!this.props.scrollWithAnimation })
      } else {
        (node as ScrollView).scrollTo({ x, y, animated: !!this.props.scrollWithAnimation })
      }
    }
  }

  componentDidMount() {
    if (this.state.snapScrollTop || this.state.snapScrollLeft) {
      this._initialScrollIndexTimeout = setTimeout(() => {
        this.scrollToOffset(this.state.snapScrollLeft, this.state.snapScrollTop)
      }, 0)
    }
  }

  getSnapshotBeforeUpdate(prevProps, prevState) {
    if (prevProps.scrollTop !== undefined) {
      return (
        this._scrollMetrics.offsetY !== this.state.snapScrollTop ||
        this._scrollMetrics.offsetX !== this.state.snapScrollLeft
      )
    }
    return (
      prevState.snapScrollTop !== this.state.snapScrollTop || prevState.snapScrollLeft !== this.state.snapScrollLeft
    )
  }

  componentDidUpdate(_prevProps, _prevState, snapshot) {
    if (snapshot) {
      this.scrollToOffset(this.state.snapScrollLeft, this.state.snapScrollTop)
    }
  }

  componentWillUnmount() {
    this._initialScrollIndexTimeout && clearTimeout(this._initialScrollIndexTimeout)
  }

  render() {
    const { children, style, scrollX, enableBackToTop, contentContainerStyle, data, renderItem } = this.props

    const flattenStyle = StyleSheet.flatten(style)
    const wrapperStyle = omit(flattenStyle, ['alignItems', 'justifyContent'])
    const _contentContainerStyle = {}
    if (flattenStyle) {
      flattenStyle.alignItems && (_contentContainerStyle.alignItems = flattenStyle.alignItems)
      flattenStyle.justifyContent && (_contentContainerStyle.justifyContent = flattenStyle.justifyContent)
    }

    const scrollElementProps = {
      horizontal: scrollX,
      onContentSizeChange: this._onContentSizeChange,
      onLayout: this._onLayout,
      onScroll: this._onScroll,
      onScrollEndDrag: this._onScrollEndDrag,
      onMomentumScrollEnd: this._onMomentumScrollEnd,
      scrollEventThrottle: this._scrollEventThrottle,
      scrollsToTop: !!enableBackToTop,
      style: wrapperStyle,
      contentContainerStyle: [_contentContainerStyle, contentContainerStyle],
      ...omit(this.props, [
        // props
        'style',
        'scrollX',
        'upperThreshold',
        'lowerThreshold',
        'scrollTop',
        'scrollLeft',
        'scrollWithAnimation',
        'enableBackToTop',
        'onScrollToUpper',
        'onScrollToLower',
        'onScroll',
        'contentContainerStyle',
        // SProps
        'horizontal',
        'onContentSizeChange',
        'onLayout',
        'onScroll',
        'onScrollEndDrag',
        'onMomentumScrollEnd',
        'scrollsToTop',
        'style',
        'contentContainerStyle',
        'data',
        'renderItem',
        'keyExtractor'
      ]),
      ref: this.$scrollView
    }

    // eslint-disable-next-line multiline-ternary
    return data && renderItem ? (
      <FlatList
        {...scrollElementProps}
        data={data}
        renderItem={renderItem}
        keyExtractor={(_item, index) => index + ''}
      />
    ) : (
      <ScrollView {...scrollElementProps}>{children}</ScrollView>
    )
  }
}

export default _ScrollView
