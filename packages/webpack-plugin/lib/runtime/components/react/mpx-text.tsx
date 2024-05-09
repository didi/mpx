
/**
 * ✔ selectable
 * ✘ space
 * ✘ decode
 */
import { Text, TextProps } from 'react-native'
import * as React from 'react'
import { useImperativeHandle } from 'react'
// @ts-ignore
import useInnerTouchable from './getInnerListeners';


 interface _TextProps extends TextProps {
  style?: any;
  children?: React.ReactNode;
  selectable?: boolean;
  userSelect?: boolean;
}

// React.forwardRef 
const _Text: React.ForwardRefExoticComponent<_TextProps & React.RefAttributes<any>> = React.forwardRef((props: _TextProps, ref: React.ForwardedRef<any>) => {
  const {
    style,
    children,
    selectable,
    userSelect,
    ...otherProps } = props
    const innerTouchable = useInnerTouchable(props);

    useImperativeHandle(ref, () => {
      return {
        // todo
      }
    }, [])
    // 1. useImperativehandle //
    // 2. data-set
    return (
      <Text
        style={style}
        ref={ref}
        {...{...otherProps, ...innerTouchable}}
        selectable={!!selectable || !!userSelect}
      >
        {children}
      </Text>
    )
})

_Text.displayName = '_Text'

export default _Text


