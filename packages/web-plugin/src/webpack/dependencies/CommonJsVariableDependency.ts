import makeSerializable from 'webpack/lib/util/makeSerializable'
import InitFragment from 'webpack/lib/InitFragment'
import { dependencies, sources } from 'webpack'
import {
  ModuleDeserializeContext,
  ModuleHash,
  ModuleSerializeContext,
  ModuleUpdateHashContext
} from './dependency'
class CommonJsVariableDependency extends dependencies.ModuleDependency {
  name: string

  constructor(request: string, name = '') {
    super(request)
    this.name = name
  }

  override serialize(context: ModuleSerializeContext): void {
    const { write } = context
    write(this.name)
    super.serialize(context)
  }

  override deserialize(context: ModuleDeserializeContext): void {
    const { read } = context
    this.name = read()
    super.deserialize(context)
  }

  override updateHash(
    hash: ModuleHash,
    context: ModuleUpdateHashContext
  ): void {
    hash.update(this.request)
    hash.update(this.name)
    super.updateHash(hash, context)
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  get type(): string {
    return 'mpx cjs variable'
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  get category(): string {
    return 'commonjs'
  }
}
CommonJsVariableDependency.Template = class CommonJsVariableDependencyTemplate extends (
  dependencies.ModuleDependency.Template
) {
  override apply(
    dep: CommonJsVariableDependency,
    source: sources.ReplaceSource,
    {
      runtimeTemplate,
      moduleGraph,
      chunkGraph,
      runtimeRequirements,
      initFragments
    }: any
  ) {
    const importedModule = moduleGraph.getModule(dep)
    const requireExpr = runtimeTemplate.moduleExports({
      module: importedModule,
      chunkGraph,
      request: dep.request,
      weak: dep.weak,
      runtimeRequirements
    })

    let expr = '/* mpx cjs variable */ '
    if (dep.name) expr += 'var ' + dep.name + ' = '
    expr += requireExpr + ';\n'

    initFragments.push(
      new InitFragment(expr, InitFragment.STAGE_CONSTANTS, 1, dep.request)
    )
  }
}

makeSerializable(
  CommonJsVariableDependency,
  '@mpxjs/web-plugin/dist/webpack/dependencies/CommonJsVariableDependency'
)

export default CommonJsVariableDependency
