import load from 'postcss-load-config';
export declare function loadPostcssConfig(context: Record<string, any>, inlineConfig?: {
    config?: {
        path: string;
    };
    ignoreConfigFile?: boolean;
    plugins?: load.Result['plugins'];
    options?: load.Result['options'];
}): Promise<load.Result>;
