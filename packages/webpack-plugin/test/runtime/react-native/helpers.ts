// 测试链路桥：把 spec 的「用户样式输入」经过 styleHelperMixin.ios.js 的 transformStyleObj 后，
// 再喂给 runtime 的 transformShorthand / useTransformStyle，与生产 __getStyle 数据流对齐
// （所有用户样式都先经此预处理，runtime 才会拿到真实的 number / 归一后的 lineHeight 字符串）。
//
// 与 setup.js 的 global.__formatValue 共用同一份简化语义，避免再 import @mpxjs/core 引入运行时依赖。
// 行为镜像 packages/core/src/platform/builtInMixins/styleHelperMixin.ios.js 的 transformStyleObj：
//   - lineHeight 是 number 且非 0 → '<n*100>%'（RN 不接受 unit-less lineHeight，统一改写为 %）
//   - lineHeight === 0 → 0 直透
//   - flex → 原样保留（编译期不归一，留给 transformFlex 处理）
//   - 其它 prop → __formatValue（'1px' → 1、'auto' / 'red' / '1px solid red' 多 token 原样）

const isNum = (v: unknown) => !isNaN(+(v as number))

export function transformStyleObj<T extends Record<string, any>> (styleObj: T): Record<string, any> {
  const transformed: Record<string, any> = {}
  Object.keys(styleObj).forEach((prop) => {
    const value = styleObj[prop]
    if (prop === 'lineHeight' && isNum(value)) {
      transformed[prop] = +value === 0 ? 0 : `${Math.round((value as number) * 100)}%`
    } else if (prop === 'flex') {
      transformed[prop] = value
    } else {
      transformed[prop] = (global as any).__formatValue(value)
    }
  })
  return transformed
}
