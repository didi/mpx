const { applyTransformers, isCssId } = require('./utils')

async function transform (code, map) {
  const callback = this.async()
  const extract = this._compiler?.extract
  const ctx = this._compiler?.ctx
  const id = this.resource
  const tasks = this._compiler?.tasks
  const res = await applyTransformers(ctx, code, id, 'pre')
  if (!isCssId(id)) {
    if (res == null) { tasks.push(extract.call(this, code, id)) } else { tasks.push(extract.call(this, res.code, id)) }
  }

  if (res == null) { callback(null, code, map) } else if (typeof res !== 'string') { callback(null, res.code, map == null ? map : (res.map || map)) } else { callback(null, res, map) }
}

module.exports = transform
