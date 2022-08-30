import path from 'path'
import stringifyQuery from '@mpxjs/utils/stringify-query'
import addInfix from '@mpxjs/utils/add-infix'
import { parseQuery } from 'loader-utils'
import { matchCondition } from '@mpxjs/utils/match-condition'
import { JSON_JS_EXT } from '../../constants'
import { Resolver } from 'webpack'

export default class AddModePlugin {
  source: string
  target: string
  mode: string
  fileConditionRules: any

  constructor(
    source: string,
    mode: string,
    fileConditionRules: any,
    target: string
  ) {
    this.source = source
    this.target = target
    this.mode = mode
    this.fileConditionRules = fileConditionRules
  }

  apply(resolver: Resolver) {
    const target = resolver.ensureHook(this.target)
    const mode = this.mode
    resolver
      .getHook(this.source)
      .tapAsync('AddModePlugin', (request, resolveContext, callback) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (request.mode || request.env) {
          return callback()
        }
        const obj = {
          mode,
          query: '',
          path: '',
          relativePath: ''
        }
        const resourcePath = request.path || ''
        let extname = ''
        if (resourcePath.endsWith(JSON_JS_EXT)) {
          extname = JSON_JS_EXT
        } else {
          extname = path.extname(resourcePath)
        }
        // 当前资源没有后缀名或者路径不符合fileConditionRules规则时，直接返回
        if (!extname || !matchCondition(resourcePath, this.fileConditionRules))
          return callback()
        const queryObj = parseQuery(request.query || '?')
        queryObj.mode = mode
        queryObj.infix = `${queryObj.infix || ''}.${mode}`
        obj.query = stringifyQuery(queryObj)
        obj.path = addInfix(resourcePath, mode, extname)
        obj.relativePath =
          request.relativePath && addInfix(request.relativePath, mode, extname)
        resolver.doResolve(
          target,
          Object.assign({}, request, obj),
          'add mode: ' + mode,
          resolveContext,
          callback
        )
      })
  }
}
