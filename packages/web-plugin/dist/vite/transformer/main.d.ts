import { TransformPluginContext, TransformResult } from 'rollup';
import { Options } from '../../options';
import { OptionObject } from 'loader-utils';
export declare function transformMain(code: string, filename: string, query: OptionObject, options: Options, pluginContext: TransformPluginContext): Promise<TransformResult | undefined>;
