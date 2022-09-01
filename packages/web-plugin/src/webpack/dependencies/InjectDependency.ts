import makeSerializable from 'webpack/lib/util/makeSerializable'
import { dependencies, sources } from 'webpack'
import {
  NullDeserializeContext,
  NullHash,
  NullSerializeContext,
  NullUpdateHashContext
} from './dependency'

class InjectDependency extends dependencies.NullDependency {
  content: string
  index: number

  constructor(
    options: { content: string; index: number } = {
      content: '',
      index: 0
    }
  ) {
    super()
    this.content = options.content
    this.index = options.index || 0
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  override get type(): string {
    return 'mpx inject'
  }

  override updateHash(hash: NullHash, context: NullUpdateHashContext): void {
    hash.update(this.content)
    super.updateHash(hash, context)
  }

  override serialize(context: NullSerializeContext): void {
    const { write } = context
    write(this.content)
    write(this.index)
    super.serialize(context)
  }

  override deserialize(context: NullDeserializeContext): void {
    const { read } = context
    this.content = read()
    this.index = read()
    super.deserialize(context)
  }
}

InjectDependency.Template = class InjectDependencyTemplate {
  apply(dep: InjectDependency, source: sources.ReplaceSource) {
    source.insert(dep.index, '/* mpx inject */ ' + dep.content)
  }
}

makeSerializable(
  InjectDependency,
  '@mpxjs/web-plugin/dist/webpack/dependencies/InjectDependency'
)

export default InjectDependency
