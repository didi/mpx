import path from 'path'
import fs from 'fs'
import { Plugin as EsbuildPlugin } from 'esbuild'
import { Plugin, createFilter } from 'vite'
export interface CustomExtensionsOptions {
  include: string | RegExp | (string | RegExp)[]
  exclude?: string | RegExp | (string | RegExp)[]
  extensions: string[]
}

export interface EsbuildCustomExtensionsOptions {
  include: RegExp
  extensions: string[]
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
  options: EsbuildCustomExtensionsOptions
): EsbuildPlugin {
  return {
    name: 'esbuild:mpx-custom-estensions',
    setup(build) {
      build.onLoad({ filter: options.include }, async (args) => {
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
  const filter = createFilter(options.include, options.exclude)
  return {
    name: 'vite:mpx-custom-estensions',
    // https://github.com/vitejs/vite/issues/3705
    // resolveId() is hookFirst - first non-null result is returned.
    enforce: 'pre',
    async resolveId(source, importer, o) {
      if (!filter(source)) return
      const resolution = await this.resolve(source, importer, {
        skipSelf: true,
        ...o
      })
      if (resolution) {
        const [filename, rawQuery] = resolution.id.split('?', 2)
        for (const extendsion of options.extensions) {
          try {
            const filePath = genExtensionsFilePath(filename, extendsion)
            await fs.promises.access(filePath)
            return `${filePath}${rawQuery ? `?${rawQuery}` : ''}`
          } catch {}
        }
      }
    }
  }
}
