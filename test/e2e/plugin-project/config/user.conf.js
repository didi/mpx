function formatOption (option) {
  if (option === 'true') return true
  if (option === 'false') return false
  return option
}

// 根据创建项目时的问题生成的
// 改动需谨慎，有的选项存在互斥关系，比如跨平台，则无法使用云函数
// 若需修改以启用新的能力，建议试试新建项目按问题生成模板后把这部分内容拷贝过来
module.exports = {
  srcMode: formatOption('wx'),
  cross: formatOption('true'),
  openChildProcess: formatOption('true'),
  transWeb: formatOption('true'),
  cloudFunc: formatOption('false'),
  isPlugin: formatOption('true'),
  tsSupport: formatOption('true'),
  needEslint: formatOption('true'),
  needDll: formatOption('false'),
  needUnitTest: formatOption('true')
}
