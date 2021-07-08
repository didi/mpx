module.exports = function (usingComponents, content, warn) {
  if (usingComponents) {
    const unusedComponents = usingComponents.filter(comp => !content.includes(`<${comp}`))
    if (unusedComponents.length) {
      warn && warn(`Components [ ${unusedComponents.join(' ')} ] may not be used`)
    }
  }
}
