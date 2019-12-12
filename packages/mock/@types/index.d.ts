interface ListItem {
  url: string,
  rule: any
}

declare const mock: (arr: ListItem[]) => void

export default mock
