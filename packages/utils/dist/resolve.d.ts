import { LoaderContext } from 'webpack';
declare type LoaderContextResolveCallback = Parameters<LoaderContext<null>['resolve']>[2];
declare const _default: (context: string, request: string, loaderContext: LoaderContext<null>, callback: LoaderContextResolveCallback) => any;
export default _default;
