<script setup lang="ts">
defineProps<{
    text?: string
}>()
</script>

<template>
    <span class="badge">
        {{ text || '新' }}
    </span>
</template>

<style scoped>
.badge {
    display: inline-block;
    padding: 3.5px 4px;
    margin-left: 6px;
    font-size: 10px;
    font-style: normal;
    font-weight: 600;
    line-height: 1;
    letter-spacing: .2px;
    border-radius: 6px;
    background: #3b8eed;
    color: #f9f9f9;
    vertical-align: text-bottom;
}
</style>