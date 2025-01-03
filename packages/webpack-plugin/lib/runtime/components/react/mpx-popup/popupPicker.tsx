import { TouchableHighlight, View } from 'react-native'
import PopupBase, { PopupBaseProps } from './popupBase'

/**
 * Picker 表单组件的弹窗容器组件
 */
const PopupPicker = (props: PopupBaseProps = {}) => {
  const { children, remove } = props

  return (
    <PopupBase {...props}>
      {/* <TouchableHighlight
        onPress={remove}
        style={[styles.headerItem]}
        activeOpacity={1}
        underlayColor={theme.fill_tap}
        {...props.dismissButtonProps}>
        {dismissEl}
      </TouchableHighlight>
      <TouchableHighlight
        onPress={onOk}
        style={[styles.headerItem]}
        activeOpacity={1}
        underlayColor={theme.fill_tap}
        {...props.okButtonProps}>
        {okEl}
      </TouchableHighlight> */}
      {children}
    </PopupBase>
  )
}

PopupPicker.displayName = 'MpxPopupPicker'
export default PopupPicker
