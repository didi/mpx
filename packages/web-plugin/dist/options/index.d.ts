export type Mode = 'wx' | 'web' | 'ali' | 'swan';
interface i18nMessage {
    [key: string]: {
        message: {
            [key: string]: string;
        };
    };
}
interface I18nTypes {
    locale?: string;
    messagesPath?: string;
    dateTimeFormatsPath?: string;
    numberFormatsPath?: string;
    messages?: i18nMessage;
}
interface RpxRule {
    mode?: 'none' | 'only' | 'all';
    designWidth?: number;
    include?: string;
    exclude?: string;
    comment?: string;
}
export interface Options {
    include: string | RegExp | (string | RegExp)[];
    exclude: string | RegExp | (string | RegExp)[];
    mode: Mode;
    env: string;
    srcMode: Mode;
    externalClasses: string[];
    resolveMode: 'webpack' | 'native';
    writeMode: 'changed' | 'full' | null;
    autoScopeRules: {
        include?: string | RegExp | readonly (string | RegExp)[] | null;
        exclude?: string | RegExp | readonly (string | RegExp)[] | null;
    };
    transMpxRules: Record<string, () => boolean>;
    defs: Record<string, unknown>;
    modeRules: Record<string, unknown>;
    externals: string[] | RegExp[];
    projectRoot: string;
    postcssInlineConfig: Record<string, unknown>;
    transRpxRules: RpxRule[] | RpxRule | null;
    decodeHTMLText: boolean;
    i18n: I18nTypes | null;
    checkUsingComponents: boolean;
    checkUsingComponentsRules: unknown;
    reportSize: boolean | null;
    pathHashMode: 'absolute' | 'relative' | ((resourcePath: string, projectRoot: string) => string);
    fileConditionRules: Record<string, () => boolean>;
    customOutputPath: ((type: string, name: string, hash: string, ext: string) => string) | null;
    webConfig: Record<string, unknown>;
    hackResolveBuildDependencies: (result: string) => void;
}
export declare let optionKeys: (keyof Options)[];
export declare function processOptions(rawOptions: Partial<Options>): Options;
export {};
