/// <reference types="node" />
import { TransformPluginContext } from 'rollup';
import { LoaderDefinition } from 'webpack';
export interface ProxyPluginContext {
    resolve(context: string, request: string): Promise<{
        id: string;
    } | null>;
    addDependency(filename: string): void;
    addBuildDependency(filename: string): void;
    addMissingDependency(filename: string): void;
    addContextDependency(filename: string): void;
    cacheable(): void;
    async(): any;
    resource?: string;
    resourcePath?: string;
    sourceMap?: boolean;
    warn(warn: any): void;
    error(err: any): void;
    emitFile(name: any, content?: string | Buffer, sourceMap?: string | undefined, assetInfo?: any): void;
}
/**
 * 代理webpack loader 和 vite plugin 的上下文，并返回统一的格式
 * @param pluginContext
 * @param rollupOptions
 * @returns
 */
export declare function proxyPluginContext(pluginContext: TransformPluginContext | ThisParameterType<LoaderDefinition>, rollupOptions?: {
    moduleId: string;
    sourceMap: boolean;
}): ProxyPluginContext;
