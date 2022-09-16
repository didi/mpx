import { LoaderContext } from 'webpack'

module.exports = function (this: LoaderContext<null>) {
  return `module.exports = __mpx_resolve_path__(${JSON.stringify(this.resource)})`
}
