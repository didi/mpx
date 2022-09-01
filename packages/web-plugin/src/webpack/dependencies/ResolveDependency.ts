import parseRequest from '@mpxjs/utils/parse-request'
import makeSerializable from 'webpack/lib/util/makeSerializable'
import {
  Compilation,
  dependencies,
  Module,
  sources,
  WebpackError
} from 'webpack'
import {
  NullDeserializeContext,
  NullHash,
  NullSerializeContext,
  NullUpdateHashContext
} from './dependency'

class ResolveDependency extends dependencies.NullDependency {
  resource: string
  packageName: string
  issuerResource: string
  range: number[]
  compilation?: Compilation
  resolved?: string

  constructor(
    resource: string,
    packageName: string,
    issuerResource: string,
    range: number[]
  ) {
    super()
    this.resource = resource
    this.packageName = packageName
    this.issuerResource = issuerResource
    this.range = range
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  override get type(): string {
    return 'mpx resolve'
  }

  mpxAction(
    module: Module,
    compilation: Compilation,
    callback: () => void
  ): void {
    this.compilation = compilation
    return callback()
  }

  getResolved(): string {
    const { resource, packageName, compilation } = this
    if (!compilation) return ''
    const mpx = compilation.__mpx__
    if (!mpx) return ''
    const { pagesMap, componentsMap, staticResourcesMap } = mpx
    const { resourcePath } = parseRequest(resource)
    const currentComponentsMap = componentsMap[packageName]
    const mainComponentsMap = componentsMap.main
    const currentStaticResourcesMap = staticResourcesMap[packageName]
    const mainStaticResourcesMap = staticResourcesMap.main
    return (
      pagesMap[resourcePath] ||
      currentComponentsMap[resourcePath] ||
      mainComponentsMap[resourcePath] ||
      currentStaticResourcesMap[resourcePath] ||
      mainStaticResourcesMap[resourcePath] ||
      ''
    )
  }

  // resolved可能会动态变更，需用此更新hash
  override updateHash(hash: NullHash, context: NullUpdateHashContext): void {
    this.resolved = this.getResolved()
    const { resource, issuerResource, compilation } = this
    if (this.resolved) {
      hash.update(this.resolved)
    } else {
      compilation?.errors.push(
        new WebpackError(
          `Path ${resource} is not a page/component/static resource, which is resolved from ${issuerResource}!`
        )
      )
    }
    super.updateHash(hash, context)
  }

  override serialize(context: NullSerializeContext): void {
    const { write } = context
    write(this.resource)
    write(this.packageName)
    write(this.issuerResource)
    write(this.range)
    super.serialize(context)
  }

  override deserialize(context: NullDeserializeContext): void {
    const { read } = context
    this.resource = read()
    this.packageName = read()
    this.issuerResource = read()
    this.range = read()
    super.deserialize(context)
  }
}

ResolveDependency.Template = class ResolveDependencyTemplate {
  apply(dep: ResolveDependency, source: sources.ReplaceSource) {
    const content = this.getContent(dep)
    source.replace(dep.range[0], dep.range[1] - 1, content)
  }

  getContent(dep: ResolveDependency) {
    const { resolved = '', compilation } = dep
    const publicPath = compilation?.outputOptions.publicPath || ''
    return JSON.stringify(publicPath + resolved)
  }
}

makeSerializable(
  ResolveDependency,
  '@mpxjs/web-plugin/dist/webpack/dependencies/ResolveDependency'
)

export default ResolveDependency
