/**
 * wechat miniprogram app/page/component config type
 */

export type TabBarItem = {
  pagePath: string
  text: string
  iconPath?: string
  selectedIconPath?: string
}
export interface JsonConfig {
  path?: string,
  component?: boolean
  usingComponents?: Record<string, string>
  componentGenerics?: Record<string, { default?: string }>
  packages?: string[]
  pages?: (
    | string
    | {
        src: string
        path: string
      }
  )[]
  tabBar?: {
    custom?: boolean
    color?: string
    selectedColor?: string
    backgroundColor?: string
    list?: TabBarItem[]
  }
  networkTimeout?: {
    request: number
    connectSocket: number
    uploadFile: number
    downloadFile: number
  }
  subpackages?: {
    root?: 'string'
    pages: JsonConfig['pages']
  }[]
  window?: Record<string, unknown>
  style?: string
  singlePage?: {
    navigationBarFit: boolean
  }
}
