/**
 * ✔ scrollX(scroll-x)
 * ✔ scrollY(scroll-y)
 * ✔ upperThreshold(upper-threshold)
 * ✔ lowerThreshold(lower-threshold)
 * ✔ scrollTop(scroll-top)
 * ✔ scrollLeft(scroll-left)
 * ✘ scroll-into-view
 * ✘ enable-passive
 * ✔ refresher-enabled
 * ✘ refresher-threshold
 * 	 refresher-default-style
 * ✔ refresher-background: android
 * ✔ refresher-triggered
 * ✔ onScrollBeginDrag(binddragstart)
 * ✔ onScrollEndDrag(binddragend)
 * ✔ bindrefresherrefresh
 *   enable-flex
 * ✘ scroll-anchoring
 * ✔ paging-enabled
 * ✘ using-sticky
 * ✘ bindrefresherpulling
 * ✘ bindrefresherrestore
 * ✘ bindrefresherabort
 * ✔ show-scrollbar
 * ✘ fast-deceleration
 * ✔ binddragging
 * ✔ scrollWithAnimation(scroll-with-animation)
 * ✔ enableBackToTop(enable-back-to-top)
 * ✔ onScrollToUpper(bindscrolltoupper)
 * ✔ onScrollToLower(bindscrolltolower)
 * ✔ onScroll(bindscroll)
 */

import { ScrollView, RefreshControl } from 'react-native';
import React, { useRef, useState, useEffect } from 'react';
import useInnerTouchable, { extendEvent, getCustomEvent } from './getInnerListeners';

