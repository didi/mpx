import * as babylon from '@babel/parser'
import traverse, { Visitor } from '@babel/traverse'
import * as t from '@babel/types'
import generate from '@babel/generator'
import parseRequest from '@mpxjs/compile-utils/parse-request'
import isEmptyObject from '@mpxjs/compile-utils/is-empty-object'
import { LoaderDefinition } from 'webpack'
import { parseQuery } from 'loader-utils'

const preLoader: LoaderDefinition = function (content) {
  this.cacheable()
  const module = this._module
  // @ts-ignore
  const mpx = this.getMpx()
  const wxsModule = parseQuery(this.resourceQuery || '?').wxsModule

  // 处理内联wxs
  if (wxsModule) {
    const wxsContentMap = mpx.wxsContentMap
    const resourcePath = parseRequest(this.resource).resourcePath
    content = wxsContentMap[`${resourcePath}~${wxsModule}`] || content
  }

  let visitor: Visitor = {}
  // @ts-ignore
  if (!module?.wxs) {
    visitor = {
      ...visitor,
      MemberExpression(path) {
        const property = path.node.property as any
        if (
          (property.name === 'constructor' ||
            property.value === 'constructor') &&
          !(t.isMemberExpression(path.parent) && path.parentKey === 'object')
        ) {
          path.replaceWith(t.memberExpression(path.node, t.identifier('name')))
          path.skip()
        }
      },
      CallExpression(path) {
        const callee = path.node.callee
        const args = path.node.arguments
        const transMap: Record<string, string> = {
          getDate: 'Date',
          getRegExp: 'RegExp'
        }
        if (t.isIdentifier(callee) && transMap[callee.name]) {
          if (callee.name === 'getRegExp') {
            const arg = args[0]
            if (
              t.isStringLiteral(arg) &&
              arg.extra &&
              arg.extra.raw &&
              typeof arg.extra.raw === 'string'
            ) {
              args[0] = t.stringLiteral(arg.extra.raw.slice(1, -1))
            }
          }
          path.replaceWith(
            t.newExpression(t.identifier(transMap[callee.name]), args)
          )
        }
      }
    }
  }

  if (!isEmptyObject(visitor)) {
    const ast = babylon.parse(content, {
      sourceType: 'module'
    })
    traverse(ast, visitor)
    return generate(ast).code
  } else {
    return content
  }
}

export default preLoader
