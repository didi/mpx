import { Options } from '../options';
import { JsonConfig } from '../types/json-config';
import { PluginContext } from 'rollup';
import { LoaderContext } from 'webpack';
export type TemplateTransformResult = {
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
export default function templateTransform({ template, options, pluginContext, jsonConfig, resource, moduleId, app }: {
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