function _ScrollView(props) {
  const {
    children,
    scrollX,
    scrollY,
    enableBackToTop,
    enhanced,
    bounces,
    showScrollBar,
    pagingEnabled,
    upperThreshold = 50,
    lowerThreshold = 50,
    scrollWithAnimation,
    refresherEnabled,
    refresherBackground,
    refreshControlConfig = {},
  } = props;
  const [snapScrollTop, setSnapScrollTop] = useState(0);
  const [snapScrollLeft, setSnapScrollLeft] = useState(0);
  const [refreshing, setRefreshing] = useState(true);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const scrollOptions = useRef({
    contentLength: 0,
    offset: 0,
    offsetX: 0,
    offsetY: 0,
    visibleLength: 0,
  });
  const scrollViewRef = useRef(null);
  const scrollEventThrottle = 50;
  const hasCallScrollToUpper = useRef(true);
  const hasCallScrollToLower = useRef(false);
  const initialTimeout = useRef(null);
  useEffect(() => {
    if (
      snapScrollTop !== props.scrollTop ||
      snapScrollLeft !== props.scrollLeft
    ) {
      setSnapScrollTop(props.scrollTop || 0);
      setSnapScrollLeft(props.scrollLeft || 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.scrollTop, props.scrollLeft]);

  useEffect(() => {
    if (refreshing !== props.refresherTriggered) {
      setRefreshing(props.refresherTriggered);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.refresherTriggered]);

  useEffect(() => {
    if (!props.scrollX && !props.scrollY) {
      setScrollEnabled(false);
    } else {
      setScrollEnabled(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.scrollX, props.scrollY]);

  useEffect(() => {
    if (snapScrollTop || snapScrollLeft) {
      initialTimeout.current = setTimeout(() => {
        scrollToOffset(snapScrollLeft, snapScrollTop);
      }, 0);
    }

    return () => {
      clearTimeout(initialTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapScrollTop, snapScrollLeft]);

  function selectLength(size) {
    return !scrollX ? size.height : size.width;
  }

  function selectOffset(position) {
    return !scrollX ? position.y : position.x;
  }

  function onStartReached(e) {
    const { onScrollToUpper } = props;
    const { offset } = scrollOptions.current;
    if (onScrollToUpper && offset <= upperThreshold) {
      if (!hasCallScrollToUpper.current) {
        onScrollToUpper(
          getCustomEvent('scrolltoupper', e, {
            detail: {
              direction: scrollX ? 'left' : 'top',
            },
            target: {
              offsetLeft: scrollOptions.current.offsetX || 0,
              offsetTop: scrollOptions.offsetY || 0,
            },
          }),
        );
        hasCallScrollToUpper.current = true;
      }
    } else {
      hasCallScrollToUpper.current = false;
    }
  }

  function onEndReached(e) {
    const { onScrollToLower } = props;
    const { contentLength, visibleLength, offset } = scrollOptions.current;
    const distanceFromEnd = contentLength - visibleLength - offset;
    if (onScrollToLower && distanceFromEnd < lowerThreshold) {
      if (!hasCallScrollToLower.current) {
        hasCallScrollToLower.current = true;
        onScrollToLower(
          getCustomEvent('scrolltolower', e, {
            detail: {
              direction: scrollX ? 'right' : 'botttom',
            },
            target: {
              offsetLeft: scrollOptions.current.offsetX || 0,
              offsetTop: scrollOptions.offsetY || 0,
            },
          }),
        );
      }
    } else {
      hasCallScrollToLower.current = false;
    }
  }

  function onContentSizeChange(width, height) {
    scrollOptions.current.contentLength = selectLength({ height, width });
  }

  function onLayout(e) {
    scrollOptions.current.visibleLength = selectLength(e.nativeEvent.layout);
  }

  function onScroll(e) {
    const { onScroll } = props;
    const { x: scrollLeft, y: scrollTop } = e.nativeEvent.contentOffset;
    const { width: scrollWidth, height: scrollHeight } = e.nativeEvent.contentSize
    onScroll &&
      onScroll(
        getCustomEvent('scroll', e, {
          detail: {
            scrollLeft,
            scrollTop,
            scrollHeight,
            scrollWidth,
            deltaX: scrollLeft - scrollOptions.current.offsetX,
            deltaY: scrollTop - scrollOptions.current.offsetY,
          },
          target: {
            offsetLeft: scrollLeft,
            offsetTop: scrollTop,
          },
        }),
      );

    const visibleLength = selectLength(e.nativeEvent.layoutMeasurement);
    const contentLength = selectLength(e.nativeEvent.contentSize);
    const offset = selectOffset(e.nativeEvent.contentOffset);
    scrollOptions.current = {
      contentLength,
      offset,
      offsetX: scrollLeft,
      offsetY: scrollTop,
      visibleLength,
    };
    onStartReached(e);
    onEndReached(e);
  }

  function scrollToOffset(x = 0, y = 0) {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x, y, animated: !!scrollWithAnimation });
    }
  }

  function onRefresh(e) {
    const { onRefresherrefresh } = props;
    onRefresherrefresh &&
      onRefresherrefresh(
        getCustomEvent('refresherrefresh', e, {
          target: {
            offsetLeft: scrollOptions.current.offsetX || 0,
            offsetTop: scrollOptions.offsetY || 0,
          },
        }),
      );
  }

  function onTouchStart(e) {
    const { onDragstart, onTouchstart } = props;
    onTouchstart && onTouchstart(e);
    onDragstart &&
      onDragstart(
        extendEvent(e, {
          detail: {
            scrollLeft: scrollOptions.current.offsetX || 0,
            scrollTop: scrollOptions.offsetY || 0,
          },
        }),
      );
  }

  function onTouchMove(e) {
    const { onDragging, onTouchmove } = props;
    onTouchmove && onTouchmove(e);
    onDragging &&
      onDragging(
        extendEvent(e, {
          detail: {
            scrollLeft: scrollOptions.current.offsetX || 0,
            scrollTop: scrollOptions.offsetY || 0,
          },
        }),
      );
  }

  function onTouchEnd(e) {
    const { onDragend, onTouchend } = props;
    onTouchend && onTouchend(e);
    onDragend &&
      onDragend(
        extendEvent(e, {
          detail: {
            scrollLeft: scrollOptions.current.offsetX || 0,
            scrollTop: scrollOptions.offsetY || 0,
          },
        }),
      );
  }

  let scrollElementProps = {
    pinchGestureEnabled: false,
    horizontal: scrollX,
    onScroll: onScroll,
    onContentSizeChange: onContentSizeChange,
    onLayout: onLayout,
    scrollEventThrottle: scrollEventThrottle,
    scrollsToTop: !!enableBackToTop,
    showsHorizontalScrollIndicator: !!(scrollX && showScrollBar),
    showsVerticalScrollIndicator: !!(scrollY && showScrollBar),
    scrollEnabled: scrollEnabled,
    ref: scrollViewRef,
  };
  if (enhanced) {
    scrollElementProps = {
      ...scrollElementProps,
      bounces: !bounces,
      pagingEnabled: !pagingEnabled,
      refreshControl: refresherEnabled ? (
        <RefreshControl
          progressBackgroundColor={refresherBackground}
          refreshing={refreshing}
          onRefresh={onRefresh}
          {...refreshControlConfig}
        />
      ) : null,
    };
  }
  const innerTouchable = useInnerTouchable({
    onTouchStart: onTouchStart,
    onTouchEnd: onTouchEnd,
    onTouchMove: onTouchMove,
  });
  return (
    <ScrollView {...scrollElementProps} {...innerTouchable}>
      {children}
    </ScrollView>
  );
}
_ScrollView.displayName = '_ScrollView';

export default _ScrollView
