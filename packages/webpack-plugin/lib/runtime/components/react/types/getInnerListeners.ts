import { MutableRefObject } from 'react'
import { NativeSyntheticEvent } from 'react-native'
import { GestureTouchEvent } from 'react-native-gesture-handler'

type LayoutRef = MutableRefObject<any>

type SetTimeoutReturnType = ReturnType<typeof setTimeout>

type Props = Record<string, any>

type AdditionalProps = Record<string, any>;

type RemoveProps = string[];

type NativeTouchEvent = NativeSyntheticEvent<NativeEvent>

interface NativeEvent {
  timestamp: number;
  pageX: number;
  pageY: number;
  touches: TouchPoint[]
  changedTouches: TouchPoint[]
}

interface TouchPoint {
  identifier: number;
  pageX: number;
  pageY: number;
  clientX: number;
  clientY: number;
  locationX?: number;
  locationY?: number;
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
interface UseInnerPropsConfig {
  layoutRef: LayoutRef;
  disableTouch?: boolean;
  disableTap?: boolean
}
interface DataSetType {
  [key: string]: string;
}

interface InnerProps {
  onTouchStart?: (e: GestureTouchEvent) => void;
  onTouchStartCapture?: (e: GestureTouchEvent) => void;
  onTouchMove?: (e: GestureTouchEvent) => void;
  onTouchMoveCapture?: (e: GestureTouchEvent) => void;
  onTouchEnd?: (e: GestureTouchEvent) => void;
  onTouchEndCapture?: (e: GestureTouchEvent) => void;
}
export {
  NativeTouchEvent,
  Props,
  AdditionalProps,
  RemoveProps,
  UseInnerPropsConfig,
  InnerRef,
  LayoutRef,
  SetTimeoutReturnType,
  DataSetType,
  InnerProps
}
