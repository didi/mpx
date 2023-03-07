import { JsonConfig } from '@mpxjs/compiler';
import { PluginContext } from 'rollup';
import { LoaderContext } from 'webpack';
import { Options } from '../options';
export type TemplateProcessResult = {
    templateContent: string;
    builtInComponentsMap: Record<string, {
        resource: string;
    }>;
    genericsInfo?: Record<string, unknown>;
    wxsModuleMap: {
        [key: string]: string;
    };
    wxsContentMap: {
        [key: string]: string;
    };
};
export declare function templateProcess({ template, options, pluginContext, jsonConfig, resource, moduleId, app }: {
    template: Record<string, any>;
    options: Options;
    pluginContext: LoaderContext<null> | PluginContext | any;
    jsonConfig: JsonConfig;
    resource: string;
    moduleId: string;
    app: boolean;
}): {
    templateContent: string;
    wxsModuleMap: {
        [key: string]: string;
    };
    wxsContentMap: {
        [key: string]: string;
    };
    genericsInfo: Record<string, unknown> | undefined;
    builtInComponentsMap: Record<string, {
        resource: string;
    }>;
};
