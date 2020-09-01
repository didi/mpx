// 通过pagePath取最后2层作为key
const genQaComponentKey = (pagePath) => {
  let strPath = pagePath.split('/').reverse().slice(0, 2).join('')
  return strPath
}
export default function tabBarMixin (mixinType) {
  if (mixinType === 'app' && __mpx_mode__ === 'qa' && global.tabList) {
    let tabList = global.tabList.forEach((item) => {
      item.key = genQaComponentKey(item.pagePath)
    })
    return {
      data: {
        selectKey: '',
        tabList
      },
      onShow() {
        let strPath = this.tabList && this.tabList[0].pagePath
        let pagePath = strPath.split('/').reverse().slice(0, 2).join('')
        this.selectKey = pagePath
      },
      methods: {
        handleClickTab(item) {
          this.selectKey = item.key
        }
      }
    }
  } else {
    return {}
  }
}
