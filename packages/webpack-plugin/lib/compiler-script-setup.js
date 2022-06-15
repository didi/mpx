const babylon = require('@babel/parser')
var MagicString = require('magic-string')

// Special compiler macros
const DEFINE_PROPS = 'defineProps'
const DEFINE_OPTIONS = 'defineOptions'
const USE_CONTEXT = 'useContext'

const MPX_CORE = '@mpxjs/core'

const BindingTypes = {
  /**
   * returned from data()
   */
  DATA: 'data',
  /**
   * declared as a prop
   */
  PROPS: 'props',
  /**
   * a local alias of a `<script setup>` destructured prop.
   * the original is stored in __propsAliases of the bindingMetadata object.
   */
  PROPS_ALIASED: 'props-aliased',
  /**
   * a let binding (may or may not be a ref)
   */
  SETUP_LET: 'setup-let',
  /**
   * a const binding that can never be a ref.
   * these bindings don't need `unref()` calls when processed in inlined
   * template expressions.
   */
  SETUP_CONST: 'setup-const',
  /**
   * a const binding that does not need `unref()`, but may be mutated.
   */
  SETUP_REACTIVE_CONST: 'setup-reactive-const',
  /**
   * a const binding that may be a ref.
   */
  SETUP_MAYBE_REF: 'setup-maybe-ref',
  /**
   * bindings that are guaranteed to be refs
   */
  SETUP_REF: 'setup-ref',
  /**
   * declared by other options, e.g. computed, inject
   */
  OPTIONS: 'options'
}

