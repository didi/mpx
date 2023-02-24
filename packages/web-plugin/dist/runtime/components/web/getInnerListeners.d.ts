export function extendEvent(e: any, extendObj?: {}): void;
export function inheritEvent(type: any, oe: any, detail?: {}): {
    type: any;
    detail: {};
    target: null;
    timeStamp: number;
};
export function getCustomEvent(type: any, detail?: {}, target?: null): {
    type: any;
    detail: {};
    target: null;
    timeStamp: number;
};
export default function getInnerListeners(context: any, options?: {}): any;
