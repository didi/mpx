const { applyTransformers, isCssId } = require('./utils')

async function transform (code, map) {
  const callback = this.async()
  const ctx = this._compiler?.__unoCtx
  const id = this.resource
  const { extract } = ctx
  await ctx.ready
  const res = await applyTransformers(ctx, code, id, 'pre')
  if (!isCssId(id)) {
    extract.call(this, res == null ? code : res.code, id)
  }

  if (res == null) { callback(null, code, map) } else if (typeof res !== 'string') { callback(null, res.code, map == null ? map : (res.map || map)) } else { callback(null, res, map) }
}

module.exports = transform
