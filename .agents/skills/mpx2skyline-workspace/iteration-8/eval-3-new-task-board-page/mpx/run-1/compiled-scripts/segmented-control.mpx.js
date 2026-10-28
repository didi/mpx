import { ref, computed, watch, toRefs } from '@mpxjs/core'
import {createComponent} from '@mpxjs/core'
createComponent ({
  properties: {
  controlKey: { type: String, value: '' },
  options: { type: Array, value: [] },
  value: { type: String, value: '' },
  disabled: { type: Boolean, value: false },
  label: { type: String, value: '请选择' }
},
 initData: { safeOptions: [] },
  setup(__props, __context) {
 const useContext = () => { return __context }

const props = __props





















const { disabled, label } = toRefs(props)
const { triggerEvent } = useContext()
const safeOptions = computed(() => Array.isArray(props.options) ? props.options : [])
const currentValue = ref(props.value)
const pressedValue = ref(null)
watch(() => props.value, value => { currentValue.value = value })
watch(() => [props.disabled, props.options], () => { pressedValue.value = null }, { deep: true })

function selectOption (option) {
  if (props.disabled || option.disabled) return
  currentValue.value = option.value
  triggerEvent('change', { controlKey: props.controlKey, value: option.value })
}
function pressOption (option) {
  if (props.disabled || option.disabled) return
  pressedValue.value = option.value
}
function releaseOption () {
  pressedValue.value = null
}


return { safeOptions, currentValue, pressedValue, disabled, label, selectOption, pressOption, releaseOption }
}

})
