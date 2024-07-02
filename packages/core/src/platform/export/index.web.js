import { EffectScope } from 'vue'
import { hasOwn } from '@mpxjs/utils'
import { PausedState } from '../../helper/const'

const hackEffectScope = () => {
  EffectScope.prototype.pause = function () {
    if (this.active) {
      let i, l
      for (i = 0, l = this.effects.length; i < l; i++) {
        const effect = this.effects[i]
        // vue2.7中存在对于watcher实例方法的重写(doWatch)，因此无法通过修改Watcher.prototype统一实现pause和resume，只能逐个实例修改实现
        if (!hasOwn(effect, 'pausedState')) {
          effect.pausedState = PausedState.resumed
          const rawUpdate = effect.update
          effect.update = function () {
            if (effect.pausedState !== PausedState.resumed) {
              effect.pausedState = PausedState.dirty
            } else {
              rawUpdate.call(effect)
            }
          }
        }
        if (effect.pausedState !== PausedState.dirty) {
          effect.pausedState = PausedState.paused
        }
      }
      if (this.scopes) {
        for (i = 0, l = this.scopes.length; i < l; i++) {
          this.scopes[i].pause()
        }
      }
    }
  }

  EffectScope.prototype.resume = function (ignoreDirty = false) {
    if (this.active) {
      let i, l
      for (i = 0, l = this.effects.length; i < l; i++) {
        const effect = this.effects[i]
        if (hasOwn(effect, 'pausedState')) {
          const lastPausedState = effect.pausedState
          effect.pausedState = PausedState.resumed
          if (!ignoreDirty && lastPausedState === PausedState.dirty) {
            effect.update()
          }
        }
      }
      if (this.scopes) {
        for (i = 0, l = this.scopes.length; i < l; i++) {
          this.scopes[i].resume(ignoreDirty)
        }
      }
    }
  }
}

hackEffectScope()

export {
  // watch
  watchEffect,
  watchSyncEffect,
  watchPostEffect,
  watch,
  // reactive
  reactive,
  isReactive,
  shallowReactive,
  set,
  del,
  markRaw,
  // ref
  ref,
  unref,
  toRef,
  toRefs,
  isRef,
  customRef,
  shallowRef,
  triggerRef,
  // computed
  computed,
  // instance
  getCurrentInstance,
  // effectScope
  effectScope,
  getCurrentScope,
  onScopeDispose
} from 'vue'

export {
  // i18n
  useI18n
} from 'vue-i18n-bridge'
