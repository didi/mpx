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
    return
  }
  const nextDep = currentDep ? currentDep.nextDep : sub.deps
  if (nextDep?.dep === dep) {
    sub.depsTail = nextDep
    return
  }
  const depLastSub = dep.subsTail
  if (depLastSub?.sub === sub && isValidLink(depLastSub, sub)) {
    return
  }
  return addNewLink(dep, sub, nextDep, currentDep)
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

function addNewLink(
  dep: Dependency,
  sub: Subscriber,
  nextDep: Link | undefined,
  depsTail: Link | undefined
): Link {
  const newLink: Link = {
    dep,
    sub,
    nextDep,
    prevSub: undefined,
    nextSub: undefined
  }

  if (!depsTail) {
    sub.deps = newLink
  } else {
    depsTail.nextDep = newLink
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
  const dep = link.dep
  const prevDep = link.prevDep
  const nextDep = link.nextDep
  const nextSub = link.nextSub
  const prevSub = link.prevSub

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
    if (!nextSub) {
      // TODO Recursively remove the dep
      // unwatched(dep)
    }
  }

  return nextDep
}
