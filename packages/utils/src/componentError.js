const FunctionComponent = 0
const ClassComponent = 1
const IndeterminateComponent = 2 // Before we know whether it is function or class
const HostComponent = 5
const ForwardRef = 11
const SuspenseComponent = 13
const SimpleMemoComponent = 15
const LazyComponent = 16
const SuspenseListComponent = 19
const HostHoistable = 26
const HostSingleton = 27
let stopWhile = false

function describeComponentFrame(name, ownerName) {
  let sourceInfo = ''

  if (ownerName) {
    sourceInfo = ` (created by ${ownerName})`
  }

  if (ownerName === 'Page') {
    stopWhile = true
  }

  return `\n    in   (${name || 'Unknown'})  ${sourceInfo}`
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
function describeBuiltInComponentFrame(name, ownerFn) {
  let ownerName = null

  if (ownerFn) {
    ownerName = ownerFn.displayName || ownerFn.name || null
  }

  return describeComponentFrame(name, ownerName)
}
function describeFiber(fiber) {
  const owner = fiber._debugOwner ? fiber._debugOwner.type : null

  switch (fiber.tag) {
  case HostHoistable:
  case HostSingleton:
  case HostComponent:
    return describeBuiltInComponentFrame(fiber.type, owner)

  case LazyComponent:
    return describeBuiltInComponentFrame('Lazy', owner)

  case SuspenseComponent:
    return describeBuiltInComponentFrame('Suspense', owner)

  case SuspenseListComponent:
    return describeBuiltInComponentFrame('SuspenseList', owner)

  case FunctionComponent:
  case IndeterminateComponent:
  case SimpleMemoComponent:
    return describeFunctionComponentFrame(fiber.type, owner)

  case ForwardRef:
    return describeFunctionComponentFrame(fiber.type.render, owner)

  case ClassComponent:
    return describeFunctionComponentFrame(fiber.type, owner)

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