function compileScriptSetup(
    content,
    ctorType
) {
  const _s = new MagicString(content)
  const scriptBindings = Object.create(null)
  const setupBindings = Object.create(null)
  const userImportAlias = Object.create(null)
  const userImports = Object.create(null)

  let startOffset = 0
  let endOffset = 0
  let hasAwait = false
  let hasDefinePropsCall = false
  let hasUseContextCall = false

  let propsRuntimeDecl
  let propsTypeDeclRaw
  let propsTypeDecl
  let propsIdentifier
  let propsDestructureRestId

  let isTS = false


  // props/emits declared via types
  const bindingMetadata = {}
  const typeDeclaredProps = {}
  const declaredTypes = {}

  function registerUserImport(
      source,
      local,
      imported = false,
      isType,
      isFromSetup = true,
      needTemplateUsageCheck
  ) {
    if (source === MPX_CORE && imported) {
      userImportAlias[imported] = local
    }

    userImports[local] = {
      isType,
      imported: imported || 'default',
      source,
      isFromSetup
    }
  }

  function processUseContext (node) {    // add useContext 去重逻辑
    // add useContext 去重提示逻辑
    if (isCallOf(node, USE_CONTEXT)) {
      _s.overwrite(node.start, node.end, '__context')
      hasUseContextCall = true
    }
    // useContext().refs
    if (node.type === 'MemberExpression') {
      processUseContext(node.object)
    }
  }

  function processDefineProps (node, declId) {
    if (!isCallOf(node, DEFINE_PROPS)) {
      return false
    }
    if (hasDefinePropsCall) {
      console.error(`duplicate ${DEFINE_PROPS}() call`, node)
    }
    hasDefinePropsCall = true
    propsRuntimeDecl = node.arguments[0]

    /**
     * defineProps<{
     *   foo: string
     *   bar?: number
     * }>()
     */
    if (node.typeParameters) {
      if (propsRuntimeDecl) {
        console.error(
            `${DEFINE_PROPS}() cannot accept both type and non-type arguments ` +
            `at the same time. Use one or the other.`,
            node
        )
      }

      propsTypeDeclRaw = node.typeParameters.params[0]

      propsTypeDecl = resolveQualifiedType(
          propsTypeDeclRaw,
          node => node.type === 'TSFunctionType' || node.type === 'TSTypeLiteral'
      )

      if (!propsTypeDecl) {
        console.error(
            `type argument passed to ${DEFINE_PROPS}() must be a literal type, ` +
            `or a reference to an interface or literal type.`,
            propsTypeDeclRaw
        )
      }
    }

    // 处理 VariableDeclaration declarations id
    if (declId) {
      propsIdentifier = content.slice(declId.start, declId.end)
    }
    return true
  }

  function resolveQualifiedType(node, qualifier) {
    if (qualifier(node)) {
      return node
    }
    //TSTypeReference defineProps<Props>()
    if (node.type === 'TSTypeReference' && node.typeName.type === 'Identifier') {
      const refName = node.typeName.name
      const isQualifiedType = (node) => {
        // interface Props TSInterfaceDeclaration
        if (node.type === 'TSInterfaceDeclaration' && node.id.name === refName) {
          return node.body
        }
        // type Props TSTypeAliasDeclaration
        if (node.type === 'TSTypeAliasDeclaration' && node.id.name === refName && qualifier(node.typeAnnotation)) {
          return node.typeAnnotation
        }
        // export type Props
        if (node.type === 'ExportNamedDeclaration' && node.declaration) {
          return isQualifiedType(node.declaration)
        }
      }
      const body = scriptSetupAst.body
      for (const node of body) {
        const qualified = isQualifiedType(node)
        if (qualified) {
          return qualified
        }
      }
    }
  }

  function genRuntimeProps() {

  }

  function checkInvalidScopeReference(node, method) {
    if (!node) return
    // TODO add walkIdentifiers
    // walkIdentifiers(node, id => {
    //   if (setupBindings[id.name]) {
    //     console.error(
    //       `\`${method}()\` in <script setup> cannot reference locally ` +
    //       `declared variables because it will be hoisted outside of the ` +
    //       `setup() function. If your component options require initialization ` +
    //       `in the module scope, use a separate normal <script> to export ` +
    //       `the options instead.`,
    //       id
    //     )
    //   }
    // })
  }

  const scriptSetupAst = babylon.parse(content, {
    plugins: [
      'topLevelAwait'
    ],
    sourceType: 'module'
  })
  for (const node of scriptSetupAst.program.body) {
    if (node.type === 'ImportDeclaration') {
      //TODO: import declarations are moved to top
      // dedupe imports
      let removed = 0
      const removeSpecifier = (i) => {
        const removeLeft = i > removed
        removed++
        const current = node.specifiers[i]
        const next = node.specifiers[i + 1]
        _s.remove(
            removeLeft ? node.specifiers[i - 1].end + startOffset : current.start + startOffset,
            next && !removeLeft ? next.start + startOffset : current.end + startOffset
        )
      }
      // 判断defineProps等是否有被引入
      // record imports for dedupe
      for (let i = 0; i < node.specifiers.length; i++) {
        const specifier = node.specifiers[i]
        const imported = specifier.type === 'ImportSpecifier' && specifier.imported.type === 'Identifier' && specifier.imported.name
        const local = specifier.local.name
        const source = node.source.value
        const existing = userImports[local]
        if (source === MPX_CORE && isCompilerMacro(imported)) {
          console.warn('`\\`${imported}\\` is a compiler macro and no longer needs to be imported.`')
          // 不需要经过
          removeSpecifier(i)
        } else if(existing) {
          if (existing.source === source && existing.imported === imported) {
            // already imported in <script setup>, dedupe
            removeSpecifier(i)
          } else {
            console.error(`different imports aliased to same local name.`, specifier)
          }
        } else {
          registerUserImport(
              node.source.value,
              specifier.local.name,
              imported,
              node.importKind === 'type' ||
              (specifier.type === 'ImportSpecifier' &&
                  specifier.importKind === 'type'),
              true
          )
        }
      }
      startOffset = node.loc.end.index
    }

    // process defineProps defineOptions useContext 等编译宏
    if (node.type === 'ExpressionStatement') {
      if (processDefineProps(node.expression)) {
        _s.remove(node.start, node.end)
      }
    }

    if (node.type === 'VariableDeclaration' && !node.declare) {
      const total = node.declarations.length
      let left = total
      for (let i =0; i < total; i++) {
        const decl = node.declarations[i]
        if (decl.init) {
          const isDefineProps = processDefineProps(decl.init, decl.id)
          if (isDefineProps) {
            if (left === 1) {
              _s.remove(node.start, node.end)
            } else {
              // let a,b = defineProps({})
              let start = decl.start
              let end = decl.end
              if (i < total - 1) {
                // not the last one, locate the start of the next
                end = node.declarations[i + 1].start
              } else {
                // last one, locate the end of the prev
                start = node.declarations[i - 1].end
              }
              _s.remove(start, end)
              left--
            }
          }
          // 处理 useContext
          processUseContext(decl.init, decl.id)
        }
      }
    }

    if (
        (node.type === 'VariableDeclaration' ||
            node.type === 'FunctionDeclaration' ||
            node.type === 'ClassDeclaration') &&
        !node.declare
    ) {
      walkDeclaration(node, setupBindings, userImportAlias)
    }
    endOffset = node.loc.end.index
  }
  // 响应性语法糖, 暂无
  // 3. Apply reactivity transform

  // 4. extract runtime props/emits code from setup context type
  if (propsTypeDecl) {
    // TS defineProps 提取Props
    extractRuntimeProps(propsTypeDecl, typeDeclaredProps, declaredTypes, isProd)
  }

  // 5. check useOptions args to make sure it doesn't reference setup scope
  checkInvalidScopeReference(propsRuntimeDecl, DEFINE_PROPS)

  // 6. remove non-script content，check <script></script> and remove

  // 7. analyze binding metadata
  if (propsRuntimeDecl) {
    for (const key of getObjectOrArrayExpressionKeys(propsRuntimeDecl)) {
      bindingMetadata[key] = BindingTypes.PROPS
    }
  }

  for (const key in typeDeclaredProps) {
    bindingMetadata[key] = BindingTypes.PROPS
  }

  for (const [key, { isType, imported, source }] of Object.entries(userImports)) {
    if (isType) continue
    bindingMetadata[key] = imported === '*' || (imported === 'default' && source.endsWith('.mpx')) || source === MPX_CORE
        ? BindingTypes.SETUP_CONST
        : BindingTypes.SETUP_MAYBE_REF
  }

  for (const key in setupBindings) {
    bindingMetadata[key] = setupBindings[key]
  }

  // 8. inject `useCssVars` calls


  // 9. finalize setup() argument signature
  let args = `__props`
  if (propsTypeDecl) {
    args += `: any`
  }
  // inject user assignment of props
  if (propsIdentifier) {
    // TODO add ts 类型声明
    _s.prependLeft(
        startOffset,
        `\nconst ${propsIdentifier} = __props\n`
    )
  }

  // args 添加 __context
  if (hasUseContextCall) {
    args += `, __context`
  }

  if (propsDestructureRestId) {
    // TODO
  }

  if (hasAwait) {
    // TODO
  }

  // 10. generate return statement
  let returned
  const allBindings = {
    ...scriptBindings,
    ...setupBindings
  };
  for (const key in userImports) {
    // import 进的的变量或方法，非mpxjs/core中的，暂时都进行return
    if (!userImports[key].isType && !userImportAlias[key]) {
      allBindings[key] = true
    }
  }
  returned = `{ ${Object.keys(allBindings).join(', ')} }`

  _s.appendRight(endOffset, `\nreturn ${returned}\n}\n\n`)

  // 11. finalize default export
  let runtimeOptions = ``
  if (propsRuntimeDecl) {
    let declCode = content.slice(propsRuntimeDecl.start, propsRuntimeDecl.end).trim()
    runtimeOptions += `\n  properties: ${declCode},`
  } else if (propsTypeDecl) {
    // TODO genRuntimeProps 待完善
    runtimeOptions += genRuntimeProps(typeDeclaredProps)
  }

  let exposeCall = ''
  if (isTS) {
    // TODO
  } else {
    // import {createComponent} from '@mpxjs/core' 添加是否已有import判断
    const ctor = getCtor(ctorType)
    _s.prependLeft(
        startOffset,
        `\nimport {${ctor}} from '${MPX_CORE}'\n${getCtor(ctorType)} ({${runtimeOptions}\n  ` +
        `setup(${args}) {\n`
    )
    _s.appendRight(endOffset, `})`)
  }

  return {
    content: _s.toString()
  }
}

