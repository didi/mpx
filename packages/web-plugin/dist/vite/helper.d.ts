import { PluginContext } from 'rollup';
import { Options } from '../options';
import { SFCDescriptor } from './utils/descriptorCache';
export declare const ENTRY_HELPER_CODE = "\0/vite/mpx-entry-helper";
export declare const APP_HELPER_CODE = "\0/vite/mpx-app-helper";
export declare const I18N_HELPER_CODE = "\0/vite/mpx-i18n-helper";
export declare const TAB_BAR_PAGE_HELPER_CODE = "\0/vite/mpx-tab-bar-page-helper";
export declare const renderPageRouteCode: (options: Options, importer: string) => string;
export declare const renderEntryCode: (importer: string, options: Options) => Promise<string>;
export declare function renderI18nCode(options: Options): string;
/**
 * app初始化代码，主要是初始化所有的global对象
 * @param descriptor - SFCDescriptor
 * @returns
 */
export declare function renderAppHelpCode(options: Options, descriptor: SFCDescriptor, pluginContext: PluginContext): Promise<string>;
/**
 * TabBar，mpx-tab-bar-container依赖global.__tabBarPagesMap
 * @param options -
 * @param descriptor -
 * @param pluginContext -
 * @returns
 */
export declare const renderTabBarPageCode: (options: Options, descriptor: SFCDescriptor, pluginContext: PluginContext) => Promise<string>;
