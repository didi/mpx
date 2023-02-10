import { LoaderDefinition } from 'webpack';
export interface Options {
    name?: string;
    publicPathScope?: string;
    mimetype?: string;
    limit?: number;
    publicPath?: string;
    fallback?: string;
}
declare const urlLoader: LoaderDefinition;
export default urlLoader;
