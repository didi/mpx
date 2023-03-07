declare const stringify: {
    (value: any, replacer?: ((this: any, key: string, value: any) => any) | undefined, space?: string | number | undefined): string;
    (value: any, replacer?: (string | number)[] | null | undefined, space?: string | number | undefined): string;
};
export { stringify };
export declare function stringifyObject(obj?: Record<string, unknown>): Record<string, string>;
export declare function shallowStringify(obj: Record<string, string>): string;
