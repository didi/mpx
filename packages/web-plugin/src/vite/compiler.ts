import { templateCompiler } from '@mpxjs/compiler'
import parseComponent from '@mpxjs/compiler/template-compiler/parser'
import { Compiler,  SFCDescriptor} from '../types/compiler'

const compiler: Compiler = {
  ...templateCompiler,
  parseComponent(template, options) {
    const descriptor = parseComponent(template, options) as SFCDescriptor
    if (descriptor.script && descriptor.script.map) {
      const sources = descriptor.script.map.sources || []
      descriptor.script.map.sources = sources.map(
        (v: string) => v.split('?')[0]
      )
    }
    return descriptor
  }
}

export default compiler
