import { createFilter, Plugin, UserConfig } from 'vite'
import createVuePlugin from '@vitejs/plugin-vue2'
import { Options, processOptions, ResolvedOptions } from '../options'
import parseRequest from '@mpxjs/compile-utils/parse-request'
import { stringifyObject } from '../utils/stringify'
import handleHotUpdate from './handleHotUpdate'
import {
  APP_HELPER_CODE,
  I18N_HELPER_CODE,
  renderAppHelpCode,
  renderI18nCode,
  renderMpxPresetCode,
  renderPageRouteCode,
  renderTabBarPageCode,
  TAB_BAR_PAGE_HELPER_CODE
} from './helper'
import mpxGlobal from './mpx'
import {
  customExtensionsPlugin,
  esbuildCustomExtensionsPlugin
} from './plugins/addExtensionsPlugin'
import { createResolveEntryPlugin } from './plugins/resolveEntryPlugin'
import { createSplitPackageChunkPlugin } from './plugins/splitPackageChunkPlugin'
import { createWxsPlugin } from './plugins/wxsPlugin'
import { transformMain } from './transformer/main'
import { transformStyle } from './transformer/style'
import { getDescriptor } from './utils/descriptorCache'

function createMpxPlugin(
  options: ResolvedOptions,
  userConfig?: UserConfig
): Plugin {
  const { include, exclude } = options
  const filter = createFilter(include, exclude)

  return {
    name: 'vite:mpx',

    config() {
      return {
        ...userConfig,
        define: {
          global: 'globalThis', // polyfill node global
          'process.env.NODE_ENV': JSON.stringify(
            options.isProduction ? '"production"' : '"development"'
          ),
          ...userConfig?.define,
          ...stringifyObject(options.defs)
        }
      }
    },

    configureServer(server) {
      options.devServer = server
    },

    configResolved(config) {
      Object.assign(options, {
        ...options,
        base: config.base,
        root: config.root,
        sourceMap: config.command === 'build' ? !!config.build.sourcemap : true,
        isProduction: config.isProduction
      })
    },

    handleHotUpdate(ctx) {
      return handleHotUpdate(ctx)
    },

    async resolveId(id) {
      if (
        id === APP_HELPER_CODE ||
        id === I18N_HELPER_CODE ||
        id === TAB_BAR_PAGE_HELPER_CODE
      ) {
        return id
      }
    },

    load(id) {
      if (id === APP_HELPER_CODE && mpxGlobal.entry) {
        const { resourcePath: filename } = parseRequest(mpxGlobal.entry)
        const descriptor = getDescriptor(filename)
        if (descriptor) {
          return renderAppHelpCode(options, descriptor)
        }
      }
      if (id === TAB_BAR_PAGE_HELPER_CODE && mpxGlobal.entry) {
        const { resourcePath: filename } = parseRequest(mpxGlobal.entry)
        const descriptor = getDescriptor(filename)
        if (descriptor) {
          return renderTabBarPageCode(options, descriptor, this)
        }
      }
      if (id === I18N_HELPER_CODE) {
        return renderI18nCode(options)
      }
      const { resourcePath: filename, queryObj: query } = parseRequest(id)
      if (query.resolve !== undefined) {
        return renderPageRouteCode(options, filename)
      }
      if (query.type === 'globalDefine') {
        const descriptor = getDescriptor(filename)
        if (descriptor) {
          return renderMpxPresetCode(descriptor, options)
        }
      }
    },

    async transform(code, id) {
      const { queryObj: query, resourcePath: filename } = parseRequest(id)
      if (!filter(filename)) return
      if (query.resolve !== undefined) return
      if (query.vue === undefined) {
        // mpx file => vue file
        return await transformMain(code, filename, query, options, this)
      } else {
        if (query.type === 'style') {
          // mpx style => vue style
          const descriptor = getDescriptor(filename)
          if (descriptor) {
            return await transformStyle(
              code,
              filename,
              descriptor,
              options,
              this
            )
          }
        }
        if (query.type === 'main') {
          await transformMain(code, filename, query, options, this)
          return 'export default {}'
        }
      }
    }
  }
}

export default function mpx(options: Options = {}): Plugin[] {
  const resolvedOptions = processOptions({ ...options })
  const { mode = '', env = '', fileConditionRules } = resolvedOptions
  const customExtensions = [mode, env, env && `${mode}.${env}`].filter(Boolean)
  const plugins = [
    // split subpackage chunk
    createSplitPackageChunkPlugin(),
    // add custom extensions
    customExtensionsPlugin({
      include: /@mpxjs|\.mpx/,
      fileConditionRules,
      extensions: customExtensions
    }),
    // ensure mpx entry point
    createResolveEntryPlugin(resolvedOptions),
    // wxs => js
    createWxsPlugin(),
    // mpx => vue
    createMpxPlugin(resolvedOptions, {
      optimizeDeps: {
        esbuildOptions: {
          plugins: [
            // prebuild for addExtensions
            esbuildCustomExtensionsPlugin({
              include: /@mpxjs/,
              fileConditionRules,
              extensions: customExtensions
            })
          ]
        }
      }
    }),
    // vue support for mpxjs/rumtime
    createVuePlugin({
      include: /\.vue|\.mpx$/
    })
  ]

  return plugins
}
