/**
 * ✔ hover-class	
 * ✘ hover-stop-propagation
 * ✔ hover-start-time	
 * ✔ hover-stay-time
 */
import { View, Text, StyleProp, ViewProps, ViewStyle, NativeSyntheticEvent} from 'react-native'
import * as React from 'react'
import { useImperativeHandle } from 'react'

// @ts-ignore
import useInnerTouchable from './getInnerListeners';


export interface _ViewProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  hoverStyle: StyleProp<ViewStyle>;
  bindTouchStart?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void;
  bindTouchMove?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void;
  bindTouchEnd?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void;
}


const _View:React.FC<_ViewProps & React.RefAttributes<any>> = React.forwardRef((props: _ViewProps, ref: React.ForwardedRef<any>) => {
  const { 
    style,
    children,
    hoverStyle,
    ...otherProps } = props
  const [isHover, setIsHover] = React.useState(false)

  const dataRef = React.useRef<{
    startTimestamp: number,
    startTimer?: ReturnType<typeof setTimeout>
    stayTimer?: ReturnType<typeof setTimeout>
    props: any
  }>({
    startTimestamp: 0,
    props: props
  })

  React.useEffect(() => {
    return () => {
      dataRef.current.startTimer && clearTimeout(dataRef.current.startTimer)
      dataRef.current.stayTimer && clearTimeout(dataRef.current.stayTimer)
    }
  }, [dataRef])


  const setStartTimer = () => {
    const { hoverStyle, hoverStartTime = 50 } = dataRef.current.props
    if (hoverStyle) {
      dataRef.current.startTimer && clearTimeout(dataRef.current.startTimer)
      dataRef.current.startTimer = setTimeout(() => {
        setIsHover(() => true)
      }, hoverStartTime)
    }
  }

  const setStayTimer = () => {
    const { hoverStyle, hoverStayTime = 400 } = dataRef.current.props
    if (hoverStyle) {
      dataRef.current.stayTimer && clearTimeout(dataRef.current.stayTimer)
      dataRef.current.stayTimer = setTimeout(() => {
        setIsHover(() => false)
      }, hoverStayTime)
    }
  }

  function onTouchStart(e: NativeSyntheticEvent<TouchEvent>){
  const { bindTouchStart } = props;
  bindTouchStart && bindTouchStart(e)
  setStartTimer()
  }

  function onTouchEnd(e: NativeSyntheticEvent<TouchEvent>){
  const { bindTouchEnd } = props;
  bindTouchEnd && bindTouchEnd(e)
  setStayTimer()
  }

  const innerTouchable = useInnerTouchable({
    ...props,
    bindTouchStart: onTouchStart,
    bindTouchEnd: onTouchEnd
  });

  useImperativeHandle(ref, () => {
    return {
      // todo
    }
  }, [])

  return (
    <View
      ref={ref}
      {...{...otherProps, ...innerTouchable}}
      style={ [{ backgroundColor: 'transparent' }, style, isHover && hoverStyle] }
    >
      {children}
    </View>
  )
})

_View.displayName = '_View'

export default _View


