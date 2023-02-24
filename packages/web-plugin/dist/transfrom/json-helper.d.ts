import { PluginContext } from 'rollup';
import { LoaderContext } from 'webpack';
import { Options } from '../options';
export interface CreateJSONHelper {
    stringifyRequest: (r: string) => string;
    emitWarning: (r: string) => void;
    processComponent: (component: string, context: string, { tarRoot, outputPath }: {
        tarRoot?: string;
        outputPath?: string;
    }) => Promise<{
        resource: string;
        outputPath: string;
        packageRoot: string;
    } | undefined>;
    processPage: (page: string | {
        path: string;
        src: string;
    }, context: string, tarRoot?: string) => Promise<{
        resource: string;
        outputPath: string;
        packageRoot: string;
        key: string;
    } | undefined>;
    isUrlRequest: (r: string, root: string) => boolean;
    urlToRequest: (r: string, root: string) => string;
}
export default function createJSONHelper({ pluginContext, options, mode }: {
    pluginContext: LoaderContext<null> | PluginContext | any;
    options: Options;
    mode: 'vite' | 'webpack';
}): CreateJSONHelper;
