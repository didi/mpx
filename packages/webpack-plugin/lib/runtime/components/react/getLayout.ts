export type SectionListDataProp = Array<{
  title: string
  data: any[]
}>

interface SectionHeader {
  type: 'SECTION_HEADER'
}

interface Row {
  type: 'ROW'
  index: number
}

interface SectionFooter {
  type: 'SECTION_FOOTER'
}

type ListElement = SectionHeader | Row | SectionFooter

export interface Parameters {
  getItemHeight: (
    rowData: any,
    sectionIndex: number,
    rowIndex: number,
  ) => number
  getSeparatorHeight?: (sectionIndex: number, rowIndex: number) => number
  getSectionHeaderHeight?: (sectionIndex: number) => number
  getSectionFooterHeight?: (sectionIndex: number) => number
  listHeaderHeight?: number | (() => number)
}

export default ({
  getItemHeight,
  getSeparatorHeight = () => 0,
  getSectionHeaderHeight = () => 0,
  getSectionFooterHeight = () => 0,
  listHeaderHeight = 0,
}: Parameters) => (data: SectionListDataProp, index: number) => {
  let i = 0
  let sectionIndex = 0
  let elementPointer: ListElement = { type: 'SECTION_HEADER' }
  let offset =
    typeof listHeaderHeight === 'function'
      ? listHeaderHeight()
      : listHeaderHeight

  while (i < index) {
    switch (elementPointer.type) {
      case 'SECTION_HEADER': {
        const sectionData = data[sectionIndex].data

        offset += getSectionHeaderHeight(sectionIndex)

        // If this section is empty, we go right to the footer...
        if (sectionData.length === 0) {
          elementPointer = { type: 'SECTION_FOOTER' }
          // ...otherwise we make elementPointer point at the first row in this section
        } else {
          elementPointer = { type: 'ROW', index: 0 }
        }

        break
      }
      case 'ROW': {
        const sectionData = data[sectionIndex].data

        const rowIndex = elementPointer.index

        offset += getItemHeight(sectionData[rowIndex], sectionIndex, rowIndex)
        elementPointer.index += 1

        if (rowIndex === sectionData.length - 1) {
          elementPointer = { type: 'SECTION_FOOTER' }
        } else {
          offset += getSeparatorHeight(sectionIndex, rowIndex)
        }

        break
      }
      case 'SECTION_FOOTER': {
        offset += getSectionFooterHeight(sectionIndex)
        sectionIndex += 1
        elementPointer = { type: 'SECTION_HEADER' }
        break
      }
    }

    i += 1
  }

  let length
  switch (elementPointer.type) {
    case 'SECTION_HEADER':
      length = getSectionHeaderHeight(sectionIndex)
      break
    case 'ROW':
      const rowIndex = elementPointer.index
      length = getItemHeight(
        data[sectionIndex].data[rowIndex],
        sectionIndex,
        rowIndex,
      )
      break
    case 'SECTION_FOOTER':
      length = getSectionFooterHeight(sectionIndex)
      break
    default:
      throw new Error('Unknown elementPointer.type')
  }

  return { length, offset, index }
}