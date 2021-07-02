module.exports = function (content) {
  if (!this.__mpx__) {
    return content
  }
  // todo 由于additionalAssets阶段还会进行一次依赖同步，此处获取的依赖不一定是最终的依赖，可能会有bad case
  this.__mpx__.fileDependencies.forEach(file => {
    this.addDependency(file)
  })
  this.__mpx__.contextDependencies.forEach(context => {
    this.addContextDependency(context)
  })
  return this.__mpx__.content
}
