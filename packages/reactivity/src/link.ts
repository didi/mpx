import type { Dependency } from './dep'
import type { Subscriber } from './effect'

/**
 * A Link is an internal node in two doubly-linked lists - inspired by Preact Signals.
 *
 * It represents a link between a source (Dep) and a subscriber (Effect or Computed).
 *
 * @internal
 */
export class Link {
  /**
   * previous Dep
   */
  prevDep?: Link
  /**
   * next Dep
   */
  nextDep?: Link
  /**
   * previous Subscriber
   */
  prevSub?: Link
  /**
   * next Subscriber
   */
  nextSub?: Link
  /**
   * previous active link
   */
  prevActiveLink?: Link

  constructor(
    public dep: Dependency | (Dependency & Subscriber),
    public sub: Subscriber | (Dependency & Subscriber)
  ) {
    this.prevDep =
      this.nextDep =
      this.prevSub =
      this.nextSub =
      this.prevActiveLink =
        undefined
  }
}

/** @internal */
export function addLink(dep: Dependency, sub: Subscriber): Link | undefined {
  const currentDep = sub.depsTail
  if (currentDep?.dep === dep) {
    // continuously add same dependency
    return
  }
  const nextDep = currentDep ? currentDep.nextDep : sub.deps
  if (nextDep?.dep === dep) {
    // same order as the previous tracking batch
    sub.depsTail = nextDep
    return
  }
  const depLastSub = dep.subsTail
  if (depLastSub?.sub === sub && isValidLink(depLastSub, sub)) {
    // If the dep has been added before(in the same tracking batch),
    // we don't need to add it again.
    return
  }
  // need to create a new link and add it
  return addNewLink(dep, sub, currentDep, nextDep)
}

function isValidLink(checkLink: Link, sub: Subscriber): boolean {
  for (let link = sub.deps; link; link = link.nextDep) {
    if (link === checkLink) {
      return true
    }
    if (link === sub.depsTail) {
      break
    }
  }
  return false
}

/**
 * Adds a new link between a dependency and a subscriber.
 * @internal
 */
function addNewLink(
  dep: Dependency,
  sub: Subscriber,
  prevDep: Link | undefined,
  nextDep: Link | undefined
): Link {
  const newLink: Link = {
    dep,
    sub,
    prevDep,
    nextDep,
    prevSub: undefined,
    nextSub: undefined
  }

  if (!prevDep) {
    sub.deps = newLink
  } else {
    prevDep.nextDep = newLink
  }

  if (!dep.subs) {
    dep.subs = newLink
  } else {
    const oldTail = dep.subsTail!
    newLink.prevSub = oldTail
    oldTail.nextSub = newLink
  }

  sub.depsTail = newLink
  dep.subsTail = newLink

  return newLink
}

/** @internal */
export function removeLink(link: Link, sub = link.sub): Link | undefined {
  const { dep, prevDep, nextDep, prevSub, nextSub } = link

  if (nextDep) {
    nextDep.prevDep = prevDep
  } else {
    sub.depsTail = prevDep
  }

  if (prevDep) {
    prevDep.nextDep = nextDep
  } else {
    sub.deps = nextDep
  }

  if (nextSub) {
    nextSub.prevSub = prevSub
  } else {
    dep.subsTail = prevSub
  }

  if (prevSub) {
    prevSub.nextSub = nextSub
  } else {
    dep.subs = nextSub
    // Maybe we could remove the dep recursively when !nextSub
  }

  return nextDep
}
