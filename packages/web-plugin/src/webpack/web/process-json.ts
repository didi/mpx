import { LoaderContext } from 'webpack'
import { jsonProcess } from '../../processor/json-process'
import { JsonConfig } from '@mpxjs/compiler'
import mpx, { getOptions } from '../mpx'

export default async function (
  jsonConfig: JsonConfig,
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
  let tabBarMap = {}

  const context = loaderContext.context

  const callback = (err?: Error) => {
    return rawCallback(err, {
      output,
      jsonConfig,
      localPagesMap,
      localComponentsMap,
      tabBarMap
    })
  }

  ({ jsonConfig, localPagesMap, localComponentsMap, tabBarMap } =
    await jsonProcess({
      jsonConfig,
      pluginContext: loaderContext,
      context,
      options: getOptions(),
      mode: 'webpack',
      mpx
    }))
  callback()
}
