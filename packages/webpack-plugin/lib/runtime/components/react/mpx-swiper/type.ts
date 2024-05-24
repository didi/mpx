import { ReactNode } from 'react'
import { NativeSyntheticEvent } from 'react-native'
export interface SwiperProps {
  children?: ReactNode;
  circular?: boolean;
  current?: number;
  interval?: number;
  autoplay?: boolean;
  duration?: number;
  'indicator-dots'?: boolean;
  'indicator-color'?: string;
  'indicator-active-color'?: string;
  vertical?: boolean;
  style?: string;
  easingFunction?: string;
  'previous-margin'?: string;
  'next-margin'?: string;
  bindchange?:  (event: NativeSyntheticEvent<TouchEvent> | unknown) => void;
}

export interface CarouseProps {
  children?: ReactNode;
  circular?: boolean;
  current: number;
  autoplay?: boolean;
  duration?: number;
  interval?: number;
  showsPagination?: boolean;
  dotColor?: string;
  activeDotColor?: string;
  horizontal?: boolean;
  style?: string;
  easingFunction?: string;
  previousMargin?: string;
  nextMargin?: string;
  bindchange: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void;
  getInnerLayout: Function
}

export interface CarouseState {
  children: Array<ReactNode> | ReactNode,
  width: number;
  height: number;
  index: number;
  total: number;
  // 设置scrollView初始的滚动坐标，contentOffset
  offset: {
    x: number,
    y: number
  };
  // 是否结束自动轮播，手动设置滚动到具体位置时结束
  autoplayEnd: boolean;
  loopJump: boolean;
  dir: string;
}

export interface ScrollElementProps {
  pagingEnabled: boolean,
  showsHorizontalScrollIndicator: boolean,
  showsVerticalScrollIndicator: boolean,
  bounces: boolean,
  scrollsToTop: boolean,
  removeClippedSubviews: boolean,
  automaticallyAdjustContentInsets: boolean,
  horizontal: boolean
}