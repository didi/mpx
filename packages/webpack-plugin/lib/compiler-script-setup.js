const babylon = require('@babel/parser')
var MagicString = require('magic-string')

// Special compiler macros
const DEFINE_PROPS = 'defineProps'
const DEFINE_OPTIONS = 'defineOptions'
const USE_CONTEXT = 'useContext'

const MPX_CORE = '@mpxjs/core'

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

function isCompilerMacro(c) {
  return c === DEFINE_PROPS || c === DEFINE_OPTIONS || c === USE_CONTEXT
}

function walkDeclaration(node, bindings, userImportAlias) {
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

      }

    }
  } else if (node.type === 'FunctionDeclaration') {

  } else if (node.type === 'ClassDeclaration') {

  }

}

function compileScriptSetup(content, options) {
  const _s = new MagicString(content)
  const scriptBindings = Object.create(null)
  const setupBindings = Object.create(null)
  const userImportAlias = Object.create(null)
  const userImports = Object.create(null)

  let startOffset = 0
  let endOffset = 0
  let hasAwait = false

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
    } else if (node.type === 'VariableDeclaration' || node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') {
      walkDeclaration(node, setupBindings)
    }
    endOffset = node.loc.end.index
  }

  // 9. finalize setup() argument signature
  let args = `__props`

  let exposeCall = ''

  // 10. generate return statement
  let returned
  const allBindings = {
    ...scriptBindings,
    ...setupBindings
  };
  for (const key in userImports) {
    if (!userImports[key].isType && userImports[key].isUsedInTemplate) {
      allBindings[key] = true;
    }
  }
  returned = `{ ${Object.keys(allBindings).join(', ')} }`;


  let runtimeOptions = ``


  s.appendRight(endOffset, `\nreturn ${returned}\n}\n\n`)

  _s.prependLeft(
      startOffset,
      `\ncreateComponent ({${runtimeOptions}\n  ` +
      `${hasAwait ? `async ` : ``}setup(${args}) {\n${exposeCall}`
  )
  _s.appendRight(endOffset, `})`)

  return {
    content: _s.toString()
  }
}

module.exports = {
  compileScriptSetup
}
