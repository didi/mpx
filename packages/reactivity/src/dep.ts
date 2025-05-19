import { SubscriberFlags } from './const'
import { Subscriber } from './effect'
import { Link } from './link'

export interface Dependency {
  subs: Link | undefined
  subsTail: Link | undefined
}

export class Dep implements Dependency {
  subs: Link | undefined
  subsTail: Link | undefined

  notify() {
    for (let link = this.subs; link !== undefined; link = link.nextSub) {
      // 深层订阅者递归地 push PendingComputed
      link.sub.notify(SubscriberFlags.Dirty)
    }
  }
}
