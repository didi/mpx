<template>
  <div ref="chart" class="analytics-chart"></div>
</template>

<script setup>
import { onMounted } from 'vue'
import { createChart } from './chart-sdk'

const props = defineProps({ metrics: Array })
onMounted(() => createChart(document.querySelector('.analytics-chart'), props.metrics))
</script>
