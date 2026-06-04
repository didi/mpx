import rules, { blocklistRules } from './rules/index'
import { normalizeTransformVar } from './rules/transforms'
import theme from './theme'
import blocklistVariants from './variants/index'
import { transformBase } from '@unocss/preset-mini/rules'
import { filterBase } from '@unocss/preset-wind3/rules'
import { flattenColorVars } from './postprocess/flatten-color-vars'

function normalizePreflightBase (preflightBase) {
  normalizeTransformVar(preflightBase)
  return preflightBase
}

function preflights () {
  return [
    {
      layer: 'preflights',
      getCSS ({ theme, generator }) {
        generator._mpx2rnUnoPreflightBase = {
          ...normalizePreflightBase(transformBase),
          ...filterBase
        }
      }
    }
  ]
}

function postprocess (utilsObject) {
  const everyIsVar = utilsObject.entries.every(v => {
    return v[0].startsWith('--un')
  })
  if (everyIsVar) {
    utilsObject.layer = 'varUtilities'
  }
  return utilsObject
}

export default function presetRnMpx () {
  return {
    name: '@mpxjs/unocss-preset-rn',
    rules,
    theme,
    preflights: preflights(),
    // ⚠️ 顺序：flattenColorVars 必须排在 postprocess 之前。
    //   flatten 把 utility 内 var(--un-*) 全部 inline 为字面量并丢弃 --un-* 声明行；
    //   随后 postprocess 检测「全是 --un-*」推到 varUtilities layer 的逻辑，
    //   对已 flatten 的 utility 自然不再触发，layer 抽离 / RN 运行时 var 解析开销同时消除。
    postprocess: [flattenColorVars, postprocess],
    blocklist: [
      ...blocklistRules,
      ...blocklistVariants
    ]
  }
}
