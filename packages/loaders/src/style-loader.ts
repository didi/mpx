import { LoaderDefinition } from 'webpack'
import { proxyPluginContext } from '@mpxjs/plugin-proxy'
import { styleCompiler } from '@mpxjs/compiler'

export default <LoaderDefinition> function mpxStyleLoader (css, map) {
  this.cacheable()
  const cb = this.async()
  styleCompiler.transform(css, proxyPluginContext(this), {
    map,
    resource: this.resource,
    sourceMap: this.sourceMap,
    // @ts-ignore
    mpx: this.getMpx()
  })
    .then(res => {
      // @ts-ignore
      cb(null, res.code, res.map)
    })
    .catch(cb)
}
