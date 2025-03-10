import { MutableRefObject } from 'react'
import { NativeSyntheticEvent } from 'react-native'

type LayoutRef = MutableRefObject<any>

type SetTimeoutReturnType = ReturnType<typeof setTimeout>

type Props = Record<string, any>

type AdditionalProps = Record<string, any>;

type RemoveProps = string[];

type NativeTouchEvent = NativeSyntheticEvent<NativeEvent>

type Navigation = Record<string, any> | undefined

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
  mpxPressInfo: {
    detail: {
      x: number;
      y: number;
    };
  };
   needPress: {
    bubble: boolean;
    capture: boolean;
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
  Navigation
}
