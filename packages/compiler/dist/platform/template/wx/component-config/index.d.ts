interface Attr {
    name: string;
    value: any;
}
type Test = string | RegExp;
export type PropsTransformer = (attr: Attr, params: {
    el: any;
}) => any;
export type EventTransformer = (event: string, params: {
    el: any;
}) => any;
export type TagTransformer = (tag: string, params: {
    el: any;
}) => any;
export type PrintLog = (tag?: Attr | string) => void;
export interface Config {
    test?: Test;
    supportedModes?: string[];
    [key: string]: Config['props'] | Config['event'] | Config['test'] | TagTransformer | string[];
    props?: {
        [key: string]: PropsTransformer | string | undefined | RegExp;
        test?: Test;
    }[];
    event?: {
        [key: string]: EventTransformer | string | undefined | RegExp;
        test?: Test;
    }[];
}
export type Print = (params: {
    platform: any;
    tag?: any;
    type?: string | undefined;
    isError?: boolean | undefined;
}) => PrintLog;
export type DefineConfig = (params: {
    print: Print;
}) => Config;
export type DefineConfigs = (params: {
    print: Print;
}) => Config[];
export default function getComponentConfigs({ warn, error }: {
    warn: any;
    error: any;
}): Config[];
export {};
