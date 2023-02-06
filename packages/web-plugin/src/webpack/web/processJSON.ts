import { parse } from 'json5'
import mpx, { getOptions } from '../mpx'
import { jsonCompiler } from '../../transfrom/json-compiler'
import { LoaderContext } from 'webpack'
import { CompilerResult } from '@mpxjs/compiler'

export default async function (
  json: CompilerResult['json'],
  {
    loaderContext
  }: {
    loaderContext: LoaderContext<null>
  },
  rawCallback: (err?: Error | null, result?: any) => void
) {
  const output = '/* json */\n'
  let localPagesMap = {}
  let localComponentsMap = {}
  let jsonConfig = {}
  let tabBarMap = {}
  let tabBarStr = ''

  const context = loaderContext.context

  const callback = (err?: Error) => {
    return rawCallback(err, {
      output,
      jsonConfig,
      localPagesMap,
      localComponentsMap,
      tabBarMap,
      tabBarStr
    })
  }

  // 由于json需要提前读取在template处理中使用，src的场景已经在loader中处理了，此处无需考虑json.src的场景
  try {
    if (json?.content) {
      jsonConfig = parse(json.content)
    }
  } catch (e) {
    return callback(e as Error)
  }

  ({ jsonConfig, localPagesMap, localComponentsMap, tabBarMap, tabBarStr } =
    await jsonCompiler({
      jsonConfig,
      pluginContext: loaderContext,
      context,
      options: getOptions(),
      mode: 'webpack',
      mpx
    }))
  callback()
}
