export type SetType = Set<ItemType>;
export type FnType = (item: ItemType) => unknown;
export type ItemType = string | Record<string, unknown>;
declare const _default: {
    every(set: SetType, fn: FnType): boolean;
    has(set: SetType, fn: FnType): boolean;
    map(set: SetType, fn: FnType): Set<unknown>;
    filter(set: SetType, fn: FnType): Set<unknown>;
    concat(setA: SetType, setB: SetType): Set<unknown>;
    mapToArr(set: SetType, fn: FnType): unknown[];
};
export default _default;
