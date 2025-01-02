import Portal from '../mpx-portal'
import Popup, { PopupProps } from './popup'

export interface IUsePopupOptions {
  Modal?: React.ComponentType<PopupProps>;
}

/**
 * 基于 Portal 封装的 Popup 弹窗组件管理 Hooks
 * - 默认使用上面的 Popup 组件
 * - 导出 open remove 方法方便外部调用（比如自定义的弹窗内容组件调用）
 */
const usePopup = (options: IUsePopupOptions = {}) => {
  const { Modal = Popup } = options

  let popupKey: number | null = null

  const getPopupKey = () => {
    return popupKey
  }
  const remove = () => {
    if (popupKey !== null) {
      Portal.remove(popupKey)
      popupKey = null
    }
  }
  const open = (childComponent: React.ReactNode) => {
    popupKey = Portal.add(<Modal remove={remove}>{childComponent}</Modal>)
  }
  return {
    open,
    remove,
    getPopupKey
  }
}

export {
  Popup,
  usePopup
}
