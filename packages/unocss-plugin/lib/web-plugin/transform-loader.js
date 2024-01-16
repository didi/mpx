const { applyTransformers, isCssId } = require('./utils')

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
    res = await applyTransformers(ctx, code, id, 'pre')
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