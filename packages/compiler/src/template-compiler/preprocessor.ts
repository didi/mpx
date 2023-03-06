// loader for pre-processing templates with e.g. pug

import cons from 'consolidate'
import loaderUtils from 'loader-utils'
import { LoaderDefinition } from 'webpack'

export default <LoaderDefinition>function (content: string) {
  this.cacheable && this.cacheable()
  const callback = this.async()
  // @ts-ignore
  const opt = loaderUtils.getOptions(this) || {}

    // @ts-ignore
  if (!cons[opt.engine]) {
    return callback(new Error(
      'Template engine \'' + opt.engine + '\' ' +
      'isn\'t available in Consolidate.js'
    ))
  }

  const templateOption = opt.templateOption as unknown as {
    filename: string
  }

  // for relative includes
  templateOption.filename = this.resourcePath

  // @ts-ignore
  cons[opt.engine].render(content, templateOption, function (err, html) {
    if (err) {
      return callback(err)
    }
    callback(null, html)
  })
}
