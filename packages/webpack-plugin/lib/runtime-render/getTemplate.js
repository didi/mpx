module.exports = function (packageName) {
  const basePath = packageName === 'main' ? '' : `/${packageName}`
  return `<import src="${basePath}/mpx-custom-element-${packageName}.wxml"/><template is="t_0_container" data="{{ i: r }}" wx:if="{{r && r.nt}}"></template>`
}
