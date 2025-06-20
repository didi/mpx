import { globalKeywords } from '../../utils/index'

export const globalRules = globalKeywords.map((v) => [new RegExp(`.*-${v}$`)])
