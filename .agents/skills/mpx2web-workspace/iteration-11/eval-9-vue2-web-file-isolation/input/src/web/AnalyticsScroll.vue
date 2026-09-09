<template>
  <div class="analytics-scroll">
    <slot name="content" />
  </div>
</template>

<script setup>
defineProps({ scrollY: Boolean })
</script>
