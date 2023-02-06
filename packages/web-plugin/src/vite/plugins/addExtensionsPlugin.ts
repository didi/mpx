import { matchCondition, parseRequest } from '@mpxjs/compile-utils'
import { Plugin as EsbuildPlugin } from 'esbuild'
import fs from 'fs'
import path from 'path'
import { createFilter, Plugin } from 'vite'
import { Options } from 'src/options'

export interface CustomExtensionsOptions {
  include: RegExp
  extensions: string[]
  fileConditionRules: Options['fileConditionRules']
}

/**
 * generate file path with mode
 * @param originPath - path/to/index.js
 * @param extendsion - string
 * @returns path/to/index.extendsion.js
 */
function genExtensionsFilePath(filename: string, extendsion: string): string {
  const parseResult = path.parse(filename)
  return path.format({
    ...parseResult,
    name: `${parseResult.name}.${extendsion}`,
    base: undefined
  })
}

export function esbuildCustomExtensionsPlugin(
  options: CustomExtensionsOptions
): EsbuildPlugin {
  return {
    name: 'esbuild:mpx-custom-estensions',
    setup(build) {
      build.onLoad({ filter: options.include }, async args => {
        if (!matchCondition(args.path, options.fileConditionRules)) return
        for (const extendsion of options.extensions) {
          try {
            const filePath = genExtensionsFilePath(args.path, extendsion)
            await fs.promises.access(filePath)
            return {
              contents: await fs.promises.readFile(filePath, 'utf-8')
            }
          } catch {}
        }
      })
    }
  }
}

/**
 * add custom extensions plugin
 * @param options - options
 * @returns vite plugin options
 */
export function customExtensionsPlugin(
  options: CustomExtensionsOptions
): Plugin {
  const filter = createFilter(options.include)
  return {
    name: 'vite:mpx-custom-estensions',
    async load(id) {
      if (!filter(id) || !matchCondition(id, options.fileConditionRules)) return
      const { resourcePath: filename, queryObj: query } = parseRequest(id)
      if (query.vue) return
      for (const extendsion of options.extensions) {
        try {
          const filePath = genExtensionsFilePath(filename, extendsion)
          await fs.promises.access(filePath)
          return await fs.promises.readFile(filePath, 'utf-8')
        } catch {}
      }
    }
  }
}
