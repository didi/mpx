const mpx = {
	// pages全局记录，无需区分主包分包
	pagesMap: {},
	// 组件资源记录，依照所属包进行记录
	componentsMap: {
		main: {}
	},
	usingComponents: {},
	// todo es6 map读写性能高于object，之后会逐步替换
	vueContentCache: new Map(),
	wxsAssetsCache: new Map(),
	currentPackageRoot: '',
	wxsContentMap: {},
	minimize: false
}

module.exports = mpx
