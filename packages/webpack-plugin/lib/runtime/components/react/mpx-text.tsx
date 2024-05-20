
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
// @ts-ignore
import useNodesRef from '../../useNodesRef' // 引入辅助函数

interface _TextProps extends TextProps {
  style?: any;
  children?: React.ReactNode;
  selectable?: boolean;
  ['user-select']?: boolean;
  userSelect?: boolean;
  useInherit?: boolean;
}

const DEFAULT_STYLE = {
  fontSize: 16
}

const _Text: React.FC<_TextProps & React.RefAttributes<any>> = React.forwardRef((props: _TextProps, ref: React.ForwardedRef<any>) => {
  const {
    style,
    children,
    selectable,
    'user-select': userSelect,
    useInherit = false,
    ...otherProps } = props
    const innerTouchable = useInnerTouchable(props);

    const { nodeRef } = useNodesRef(props, ref, {
      defaultStyle: DEFAULT_STYLE
    })
    return (
      <Text
        style={[ !useInherit && DEFAULT_STYLE, style ]}
        ref={nodeRef}
        selectable={!!selectable || !!userSelect}
        {...{...otherProps, ...innerTouchable}}
      >
        {children}
      </Text>
    )
})

_Text.displayName = '_Text'

export default _Text
