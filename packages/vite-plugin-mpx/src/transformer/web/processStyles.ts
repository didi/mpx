import genComponentTag from '@mpxjs/webpack-plugin/lib/utils/gen-component-tag'
import { ProcessResult } from './process'
import { SFCDescriptor } from '../../compiler'

export type ProcessStylesResult = ProcessResult

export default async function processStyles(
  descriptor: SFCDescriptor
): Promise<ProcessStylesResult> {
  const output = []
  const { styles } = descriptor
  if (styles && styles.length) {
    styles.forEach((style) => {
      output.push(
        genComponentTag(style, {
          attrs(style) {
            const attrs = Object.assign({}, style.attrs)
            return attrs
          }
        })
      )
    })
    output.push('\n')
  }
  return {
    output: output.join('\n')
  }
}
