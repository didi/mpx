
import { ref, watch, computed } from '@mpxjs/core'

const props = defineProps({
  controlKey: String,
  options: { type: Array, value: [] },
  value: { type: String, value: '' },
  disabled: { type: Boolean, value: false },
  label: { type: String, value: '分类' }
})
const { triggerEvent } = useContext()
const selectedValue = ref(props.value)

watch(() => props.value, (value) => {
  selectedValue.value = value
})

const displayOptions = computed(() => props.options.map((option) => ({
  value: option.value,
  label: option.label,
  selected: option.value === selectedValue.value,
  disabled: props.disabled || option.disabled
})))
const selectedLabel = computed(() => {
  const option = props.options.find((option) => option.value === selectedValue.value)
  return option ? option.label : '未选择'
})

function selectOption(index) {
  const option = props.options[index]
  if (!option || props.disabled || option.disabled || option.value === selectedValue.value) return
  selectedValue.value = option.value
  triggerEvent('change', { controlKey: props.controlKey, value: option.value })
}

defineExpose({ displayOptions, selectedLabel, selectOption })