function isCallOf(
    node,
    test
) {
  return !!(
      node &&
      node.type === 'CallExpression' &&
      node.callee.type === 'Identifier' &&
      (typeof test === 'string'
          ? node.callee.name === test
          : test(node.callee.name))
  )
}

// TODO add 注释
function canNeverBeRef(
    node,
    userReactiveImport
) {
  if (isCallOf(node, userReactiveImport)) {
    return true
  }
  switch (node.type) {
    case 'UnaryExpression':
    case 'BinaryExpression':
    case 'ArrayExpression':
    case 'ObjectExpression':
    case 'FunctionExpression':
    case 'ArrowFunctionExpression':
    case 'UpdateExpression':
    case 'ClassExpression':
    case 'TaggedTemplateExpression':
      return true
    case 'SequenceExpression':
      return canNeverBeRef(
          node.expressions[node.expressions.length - 1],
          userReactiveImport
      )
    default:
      if (node.type.endsWith('Literal')) {
        return true
      }
      return false
  }
}

function getObjectOrArrayExpressionKeys(value) {
  if (value.type === 'ArrayExpression') {
    return getArrayExpressionKeys(value)
  }
  if (value.type === 'ObjectExpression') {
    return getObjectExpressionKeys(value)
  }
  return []
}

function getArrayExpressionKeys(node) {
  const keys = []
  for (const element of node.elements) {
    if (element && element.type === 'StringLiteral') {
      keys.push(element.value)
    }
  }
  return keys
}

