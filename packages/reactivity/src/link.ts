import { Dep } from './dep'
import { Subscriber } from './effect'

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
    public dep: Dep,
    public sub: Subscriber
  ) {
    this.prevDep =
      this.nextDep =
      this.prevSub =
      this.nextSub =
      this.prevActiveLink =
        undefined
  }
}
