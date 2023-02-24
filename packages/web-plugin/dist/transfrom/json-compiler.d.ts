import { Mpx } from '../webpack/mpx';
import { Options } from '../options';
import { JsonConfig } from '../types/json-config';
import { PluginContext } from 'rollup';
import { LoaderContext } from 'webpack';
export type JsonTransfromResult = {
    localPagesMap: {
        [key: string]: {
            resource: string;
            async: boolean;
        };
    };
    localComponentsMap: {
        [key: string]: {
            resource: string;
            async: boolean;
        };
    };
    tabBarMap: Record<string, unknown>;
    jsonConfig: JsonConfig;
};
export declare const jsonCompiler: ({ jsonConfig, pluginContext, context, options, mode, mpx }: {
    jsonConfig: JsonConfig;
    pluginContext: LoaderContext<null> | PluginContext | any;
    context: string;
    options: Options;
    mode: 'vite' | 'webpack';
    mpx?: Mpx | undefined;
}) => Promise<JsonTransfromResult>;
