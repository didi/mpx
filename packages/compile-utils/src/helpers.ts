import loaderUtils from 'loader-utils'
import { addQuery, parseRequest } from './index'

const selectorPath = '@mpxjs/loaders/dist/selector'

interface defaultLangType {
  template: 'wxml'
  styles: 'wxss'
  script: 'js'
  json: 'json'
  wxs: 'wxs'
  [key: string]: string
}

interface Options {
  mpx: boolean
  type: string
  index: number
  extract?: boolean
  mode?: string
  [key: string]: any
}

const defaultLang: defaultLangType = {
  template: 'wxml',
  styles: 'wxss',
  script: 'js',
  json: 'json',
  wxs: 'wxs'
}

export function createHelpers(loaderContext: any) {
  const rawRequest = loaderUtils.getRemainingRequest(loaderContext)
  const { resourcePath, queryObj } = parseRequest(loaderContext.resource)
  // @ts-ignore
  const { mode, env } = loaderContext.getMpx() || {}

  function getRequire(
    type: string,
    part: Record<string, any>,
    extraOptions: Record<string, any>,
    index?: number
  ) {
    return 'require(' + getRequestString(type, part, extraOptions, index) + ')'
  }

  function getImport(
    type: string,
    part: Record<string, any>,
    extraOptions: Record<string, any>,
    index: number
  ) {
    return (
      'import __' +
      type +
      '__ from ' +
      getRequestString(type, part, extraOptions, index)
    )
  }

  function getNamedExports(
    type: string,
    part: Record<string, any>,
    extraOptions: Record<string, any>,
    index: number
  ) {
    return 'export * from ' + getRequestString(type, part, extraOptions, index)
  }

  function getFakeRequest(type: string, part: Record<string, any>) {
    const lang = part.lang || defaultLang[type] || type
    const options = { ...queryObj }
    if (lang === 'json') options.asScript = true
    return addQuery(`${resourcePath}.${lang}`, options)
  }

  function getRequestString(
    type: string,
    part: Record<string, any>,
    extraOptions: Record<string, any>,
    index = 0
  ) {
    const src = part.src
    const options: Options = {
      mpx: true,
      type,
      index,
      ...extraOptions
    }

    switch (type) {
      case 'json':
        options.asScript = true
        if (part.useJSONJS) options.useJSONJS = true
      // eslint-disable-next-line no-fallthrough
      case 'styles':
      case 'template':
        options.extract = true
    }

    if (part.mode) options.mode = part.mode

    if (src) {
      return loaderUtils.stringifyRequest(
        loaderContext,
        addQuery(src, options, true)
      )
    } else {
      const fakeRequest = getFakeRequest(type, part)
      const request = `${selectorPath}?mode=${mode}&env=${env}!${addQuery(
        rawRequest,
        options,
        true
      )}`
      return loaderUtils.stringifyRequest(
        loaderContext,
        `${fakeRequest}!=!${request}`
      )
    }
  }

  return {
    getRequire,
    getImport,
    getNamedExports,
    getRequestString
  }
}
