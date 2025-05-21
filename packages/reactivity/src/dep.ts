import { activeSub } from './effect'
import { type Link, addLink } from './link'

export interface Dependency {
  subs: Link | undefined
  subsTail: Link | undefined
  notify(): void
}

export class Dep implements Dependency {
  subs: Link | undefined
  subsTail: Link | undefined

  track(): void {
    if (activeSub) {
      addLink(this, activeSub)
    }
  }

  notify() {
    for (let link = this.subs; link; link = link.nextSub) {
      link.sub.notify()
    }
  }
}
