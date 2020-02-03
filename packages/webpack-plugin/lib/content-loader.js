module.exports = function (content) {
  if (!this.__mpx__) {
    return content
  }
  this.__mpx__.fileDependencies.forEach(file => {
    this.addDependency(file)
  })
  this.__mpx__.contextDependencies.forEach(context => {
    this.addContextDependency(context)
  })
  return this.__mpx__.content
}
