<script lang="ts" setup>
import type { DefaultTheme } from 'vitepress/theme'
import { useData } from 'vitepress'
import { isActive } from 'vitepress/dist/client/shared.js'
import { VPLink } from 'vitepress/theme'

defineProps<{
  item: DefaultTheme.NavItemWithLink
}>()

const { page } = useData()

defineOptions({ inheritAttrs: false })
</script>

<template>
  <div class="VPMenuLink">
    <VPLink
            v-bind="$attrs"
            :class="{
              active: isActive(
                page.relativePath,
                item.activeMatch || item.link,
                !!item.activeMatch
              )
            }"
            :href="item.link"
            :target="item.target"
            :rel="item.rel"
            :no-icon="item.noIcon">
      <span v-html="item.text"></span>
      <NavBarBadge v-if="item.badge" :text="item.badge.text" />
    </VPLink>
  </div>
</template>

<style scoped>
.VPMenuGroup+.VPMenuLink {
  margin: 12px -12px 0;
  border-top: 1px solid var(--vp-c-divider);
  padding: 12px 12px 0;
}

.link {
  display: block;
  border-radius: 6px;
  padding: 0 12px;
  line-height: 32px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  text-align: left;
  white-space: nowrap;
  transition:
    background-color 0.25s,
    color 0.25s;
}

.link:hover {
  color: var(--vp-c-brand-1);
  background-color: var(--vp-c-default-soft);
}

.link.active {
  color: var(--vp-c-brand-1);
}
</style>
