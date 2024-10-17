import { isThenable, isFunction, isObject, isNumber } from './util'

function insertIntoSortedArray (sortedArr, value, key) {
  let i = 0
  for (; i < sortedArr.length; i++) {
    if (isObject(sortedArr[i]) && key) {
      if (sortedArr[i][key] > value[key]) break
    } else {
      if (sortedArr[i] > value) break
    }
  }
  sortedArr.splice(i, 0, value)
}

export default class InterceptorManager {
  constructor () {
    // 双队列数组, 0 为 fulfilled 队列，1 为 rejected 队列
    this.interceptors = [[], []]
    this.executionTimes = []; // 用于存储每个拦截器的执行时间
  }
  /**
   * {
   *    stage: 100,
   *    resolve: () => {}
   * }
   * {
   *   state: 100,
   *   reject: () => {}
   * }
   * @param fulfilled
   * @param rejected
   * @returns {(function(): void)|*}
   * stage: 拦截器的执行顺序，越小越先执行，默认为0
   */

  use (fulfilled, rejected) {
    let fulfilledStage = 0; let rejectedStage = 0
    if (isObject(fulfilled)) {
      fulfilledStage = isNumber(fulfilled.stage) ? fulfilled.stage : 0
      fulfilled = fulfilled.resolve
    }
    if (isObject(rejected)) {
      rejectedStage = isNumber(rejected.stage) ? rejected.stage : 0
      rejected = rejected.reject
    }
    const fulfilledFn = (result) => {
      const startTime = Date.now();
      const returned = isFunction(fulfilled) ? fulfilled(result) : result
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      this.executionTimes.push({ type: 'fulfilled', time: executionTime });
      return returned === undefined ? result : returned
    }
    const RejectedFn = (reason) => {
      const returned = isFunction(rejected) ? rejected(reason) : reason
      reason = returned === undefined ? reason : returned
      return isThenable(reason) ? reason : Promise.reject(reason)
    }

    const wrappedFulfilled = {
      stage: fulfilledStage,
      fn: fulfilledFn
    }

    const wrappedRejected = {
      stage: rejectedStage,
      fn: RejectedFn
    }

    insertIntoSortedArray(this.interceptors[0], wrappedFulfilled, 'stage')
    insertIntoSortedArray(this.interceptors[1], wrappedRejected, 'stage')

    return () => {
      const fulfilledIndex = this.interceptors[0].indexOf(wrappedFulfilled)
      const rejectedIndex = this.interceptors[1].indexOf(wrappedRejected)
      fulfilledIndex > -1 && this.interceptors[0].splice(fulfilledIndex, 1)
      rejectedIndex > -1 && this.interceptors[1].splice(rejectedIndex, 1)
    }
  }

  forEach (fn) {
    this.interceptors[0].forEach((fulfilledItem, index) => {
      fn({
        fulfilled: fulfilledItem.fn,
        rejected: this.interceptors[1][index].fn
      })
    })
  }
}
