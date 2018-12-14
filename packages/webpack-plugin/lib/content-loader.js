module.exports = function () {
  if (!this.__mpx__) {
    throw new Error('Content loader need __mpx__ property in loader context!')
  }
  this.__mpx__.fileDependencies.forEach(file => {
    this.addDependency(file)
  })
  this.__mpx__.contextDependencies.forEach(context => {
    this.addContextDependency(context)
  })
  return this.__mpx__.content
}
