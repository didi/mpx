export function hasOwn(obj: any, key: any): boolean;
export function isPlainObject(value: any): boolean;
export function diffAndCloneA(a: any, b: any): {
    clone: any;
    diff: boolean;
    diffData: null;
};
export function proxy(target: any, source: any, keys: any, readonly: any, onConflict: any): any;
export function spreadProp(obj: any, key: any): any;
export function enumerableKeys(obj: any): string[];
export function processUndefined(obj: any): {};
