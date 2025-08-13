import { cloneElement } from 'react';
import Portal from '../mpx-portal';
import PopupBase from './popupBase';
/**
 * 根据 type 返回对应的弹窗壳子组件
 */
const getPopup = (type) => {
    switch (type) {
        case "picker" /* PopupType.PICKER */:
        default:
            return PopupBase;
    }
};
/**
 * 基于 Portal 封装的 Popup 弹窗组件管理 Hooks
 */
const createPopupManager = (options = {}) => {
    const { modal, type } = options;
    const Modal = modal || getPopup(type);
    let popupKey = null;
    let isOpen = false;
    let child = null;
    const remove = () => {
        if (popupKey !== null) {
            Portal.remove(popupKey);
            popupKey = null;
        }
        isOpen = false;
    };
    const open = (childComponent, pageId, options) => {
        if (!isOpen && pageId != null) {
            isOpen = true;
            child = (<Modal hide={hide} {...options} visible={false}>
          {childComponent}
        </Modal>);
            popupKey = Portal.add(child, pageId);
        }
    };
    const update = (updatedChild) => {
        if (popupKey !== null && child !== null && updatedChild !== null) {
            child = cloneElement(child, { children: updatedChild });
            Portal.update(popupKey, child);
        }
    };
    const _updateVisible = (visible) => {
        if (popupKey !== null && child !== null) {
            child = cloneElement(child, { visible });
            Portal.update(popupKey, child);
        }
    };
    const show = () => _updateVisible(true);
    const hide = () => _updateVisible(false);
    return {
        open,
        show,
        hide,
        update,
        remove
    };
};
export { createPopupManager };