function getObjectExpressionKeys(node) {
  const keys = []
  for (const prop of node.properties) {
    if (
        (prop.type === 'ObjectProperty' || prop.type === 'ObjectMethod') &&
        !prop.computed
    ) {
      if (prop.key.type === 'Identifier') {
        keys.push(prop.key.name)
      } else if (prop.key.type === 'StringLiteral') {
        keys.push(prop.key.value)
      }
    }
  }
  return keys
}

function isCompilerMacro(c) {
  return c === DEFINE_PROPS || c === DEFINE_OPTIONS || c === USE_CONTEXT
}

function registerBinding(
    bindings,
    node,
    type
) {
  bindings[node.name] = type
}

function walkDeclaration(
    node,
    bindings,
    userImportAlias
) {
  if (node.type === 'VariableDeclaration') {
    const isConst = node.kind === 'const'
    for (const { id, init } of node.declarations) {
      const isDefineCall = !!(
          isConst &&
          isCallOf(
              init,
              isCompilerMacro
          )
      )
      if (id.type === 'Identifier') {
        let bindingType
        const userReactiveBinding = userImportAlias['reactive'] || 'reactive'
        // 是否是 reactive init
        if (isCallOf(init, userReactiveBinding)) {
          bindingType = isConst
              ? BindingTypes.SETUP_REACTIVE_CONST
              : BindingTypes.SETUP_LET
        } else if(
            isDefineCall ||
            (isConst && canNeverBeRef(init, userReactiveBinding))
        ) {
          bindingType = isCallOf(init, DEFINE_PROPS)
              ? BindingTypes.SETUP_REACTIVE_CONST
              : BindingTypes.SETUP_CONST
        } else if (isConst) {
          if (isCallOf(init, userImportAlias['ref'] || 'ref')) {
            bindingType = BindingTypes.SETUP_REF
          } else {
            bindingType = BindingTypes.SETUP_MAYBE_REF
          }
        } else {
          bindingType = BindingTypes.SETUP_LET
        }
        registerBinding(bindings, id, bindingType)
      } else {
        if (isCallOf(init, DEFINE_PROPS)) {
          // skip walking props destructure
          return
        }
        if (id.type === 'ObjectPattern') {
          walkObjectPattern(id, bindings, isConst, isDefineCall)
        } else if (id.type === 'ArrayPattern') {
          walkArrayPattern(id, bindings, isConst, isDefineCall)
        }
      }
    }
  } else if (
      node.type === 'TSEnumDeclaration' ||
      node.type === 'FunctionDeclaration' ||
      node.type === 'ClassDeclaration'
  ) {
    bindings[node.id.name] = BindingTypes.SETUP_CONST
  }

}

function walkObjectPattern(
    node,
    bindings,
    isConst,
    isDefineCall = false
) {
  for (const p of node.properties) {
    if (p.type === 'ObjectProperty') {
      if (p.key.type === 'Identifier' && p.key === p.value) {
        // shorthand: const { x } = ...
        const type = isDefineCall ? BindingTypes.SETUP_CONST : isConst ? BindingTypes.SETUP_MAYBE_REF : BindingTypes.SETUP_LET
        registerBinding(bindings, p.key, type)
      } else {
        // TODO
        //walkPattern(p.value, bindings, isConst, isDefineCall)
      }
    }
  }
}

function walkArrayPattern(
    node,
    bindings,
    isConst,
    isDefineCall = false
) {
  for (const e of node.elements) {
    // TODO
    // e && walkPattern(e, bindings, isConst, isDefineCall)
  }
}

// 取出 runtime props
function extractRuntimeProps(
    node,
    props,
    declaredTypes,
    isProd
) {
  const members = node.type === 'TSTypeLiteral' ? node.members : node.body
  // TODO
}

function getCtor(ctorType) {
  let ctor = 'createComponent'
  switch (ctorType) {
    case 'app':
      ctor = 'createApp'
      break
    case 'page':
      ctor = 'createPage'
      break
  }
  return ctor
}

module.exports = {
  compileScriptSetup
}
