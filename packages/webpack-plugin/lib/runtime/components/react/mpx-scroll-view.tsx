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

import { ScrollView, RefreshControl, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent, ScrollEvent } from 'react-native';
import React, { useRef, useState, useEffect, ReactNode, forwardRef, useImperativeHandle } from 'react';
import useInnerTouchable, { extendEvent, getCustomEvent } from './getInnerListeners';
interface ScrollViewProps {
  children?: ReactNode;
  enhanced?: boolean;
  bounces?: boolean;
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
  bindScrolltoupper?: (event: any) => void;
  bindScrolltolower?: (event: NativeSyntheticEvent<ScrollEvent> | unknown) => void;
  bindScroll?: (event: NativeSyntheticEvent<ScrollEvent> | unknown) => void;
  bindRefresherrefresh?: (event: unknown) => void;
  bindDragstart?: (event: NativeSyntheticEvent<DragEvent> | unknown) => void;
  bindDragging?: (event: NativeSyntheticEvent<DragEvent> | unknown) => void;
  bindDragend?: (event: NativeSyntheticEvent<DragEvent> | unknown) => void;
  bindTouchStart?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void;
  bindTouchMove?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void;
  bindTouchEnd?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void;
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
  offsetLeft?: number;
  offsetTop?: number;

};
const _ScrollView = forwardRef(function _ScrollView(props: ScrollViewProps = {}, ref) {
  const {
    children,
    enhanced,
    bounces,
    'scroll-x': scrollX,
    'scroll-y': scrollY,
    'enable-back-to-top': enableBackToTop,
    'show-scrollbar': showScrollBar,
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
    offsetX: 0,
    offsetY: 0,
    visibleLength: 0,
  });
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollEventThrottle = 50;
  const hasCallScrollToUpper = useRef(true);
  const hasCallScrollToLower = useRef(false);
  const initialTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    const { bindScrolltoupper } = props;
    const { offset } = scrollOptions.current;
    if (bindScrolltoupper && (offset <= upperThreshold)) {
      if (!hasCallScrollToUpper.current) {
        bindScrolltoupper(
          getCustomEvent('scrolltoupper', e, {
            detail: {
              direction: scrollX ? 'left' : 'top',
            },
            target: {
              offsetLeft: scrollOptions.current.offsetX || 0,
              offsetTop: scrollOptions.current.offsetY || 0,
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
    const { bindScrolltolower } = props;
    const { contentLength, visibleLength, offset } = scrollOptions.current;
    const distanceFromEnd = contentLength - visibleLength - offset;
    if (bindScrolltolower && (distanceFromEnd < lowerThreshold)) {
      if (!hasCallScrollToLower.current) {
        hasCallScrollToLower.current = true;
        bindScrolltolower(
          getCustomEvent('scrolltolower', e, {
            detail: {
              direction: scrollX ? 'right' : 'botttom',
            },
            target: {
              offsetLeft: scrollOptions.current.offsetX || 0,
              offsetTop: scrollOptions.current.offsetY || 0,
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
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { bindScroll } = props;
    const { x: scrollLeft, y: scrollTop } = e.nativeEvent.contentOffset;
    const { width: scrollWidth, height: scrollHeight } = e.nativeEvent.contentSize
    bindScroll &&
      bindScroll(
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
        }, props),
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

  function onRefresh() {
    const { bindRefresherrefresh } = props;
    bindRefresherrefresh &&
      bindRefresherrefresh(
        getCustomEvent('refresherrefresh', {}, {
          target: {
            offsetLeft: scrollOptions.current.offsetX || 0,
            offsetTop: scrollOptions.current.offsetY || 0,
          },
        }, props),
      );
  }

  function onScrollTouchStart(e: NativeSyntheticEvent<TouchEvent>) {
    const { bindDragstart, bindTouchStart } = props;
    bindTouchStart && bindTouchStart(e);
    bindDragstart &&
      bindDragstart(
        extendEvent(e, {
          detail: {
            scrollLeft: scrollOptions.current.offsetX || 0,
            scrollTop: scrollOptions.current.offsetY || 0,
          },
        }),
      );
  }

  function onScrollTouchMove(e: NativeSyntheticEvent<TouchEvent>) {
    const { bindDragging, bindTouchMove } = props;
    bindTouchMove && bindTouchMove(e);
    bindDragging &&
      bindDragging(
        extendEvent(e, {
          detail: {
            scrollLeft: scrollOptions.current.offsetX || 0,
            scrollTop: scrollOptions.current.offsetY || 0,
          },
        }),
      );
  }

  function onScrollTouchEnd(e: NativeSyntheticEvent<TouchEvent>) {
    const { bindDragend, bindTouchEnd } = props;
    bindTouchEnd && bindTouchEnd(e);
    bindDragend &&
      bindDragend(
        extendEvent(e, {
          detail: {
            scrollLeft: scrollOptions.current.offsetX || 0,
            scrollTop: scrollOptions.current.offsetY || 0,
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
    showsHorizontalScrollIndicator: !!(scrollX && showScrollBar),
    showsVerticalScrollIndicator: !!(scrollY && showScrollBar),
    scrollEnabled: scrollEnabled,
    ref: scrollViewRef
  };
  if (enhanced) {
    scrollElementProps = {
      ...scrollElementProps,
      bounces: bounces,
      pagingEnabled: !!pagingEnabled,
    };
  }

  const innerTouchable = useInnerTouchable({
    ...props,
    bindTouchStart: onScrollTouchStart,
    bindTouchEnd: onScrollTouchEnd,
    bindTouchMove: onScrollTouchMove,
    offsetLeft: scrollOptions.current.offsetX || 0,
    offsetTop: scrollOptions.current.offsetY || 0
  });
  const refreshColor = {
    'black': ['#000'],
    'white': ['#fff']
  }

  useImperativeHandle(ref, () => {
    return {
      type: 'scroll-view',
      context: {
        ...props,
        scrollTo: scrollToOffset
      },
      nodeRef: scrollViewRef.current
    }
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
