import React from 'react'

interface TouchEventDetail {
  x: number;
  y: number;
}

interface TouchPoint {
  identifier: number;
  pageX: number;
  pageY: number;
  clientX: number;
  clientY: number;
}

interface TouchEvent extends React.TouchEvent {
  type: string;
  timeStamp: number;
  target: {
    id: string;
    dataset: Record<string, string>;
    offsetLeft: number;
    offsetTop: number;
  };
  detail: TouchEventDetail;
  touches: TouchPoint[];
  changedTouches: TouchPoint[];
  persist: () => void;
  stopPropagation: () => void;
  preventDefault: () => void;
}

interface InnerRef {
  startTimer: {
    bubble: null | ReturnType<typeof setTimeout>;
    capture: null | ReturnType<typeof setTimeout>;
  };
  needPress: {
    bubble: boolean;
    capture: boolean;
  };
  mpxPressInfo: {
    detail: {
      x: number;
      y: number;
    };
  };
}

interface UseInnerPropsOptions {
  props?: Record<string, any>;
  additionalProps?: Record<string, any>;
  removeProps?: string[];
  config?: {
    layoutRef?: React.MutableRefObject<any>;
    disableTouch?: boolean
  };
}

interface TouchEventHandlers {
  onTouchStart?: (e: React.TouchEvent<HTMLElement>) => void;
  onTouchMove?: (e: React.TouchEvent<HTMLElement>) => void;
  onTouchEnd?: (e: React.TouchEvent<HTMLElement>) => void;
  onTouchCancel?: (e: React.TouchEvent<HTMLElement>) => void;
  onTouchStartCapture?: (e: React.TouchEvent<HTMLElement>) => void;
  onTouchMoveCapture?: (e: React.TouchEvent<HTMLElement>) => void;
  onTouchEndCapture?: (e: React.TouchEvent<HTMLElement>) => void;
  onTouchCancelCapture?: (e: React.TouchEvent<HTMLElement>) => void;
}

interface CustomEventDetail {
  [key: string]: any;
}
