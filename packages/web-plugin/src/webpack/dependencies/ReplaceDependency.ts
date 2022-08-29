import makeSerializable from 'webpack/lib/util/makeSerializable'
import { dependencies, sources } from 'webpack'
import {
  NullDeserializeContext,
  NullHash,
  NullSerializeContext,
  NullUpdateHashContext
} from './dependency'

class ReplaceDependency extends dependencies.NullDependency {
  replacement: string
  range: number[]

  constructor(replacement: string, range: number[]) {
    super()
    this.replacement = replacement
    this.range = range
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  override get type() {
    return 'mpx replace'
  }

  override updateHash(hash: NullHash, context: NullUpdateHashContext) {
    hash.update(this.replacement)
    super.updateHash(hash, context)
  }

  override serialize(context: NullSerializeContext) {
    const { write } = context
    write(this.replacement)
    write(this.range)
    super.serialize(context)
  }

  override deserialize(context: NullDeserializeContext) {
    const { read } = context
    this.replacement = read()
    this.range = read()
    super.deserialize(context)
  }
}

ReplaceDependency.Template = class ReplaceDependencyTemplate {
  apply(dep: ReplaceDependency, source: sources.ReplaceSource) {
    source.replace(
      dep.range[0],
      dep.range[1] - 1,
      '/* mpx replace */ ' + dep.replacement
    )
  }
}

makeSerializable(
  ReplaceDependency,
  '@mpxjs/web-plugin/src/webpack/dependencies/ReplaceDependency'
)

module.exports = ReplaceDependency
