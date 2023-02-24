import { LoaderDefinition } from 'webpack';
import { ProxyPluginContext } from '@mpxjs/plugin-proxy';
export declare const mpxStyleTransform: (css: string, pluginContext: ProxyPluginContext, options: {
    sourceMap?: boolean;
    resource: string;
    mpx: any;
    map: any;
    isApp?: boolean;
}) => Promise<{
    code: string;
    map: any;
}>;
declare const _default: LoaderDefinition<{}, {}>;
export default _default;
