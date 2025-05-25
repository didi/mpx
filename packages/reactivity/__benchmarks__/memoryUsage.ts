// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck test
/**
 * Run memory test: npx tsx --expose-gc __benchmarksmemoryUsage.ts
 *
 * We need to init `__mpx_mode__` in the file `packages/utils/src/env.js`
 * of @mpxjs/util, otherwise the test will fail.
 * eg: globalThis.__mpx_mode__ = 'test'
 */

import { computed, effect, ref } from '../dist/index.esm'

function runMemoryBenchmark () {
  globalThis.gc()
  const start = process.memoryUsage().heapUsed

  /**
   * Diagram of the reactive structure in this memory test case:
   *
   *            src(ref)
   *          /    |     \
   * computed1  computed1  computed1 ...  (w columns)
   *    |         |         |
   * computed2  computed2  computed2 ...
   *    |         |         |
   *    .         .         .
   *    .         .         . (h rows)
   *    |         |         |
   * computedH  computedH  computedH ...
   *
   * Total nodes: 1 ref + w * h computed + w * h effects
   * Each computed node has:
   * - 1 dependency on previous node
   * - 1 effect tracking its value
   */

  const w = 100
  const h = 100
  const src = ref(1)

  for (let i = 0; i < w; i++) {
    let last = src
    for (let j = 0; j < h; j++) {
      const prev = last
      last = computed(() => prev.value + 1)
      effect(() => last.value)
    }
  }

  src.value++

  globalThis.gc()
  const end = process.memoryUsage().heapUsed
  // output the memory usage in KB
  console.log(
    `\nMemory usage of tree: ${((end - start) / 1024).toFixed(2)} KB\n`
  )
}

runMemoryBenchmark()
