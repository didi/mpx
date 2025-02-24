import Portal from '../mpx-portal'
import PopupBase, { PopupBaseProps } from './popupBase'

export const enum PopupType {
  PICKER = 'picker',
}

export interface IUsePopupOptions {
  modal?: React.ComponentType<PopupBaseProps>
  type?: PopupType
}

/**
 * 根据 type 返回对应的弹窗壳子组件
 */
const getPopup = (type?: PopupType): React.ComponentType<PopupBaseProps> => {
  switch (type) {
    case PopupType.PICKER:
    default:
      return PopupBase
  }
}

/**
 * 基于 Portal 封装的 Popup 弹窗组件管理 Hooks
 */
const createPopupManager = (options: IUsePopupOptions = {}) => {
  const { modal, type } = options
  const Modal = modal || getPopup(type)

  let popupKey: number | null = null
  let isOpen = false

  const getPopupKey = () => {
    return popupKey
  }
  const remove = () => {
    if (popupKey !== null) {
      Portal.remove(popupKey)
      popupKey = null
    }
    isOpen = false
  }
  const open = (
    childComponent: React.ReactNode,
    pageId: number | null,
    options?: { contentHeight?: number }
  ) => {
    if (!isOpen && pageId != null) {
      isOpen = true
      popupKey = Portal.add(
        <Modal remove={remove} {...options}>
          {childComponent}
        </Modal>,
        pageId
      )
    }
  }
  return {
    open,
    remove,
    getPopupKey
  }
}

export { createPopupManager }
