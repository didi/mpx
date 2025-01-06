import { globalKeywords } from '../../utils/index.js'

export const globalRules = globalKeywords.map((v) => [new RegExp(`.*-${v}$`)])
