import { Options } from '../options';
import { Compiler } from 'webpack';
declare class MpxWebpackPlugin {
    options: Options;
    constructor(options: Partial<Options>);
    static loader(options: {
        [k: string]: unknown;
    }): {
        loader: string;
        options: {
            [k: string]: unknown;
        };
    };
    static wxsPreLoader(options?: {}): {
        loader: string;
        options: {};
    };
    static urlLoader(options?: {}): {
        loader: string;
        options: {};
    };
    static fileLoader(options?: {}): {
        loader: string;
        options: {};
    };
    runModeRules(data: {
        [k: string]: any;
    }): void;
    apply(compiler: {
        [k: string]: unknown;
    } & Compiler): void;
}
export default MpxWebpackPlugin;
