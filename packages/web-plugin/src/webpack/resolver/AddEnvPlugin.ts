import path from 'path'
import stringifyQuery from '@mpxjs/utils/stringify-query'
import { parseQuery } from 'loader-utils'
import addInfix from '@mpxjs/utils/add-infix'
import { matchCondition } from '@mpxjs/utils/match-condition'
import { JSON_JS_EXT } from '../../constants'
import { Resolver } from 'webpack'

export default class AddEnvPlugin {
  source: any
  target: any
  env: any
  fileConditionRules: any

  constructor(
    source: string,
    env: string,
    fileConditionRules: any,
    target: string
  ) {
    this.source = source
    this.target = target
    this.env = env
    this.fileConditionRules = fileConditionRules
  }

  apply(resolver: Resolver): void {
    const target = resolver.ensureHook(this.target)
    const env = this.env
    resolver
      .getHook(this.source)
      .tapAsync('AddEnvPlugin', (request, resolveContext, callback) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (request.env) {
          return callback()
        }
        const obj = {
          env,
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
        queryObj.infix = `${queryObj.infix || ''}.${env}`
        obj.query = stringifyQuery(queryObj)
        obj.path = addInfix(resourcePath, env, extname)
        obj.relativePath =
          request.relativePath && addInfix(request.relativePath, env, extname)
        resolver.doResolve(
          target,
          Object.assign({}, request, obj),
          'add env: ' + env,
          resolveContext,
          callback
        )
      })
  }
}
