import makeSerializable from 'webpack/lib/util/makeSerializable'
import { Compilation, dependencies, Module, WebpackError } from 'webpack'
import { NullDeserializeContext, NullSerializeContext } from './dependency'

class RecordResourceMapDependency extends dependencies.NullDependency {
  resourcePath: string
  resourceType: string
  outputPath: string
  packageRoot: string

  constructor(
    resourcePath: string,
    resourceType: string,
    outputPath: string,
    packageRoot = ''
  ) {
    super()
    this.resourcePath = resourcePath
    this.resourceType = resourceType
    this.outputPath = outputPath
    this.packageRoot = packageRoot
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  override get type(): string {
    return 'mpx record resource map'
  }

  mpxAction(
    module: Module,
    compilation: Compilation,
    callback: () => void
  ): void {
    const mpx = compilation.__mpx__
    const { resourcePath, resourceType, outputPath, packageRoot } = this
    mpx.recordResourceMap({
      resourcePath,
      resourceType,
      outputPath,
      packageRoot,
      recordOnly: true,
      warn(e: WebpackError) {
        compilation.warnings.push(e)
      },
      error(e: WebpackError) {
        compilation.errors.push(e)
      }
    })
    return callback()
  }

  override serialize(context: NullSerializeContext): void {
    const { write } = context
    write(this.resourcePath)
    write(this.resourceType)
    write(this.outputPath)
    write(this.packageRoot)
    super.serialize(context)
  }

  override deserialize(context: NullDeserializeContext): void {
    const { read } = context
    this.resourcePath = read()
    this.resourceType = read()
    this.outputPath = read()
    this.packageRoot = read()
    super.deserialize(context)
  }
}

RecordResourceMapDependency.Template = class RecordResourceMapDependencyTemplate {
  apply() {
    return
  }
}

makeSerializable(
  RecordResourceMapDependency,
  '@mpxjs/web-plugin/dist/webpack/dependencies/RecordResourceMapDependency'
)

export default RecordResourceMapDependency
