import { ref, computed, watch, getCurrentInstance } from '@mpxjs/core'
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





const instance = getCurrentInstance().proxy
const safeOptions = computed(() => Array.isArray(props.options) ? props.options : [])
const selectedValue = ref(props.value)
const pressedIndex = ref(-1)
watch(() => props.value, (value) => { selectedValue.value = value })
watch(() => props.disabled, (value) => { if (value) pressedIndex.value = -1 })
watch(() => props.options, () => { pressedIndex.value = -1 })

function getAvailableOption (event) {
  if (props.disabled) return
  const option = safeOptions.value[Number(event.currentTarget.dataset.index)]
  if (option && !option.disabled) return option
}
function onSelect (event) {
  const option = getAvailableOption(event)
  if (!option) return
  selectedValue.value = option.value
  instance.triggerEvent('change', { controlKey: props.controlKey, value: option.value })
}
function onPress (event) {
  if (getAvailableOption(event)) pressedIndex.value = Number(event.currentTarget.dataset.index)
}
function onRelease () { pressedIndex.value = -1 }


return { safeOptions, selectedValue, pressedIndex, onSelect, onPress, onRelease }
}

})
