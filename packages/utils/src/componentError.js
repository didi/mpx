const FunctionComponent = 0
const IndeterminateComponent = 2 // Before we know whether it is function or class
const ForwardRef = 11
const SimpleMemoComponent = 15
let stopWhile = false
const fiberError = ['MpxStickyHeader', 'MpxView']

function describeComponentFrame(name, ownerName) {
  let sourceInfo = ''
  if (fiberError.includes(ownerName) || !ownerName) {
    return ''
  }
  if (ownerName) {
    sourceInfo = ` (created by ${ownerName})`
  }
  if (ownerName === 'Page') {
    stopWhile = true
  }
  if (name) {
    return `\n    in   (${name})  ${sourceInfo}`
  }
  return ''
}

function describeFunctionComponentFrame(fn, ownerFn) {
  if (!fn) {
    return ''
  }
  const name = fn.displayName || fn.name || null
  let ownerName = null
  if (ownerFn) {
    ownerName = ownerFn.displayName || ownerFn.name || null
  }
  return describeComponentFrame(name, ownerName)
}

function describeFiber(fiber) {
  const owner = fiber._debugOwner ? fiber._debugOwner.type : null
  switch (fiber.tag) {
    case FunctionComponent:
    case IndeterminateComponent:
    case SimpleMemoComponent:
      return describeFunctionComponentFrame(fiber.type, owner)
    case ForwardRef:
      return describeFunctionComponentFrame(fiber.type.render, owner)
    default:
      return ''
  }
}
function getStackByFiberInDevAndProd(workInProgress) {
  try {
    let info = ''
    let node = workInProgress
    do {
      info += describeFiber(node)
      node = node.return
    // eslint-disable-next-line no-unmodified-loop-condition
    } while (node && !stopWhile)
    stopWhile = false
    return info
  } catch (x) {
    return `\nError generating stack:  ${x.message} \n ${x.stack}`
  }
}

export { getStackByFiberInDevAndProd }
