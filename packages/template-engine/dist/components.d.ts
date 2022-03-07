export declare const styles: {
    style: string;
    class: string;
};
export declare const events: {};
export declare const touchEvents: {
    bindTouchStart: string;
    bindTouchMove: string;
    bindTouchEnd: string;
    bindTouchCancel: string;
    bindLongTap: string;
};
export declare const animationEvents: {
    bindAnimationStart: string;
    bindAnimationIteration: string;
    bindAnimationEnd: string;
    bindTransitionEnd: string;
};
export declare function singleQuote(s: string): string;
export declare const internalComponents: Record<string, Record<string, string>>;
export declare const controlledComponent: Set<string>;
export declare const focusComponents: Set<string>;
export declare const voidElements: Set<string>;
export declare const nestElements: Map<string, number>;
