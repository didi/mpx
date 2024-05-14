/**
 * ✔ hover-class	
 * ✘ hover-stop-propagation
 * ✔ hover-start-time	
 * ✔ hover-stay-time
 */
import { View, ViewProps, ViewStyle, NativeSyntheticEvent} from 'react-native'
import * as React from 'react'
import { useImperativeHandle } from 'react'

// @ts-ignore
import useInnerTouchable from './getInnerListeners';


export interface _ViewProps extends ViewProps {
  style?: Array<ViewStyle>;
  children?: React.ReactNode;
  hoverStyle: Array<ViewStyle>;
  bindtouchstart?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void;
  bindtouchmove?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void;
  bindtouchend?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void;
}

function getDefaultStyle(style: Array<ViewStyle> = []) {
  const mergeStyle: ViewStyle = Object.assign({}, ...style)
  if (mergeStyle['display'] === 'flex') {
    mergeStyle['flexDirection'] = mergeStyle['flexDirection'] || 'row'
  }
  return mergeStyle
}


const _View:React.FC<_ViewProps & React.RefAttributes<any>> = React.forwardRef((props: _ViewProps, ref: React.ForwardedRef<any>) => {
  const { 
    style,
    children,
    hoverStyle,
    ...otherProps } = props
  const [isHover, setIsHover] = React.useState(false)

  const mergeStyle: ViewStyle = style ? getDefaultStyle(style) : {}
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
    const { bindtouchstart } = props;
    bindtouchstart && bindtouchstart(e)
    setStartTimer()
  }

  function onTouchEnd(e: NativeSyntheticEvent<TouchEvent>){
    const { bindtouchend } = props;
    bindtouchend && bindtouchend(e)
    setStayTimer()
  }

  const innerTouchable = useInnerTouchable({
    ...props,
    bindtouchstart: onTouchStart,
    bindtouchend: onTouchEnd
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
      style={ [ mergeStyle, isHover && hoverStyle ] }
    >
      {children}
    </View>
  )
})

_View.displayName = '_View'

export default _View


