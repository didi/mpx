import SelectQuery from './SelectQuery'

interface NodesRefH5 {
  boundingClientRect(callback?: WechatMiniprogram.BoundingClientRectCallback): SelectorQueryH5
  fields(fields: WechatMiniprogram.Fields, callback?: WechatMiniprogram.FieldsCallback): SelectorQueryH5
  scrollOffset(callback?: WechatMiniprogram.ScrollOffsetCallback): SelectorQueryH5
}

interface SelectorQueryH5 {
  exec(callback?: (...args: any[]) => any,): void
  select(selector: string): NodesRefH5
  selectAll(selector: string): NodesRefH5
  selectViewport(): NodesRefH5
  in(component: any): SelectorQueryH5
}

function createSelectorQuery (): SelectorQueryH5 {
  return new SelectQuery()
}

export {
  createSelectorQuery
}
