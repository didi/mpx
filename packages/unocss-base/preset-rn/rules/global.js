import { globalKeywords } from '../../utils/index'

export const blockGlobalRules = globalKeywords.map((v) => [new RegExp(`.*-${v}$`)])
