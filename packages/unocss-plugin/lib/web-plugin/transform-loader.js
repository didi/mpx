const { applyTransformers, isCssId } = require('./utils')
const parseComponent = require('@mpxjs/webpack-plugin/lib/parser')
const genComponentTag = require('@mpxjs/webpack-plugin/lib/utils/gen-component-tag')
const path = require('path')
const MagicString = require('magic-string')

async function transform (code, map) {
  const callback = this.async()
  const ctx = this._compiler.__unoCtx
  if (!ctx) return callback(null, code, map)
  await ctx.ready
  // 使用resourcePath而不是resource作为id，规避query的影响
  const id = this.resourcePath
  const { extract, transformCache } = ctx
  let res
  // 通过transformCache减少不必要的重复的transform/extract行为，如对于.mpx/.vue文件及其block request(template/style/script)进行重复transform/extract
  if (transformCache.has(id)) {
    res = transformCache.get(id)
  } else {
    const mpx = this._compilation.__mpx__
    const extname = path.extname(id)
    if (extname === '.mpx') {
      const parts = parseComponent(code, {
        id,
        needMap: this.sourceMap,
        mode: mpx.mode,
        env: mpx.env
      })
      let output = ''
      if (parts.styles.length) {
        await Promise.all(parts.styles.map(style => {
          return (async function () {
            const styleRes = await applyTransformers(ctx, style.content.trim(), id + '.css')
            output += genComponentTag(style, {
              content () {
                if (styleRes) {
                  return styleRes.code
                }
                return style.content
              }
            })
          }())
        }))
      }
      if (parts.template) {
        const templateRes = await applyTransformers(ctx, parts.template.content.trim(), id + '.html')
        output += genComponentTag(parts.template, {
          content () {
            if (templateRes) {
              return templateRes.code
            }
            return parts.template.content
          }
        })
      }
      output += genComponentTag(parts.script)
      output += genComponentTag(parts.json)
      const s = new MagicString(output)
      res = {
        code: output,
        map: s.generateMap({ hires: true, source: id })
      }
    } else {
      res = await applyTransformers(ctx, code, id)
    }

    if (!isCssId(id)) {
      await extract.call(this, res == null ? code : res.code, id)
    }
    transformCache.set(id, res)
  }

  if (res == null) {
    callback(null, code, map)
  } else if (typeof res !== 'string') {
    callback(null, res.code, map == null ? map : (res.map || map))
  } else {
    callback(null, res, map)
  }
}

module.exports = transform
