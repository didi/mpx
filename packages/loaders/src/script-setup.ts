
import { parseRequest } from '@mpxjs/compile-utils'
import { LoaderDefinition } from 'webpack'
import { scriptSetupCompiler } from '@mpxjs/compiler'

export default <LoaderDefinition>function (content) {
  const { queryObj } = parseRequest(this.resource)
  const { ctorType, lang } = queryObj
  const filePath = this.resourcePath
  const { content: callbackContent } = scriptSetupCompiler({
    content,
    lang
  }, ctorType, filePath)

  this.callback(null, callbackContent)
}