import { LoaderContext } from 'webpack';
type LoaderContextResolveCallback = Parameters<LoaderContext<null>['resolve']>[2];
export declare function resolve(context: string, request: string, loaderContext: LoaderContext<null>, callback: LoaderContextResolveCallback): any;
export {};
