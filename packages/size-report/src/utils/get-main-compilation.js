module.exports = function (compilation) {
  while (compilation.compiler.parentCompilation) {
    compilation = compilation.compiler.parentCompilation
  }
  return compilation
}
