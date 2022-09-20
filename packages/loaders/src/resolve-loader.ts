import { LoaderContext } from 'webpack'

export default function (this: LoaderContext<null>) {
  return `module.exports = __mpx_resolve_path__(${JSON.stringify(this.resource)})`
}
