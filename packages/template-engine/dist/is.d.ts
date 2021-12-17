export declare function isString(o: unknown): o is string;
export declare function isUndefined(o: unknown): o is undefined;
export declare function isNull(o: unknown): o is null;
export declare function isObject<T>(o: unknown): o is T;
export declare function isBoolean(o: unknown): o is boolean;
export declare function isFunction(o: unknown): o is (...args: any[]) => any;
export declare function isNumber(o: unknown): o is number;
export declare function isBooleanStringLiteral(o: unknown): o is string;
export declare const isArray: (arg: any) => arg is any[];
