import { ManualChunksOption } from 'rollup'
import { Plugin } from 'vite'
import mpxGlobal from '../mpx'
import { getDescriptor } from '../utils/descriptor-cache'

/**
 * 将分包分离到额外的chunk里
 * @returns
 */
function createSplitPackageChunk () {
  const manualChunksOption: ManualChunksOption = (id: string) => {
    if (/plugin-vue2:normalizer/.test(id)) {
      // 强制将normalizer分到vendor里去，否则会引起TDZ
      return 'vendor'
    }
    if (mpxGlobal.entry) {
      const descriptor = getDescriptor(mpxGlobal.entry)
      if (descriptor) {
        const { jsonConfig } = descriptor
        const { subpackages = [] } = jsonConfig
        for (const { root } of subpackages) {
          if (root && (id.includes(root))) {
            return root
          }
        }
      }
    }
  }
  return manualChunksOption
}

export function createSplitPackageChunkPlugin (): Plugin {
  return {
    name: 'vite:mpx-split-package-chunk',
    config (config) {
      const output = config?.build?.rollupOptions?.output
      if (output) {
        const outputs = Array.isArray(output) ? output : [output]
        for (const output of outputs) {
          const splitPackageChunk = createSplitPackageChunk()
          if (output && output.manualChunks) {
            if (typeof output.manualChunks === 'function') {
              const userManualChunks = output.manualChunks
              output.manualChunks = (...args) => {
                return userManualChunks(...args) ?? splitPackageChunk(...args)
              }
            }
          } else {
            output.manualChunks = splitPackageChunk
          }
        }
      } else {
        return {
          build: {
            rollupOptions: {
              output: {
                manualChunks: createSplitPackageChunk()
              }
            }
          }
        }
      }
    }
  }
}
