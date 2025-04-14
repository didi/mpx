import { cloneElement, ReactElement } from 'react'
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
  let child: ReactElement | null = null

  const remove = () => {
    if (popupKey !== null) {
      Portal.remove(popupKey)
      popupKey = null
    }
    isOpen = false
  }

  const open = (
    childComponent: React.ReactNode,
    pageId: number | undefined,
    options?: { contentHeight?: number }
  ) => {
    if (!isOpen && pageId != null) {
      isOpen = true
      child = (
        <Modal hide={hide} {...options} visible={false}>
          {childComponent}
        </Modal>
      )
      popupKey = Portal.add(child, pageId)
    }
  }

  const update = (updatedChild: ReactElement | null) => {
    if (popupKey !== null && child !== null && updatedChild !== null) {
      child = cloneElement(child, { children: updatedChild })
      Portal.update(popupKey, child)
    }
  }

  const _updateVisible = (visible: boolean) => {
    if (popupKey !== null && child !== null) {
      child = cloneElement(child, { visible })
      Portal.update(popupKey, child)
    }
  }

  const show = () => _updateVisible(true)
  const hide = () => _updateVisible(false)

  return {
    open,
    show,
    hide,
    update,
    remove
  }
}

export { createPopupManager }
