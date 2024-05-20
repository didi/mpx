/**
 * ✔ scroll-x
 * ✔ scroll-y
 * ✔ upper-threshold
 * ✔ lower-threshold
 * ✔ scroll-top
 * ✔ scroll-left
 * ✘ scroll-into-view
 * ✔ scroll-with-animation
 * ✔ enable-back-to-top
 * ✘ enable-passive
 * ✔ refresher-enabled
 * ✘ refresher-threshold
 * ✔ refresher-default-style(仅 android 支持)
 * ✔ refresher-background(仅 android 支持)
 * ✔ refresher-triggered
 * ✘ enable-flex(scroll-x，rn 默认支持)
 * ✘ scroll-anchoring
 * ✔ paging-enabled
 * ✘ using-sticky
 * ✔ show-scrollbar
 * ✘ fast-deceleration
 * ✔ binddragstart
 * ✔ binddragging
 * ✔ binddragend
 * ✔ bindrefresherrefresh
 * ✘ bindrefresherpulling
 * ✘ bindrefresherrestore
 * ✘ bindrefresherabort
 * ✔ bindscrolltoupper
 * ✔ bindscrolltolower
 * ✔ bindscroll
 */

import { ScrollView, RefreshControl, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent, ScrollEvent, ViewStyle } from 'react-native';
import React, { useRef, useState, useEffect, ReactNode, forwardRef, useImperativeHandle } from 'react';
import useInnerTouchable, { getCustomEvent } from './getInnerListeners';
import { factory } from 'typescript';
interface ScrollViewProps {
  children?: ReactNode;
  enhanced?: boolean;
  bounces?: boolean;
  style?: ViewStyle;
  'scroll-x'?: boolean;
  'scroll-y'?: boolean;
  'enable-back-to-top'?: boolean;
  'show-scrollbar'?: boolean;
  'paging-enabled'?: boolean;
  'upper-threshold'?: number;
  'lower-threshold'?: number;
  'scroll-with-animation'?: boolean;
  'refresher-triggered'?: boolean;
  'refresher-enabled'?: boolean;
  'refresher-default-style'?: 'black' | 'white' | 'none';
  'refresher-background'?: string;
  'scroll-top'?: number;
  'scroll-left'?: number;
  bindscrolltoupper?: (event: any) => void;
  bindscrolltolower?: (event: NativeSyntheticEvent<ScrollEvent> | unknown) => void;
  bindscroll?: (event: NativeSyntheticEvent<ScrollEvent> | unknown) => void;
  bindrefresherrefresh?: (event: unknown) => void;
  binddragstart?: (event: NativeSyntheticEvent<DragEvent> | unknown) => void;
  binddragging?: (event: NativeSyntheticEvent<DragEvent> | unknown) => void;
  binddragend?: (event: NativeSyntheticEvent<DragEvent> | unknown) => void;
  bindtouchstart?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void;
  bindtouchmove?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void;
  bindtouchend?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void;
}
type ScrollElementProps = {
  pinchGestureEnabled: boolean;
  horizontal: boolean;
  onScroll: (event: NativeSyntheticEvent<ScrollEvent>) => void;
  onContentSizeChange: (width: number, height: number) => void;
  onLayout: (event: LayoutChangeEvent) => void;
  scrollEventThrottle: number;
  scrollsToTop: boolean;
  showsHorizontalScrollIndicator: boolean;
  showsVerticalScrollIndicator: boolean;
  scrollEnabled: boolean;
  ref: React.RefObject<ScrollView>;
  bounces?: boolean;
  pagingEnabled?: boolean;
  style?: ViewStyle;

};
const _ScrollView = forwardRef(function _ScrollView(props: ScrollViewProps = {}, ref) {
  const {
    children,
    enhanced,
    bounces,
    style,
    'scroll-x': scrollX,
    'scroll-y': scrollY,
    'enable-back-to-top': enableBackToTop,
    'show-scrollbar': showScrollbar,
    'paging-enabled': pagingEnabled,
    'upper-threshold': upperThreshold = 50,
    'lower-threshold': lowerThreshold = 50,
    'scroll-with-animation': scrollWithAnimation,
    'refresher-enabled': refresherEnabled,
    'refresher-default-style': refresherDefaultStyle,
    'refresher-background': refresherBackground
  } = props;
  const [snapScrollTop, setSnapScrollTop] = useState(0);
  const [snapScrollLeft, setSnapScrollLeft] = useState(0);
  const [refreshing, setRefreshing] = useState(true);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const scrollOptions = useRef({
    contentLength: 0,
    offset: 0,
    offsetLeft: 0,
    offsetTop: 0,
    scrollLeft: 0,
    scrollTop: 0,
    visibleLength: 0,
  });
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollEventThrottle = 50;
  const hasCallScrollToUpper = useRef(true);
  const hasCallScrollToLower = useRef(false);
  const initialTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const _props = useRef(null)
  _props.current = props
  useEffect(() => {
    if (
      snapScrollTop !== props['scroll-top'] ||
      snapScrollLeft !== props['scroll-left']
    ) {
      setSnapScrollTop(props['scroll-top'] || 0);
      setSnapScrollLeft(props['scroll-left'] || 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props['scroll-top'], props['scroll-left']]);

  useEffect(() => {
    if (refreshing !== props['refresher-triggered']) {
      setRefreshing(!!props['refresher-triggered']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props['refresher-triggered']]);

  useEffect(() => {
    if (!props['scroll-x'] && !props['scroll-y']) {
      setScrollEnabled(false);
    } else {
      setScrollEnabled(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props['scroll-x'], props['scroll-y']]);

  useEffect(() => {
    if (snapScrollTop || snapScrollLeft) {
      initialTimeout.current = setTimeout(() => {
        scrollToOffset(snapScrollLeft, snapScrollTop);
      }, 0);
    }

    return () => {
      initialTimeout.current && clearTimeout(initialTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapScrollTop, snapScrollLeft]);

  function selectLength(size: { height: number; width: number }) {
    return !scrollX ? size.height : size.width;
  }

  function selectOffset(position: { x: number; y: number }) {
    return !scrollX ? position.y : position.x;
  }

  function onStartReached(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { bindscrolltoupper } = props;
    const { offset } = scrollOptions.current;
    if (bindscrolltoupper && (offset <= upperThreshold)) {
      if (!hasCallScrollToUpper.current) {
        bindscrolltoupper(
          getCustomEvent('scrolltoupper', e, {
            detail: {
              direction: scrollX ? 'left' : 'top',
            },
            target: {
              offsetLeft: scrollOptions.current.offsetLeft || 0,
              offsetTop: scrollOptions.current.offsetTop || 0,
            },
          }, props),
        );
        hasCallScrollToUpper.current = true;
      }
    } else {
      hasCallScrollToUpper.current = false;
    }
  }

  function onEndReached(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { bindscrolltolower } = props;
    const { contentLength, visibleLength, offset } = scrollOptions.current;
    const distanceFromEnd = contentLength - visibleLength - offset;
    if (bindscrolltolower && (distanceFromEnd < lowerThreshold)) {
      if (!hasCallScrollToLower.current) {
        hasCallScrollToLower.current = true;
        bindscrolltolower(
          getCustomEvent('scrolltolower', e, {
            detail: {
              direction: scrollX ? 'right' : 'botttom',
            },
            target: {
              offsetLeft: scrollOptions.current.offsetLeft || 0,
              offsetTop: scrollOptions.current.offsetTop || 0,
            },
          }, props),
        );
      }
    } else {
      hasCallScrollToLower.current = false;
    }
  }

  function onContentSizeChange(width: number, height: number) {
    scrollOptions.current.contentLength = selectLength({ height, width });
  }

  function onLayout(e: LayoutChangeEvent) {
    scrollOptions.current.visibleLength = selectLength(e.nativeEvent.layout);
    scrollOptions.current.offsetLeft = e.nativeEvent.layout.x || 0
    scrollOptions.current.offsetTop = e.nativeEvent.layout.y || 0
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { bindscroll } = props;
    const { x: scrollLeft, y: scrollTop } = e.nativeEvent.contentOffset;
    const { width: scrollWidth, height: scrollHeight } = e.nativeEvent.contentSize
    bindscroll &&
      bindscroll(
        getCustomEvent('scroll', e, {
          detail: {
            scrollLeft,
            scrollTop,
            scrollHeight,
            scrollWidth,
            deltaX: scrollLeft - scrollOptions.current.scrollLeft,
            deltaY: scrollTop - scrollOptions.current.scrollTop,
          },
          target: {
            offsetLeft: scrollOptions.current.offsetLeft,
            offsetTop: scrollOptions.current.offsetTop,
          },
        }, props),
      );

    const visibleLength = selectLength(e.nativeEvent.layoutMeasurement);
    const contentLength = selectLength(e.nativeEvent.contentSize);
    const offset = selectOffset(e.nativeEvent.contentOffset);
    scrollOptions.current = {
      ...scrollOptions.current,
      contentLength,
      offset,
      scrollLeft,
      scrollTop,
      visibleLength,
    };
    onStartReached(e);
    onEndReached(e);
  }

  function scrollToOffset(x = 0, y = 0) {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x, y, animated: !!scrollWithAnimation });
      scrollOptions.current.scrollLeft = x
      scrollOptions.current.scrollTop = y
    }
  }

  function onRefresh() {
    const { bindrefresherrefresh } = props;
    bindrefresherrefresh &&
      bindrefresherrefresh(
        getCustomEvent('refresherrefresh', {}, {
          target: {
            offsetLeft: scrollOptions.current.offsetLeft || 0,
            offsetTop: scrollOptions.current.offsetTop || 0,
          },
        }, props),
      );
  }

  function onScrollTouchStart(e: NativeSyntheticEvent<TouchEvent>) {
    const { binddragstart, bindtouchstart } = props;
    bindtouchstart && bindtouchstart(e);
    binddragstart &&
      binddragstart(
        getCustomEvent('dragstart', e, {
          detail: {
            scrollLeft: scrollOptions.current.scrollLeft || 0,
            scrollTop: scrollOptions.current.scrollTop || 0,
          },
        }),
      );
  }

  function onScrollTouchMove(e: NativeSyntheticEvent<TouchEvent>) {
    const { binddragging, bindtouchmove } = props;
    bindtouchmove && bindtouchmove(e);
    binddragging &&
      binddragging(
        getCustomEvent('dragging', e, {
          detail: {
            scrollLeft: scrollOptions.current.scrollLeft || 0,
            scrollTop: scrollOptions.current.scrollTop || 0,
          },
        }),
      );
  }

  function onScrollTouchEnd(e: NativeSyntheticEvent<TouchEvent>) {
    const { binddragend, bindtouchend } = props;
    bindtouchend && bindtouchend(e);
    binddragend &&
      binddragend(
        getCustomEvent('dragend', e, {
          detail: {
            scrollLeft: scrollOptions.current.scrollLeft || 0,
            scrollTop: scrollOptions.current.scrollTop || 0,
          },
        }),
      );
  }
  let scrollElementProps: ScrollElementProps = {
    pinchGestureEnabled: false,
    horizontal: !!scrollX,
    onScroll: onScroll,
    onContentSizeChange: onContentSizeChange,
    onLayout: onLayout,
    scrollEventThrottle: scrollEventThrottle,
    scrollsToTop: !!enableBackToTop,
    showsHorizontalScrollIndicator: !!(scrollX && showScrollbar),
    showsVerticalScrollIndicator: !!(scrollY && showScrollbar),
    scrollEnabled: scrollEnabled,
    ref: scrollViewRef,
    style
  };
  if (enhanced) {
    scrollElementProps = {
      ...scrollElementProps,
      bounces: !!bounces,
      pagingEnabled: !!pagingEnabled,
    };
  }

  const innerTouchable = useInnerTouchable({
    ...props,
    bindtouchstart: onScrollTouchStart,
    bindtouchend: onScrollTouchEnd,
    bindtouchmove: onScrollTouchMove,
    offsetLeft: scrollOptions.current.offsetLeft || 0,
    offsetTop: scrollOptions.current.offsetTop || 0
  });
  const refreshColor = {
    'black': ['#000'],
    'white': ['#fff']
  }

  useImperativeHandle(ref, () => {
    // return createNodesRef(
    //   _props,
    //   {
    //     nodeRef: scrollViewRef,
    //     scrollOffset: scrollOptions,
    //     node: {
    //       scrollEnabled,
    //       bounces: !!bounces,
    //       showScrollbar: !!showScrollbar,
    //       pagingEnabled: !!pagingEnabled,
    //       fastDeceleration: false,
    //       decelerationDisabled: false,
    //       scrollTo: scrollToOffset
    //     }
    //   })
  })
  return (
    <ScrollView
      {...scrollElementProps}
      {...innerTouchable}
      refreshControl={refresherEnabled ? (
        <RefreshControl
          progressBackgroundColor={refresherBackground}
          refreshing={refreshing}
          onRefresh={onRefresh}
          {...(refresherDefaultStyle && refresherDefaultStyle !== 'none' ? { colors: refreshColor[refresherDefaultStyle] } : {})}
        />
      ) : null}
    >
      {children}
    </ScrollView>
  );
})

_ScrollView.displayName = '_ScrollView';

export default _ScrollView
