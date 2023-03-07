import { PluginContext } from 'rollup';
import { LoaderContext } from 'webpack';
import { Options } from '../options';
import { JsonConfig } from '@mpxjs/compiler';
import { Mpx } from '../webpack/mpx';
export type JsonProcessResult = {
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
export declare const jsonProcess: ({ jsonConfig, pluginContext, context, options, mode, mpx }: {
    jsonConfig: JsonConfig;
    pluginContext: LoaderContext<null> | PluginContext | any;
    context: string;
    options: Options;
    mode: 'vite' | 'webpack';
    mpx?: Mpx | undefined;
}) => Promise<JsonProcessResult>;
