import Portal from '../mpx-portal'
import PopupBase, { PopupBaseProps } from './popupBase'
import PopupPicker from './popupPicker'

export const enum PopupType {
  PICKER = 'picker'
}

export interface IUsePopupOptions {
  modal?: React.ComponentType<PopupBaseProps>
  type?: PopupType
}

/**
 * 根据 type 返回对应的内置支持的弹窗组件
 * @param type {PopupType} 弹窗类型
 * @returns 弹窗容器组件
 */
const getPopup = (type?: PopupType): React.ComponentType<PopupBaseProps> => {
  switch (type) {
    case PopupType.PICKER:
      return PopupPicker
    default:
      return PopupBase
  }
}

/**
 * 基于 Portal 封装的 Popup 弹窗组件管理 Hooks
 * @param options.modal 可以传入自定义的弹窗组件，默认使用 PopupBase 组件
 * @param options.type 可以传入内置支持的弹窗类型，默认使用 PopupBase 组件
 * @returns {open, remove, getPopupKey} 返回 hooks 方法方便外部调用（比如自定义的弹窗内容组件调用）
 */
const usePopup = (options: IUsePopupOptions = {}) => {
  const { modal, type } = options
  const Modal = modal || getPopup(type)

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
  usePopup
}
