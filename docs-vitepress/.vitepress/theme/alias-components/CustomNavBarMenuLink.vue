<script lang="ts" setup>
import type { DefaultTheme } from 'vitepress/theme'
import { useData } from 'vitepress'
import { isActive } from 'vitepress/dist/client/shared.js'
import { VPLink } from 'vitepress/theme'

defineProps<{
  item: DefaultTheme.NavItemWithLink
}>()

const { page } = useData()
</script>

<template>
  <VPLink
          :class="{
            VPNavBarMenuLink: true,
            active: isActive(
              page.relativePath,
              item.activeMatch || item.link,
              !!item.activeMatch
            )
          }"
          :href="item.link"
          :target="item.target"
          :rel="item.rel"
          :no-icon="item.noIcon"
          tabindex="0">
    <span v-html="item.text"></span>
    <NavBarBadge v-if="item.badge" :text="item.badge.text" />
  </VPLink>
</template>

<style scoped>
.VPNavBarMenuLink {
  display: flex;
  align-items: center;
  padding: 0 12px;
  line-height: var(--vp-nav-height);
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  transition: color 0.25s;
}

.VPNavBarMenuLink.active {
  color: var(--vp-c-brand-1);
}

.VPNavBarMenuLink:hover {
  color: var(--vp-c-brand-1);
}
</style>
