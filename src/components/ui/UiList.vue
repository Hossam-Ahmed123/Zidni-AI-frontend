<template>
  <ul class="ui-list" :class="listClasses">
    <slot />
  </ul>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type UiListDensity = 'default' | 'comfortable' | 'compact';

const props = withDefaults(
  defineProps<{
    density?: UiListDensity;
    divided?: boolean;
    inset?: boolean;
    padded?: boolean;
  }>(),
  {
    density: 'default',
    divided: false,
    inset: false,
    padded: true
  }
);

const listClasses = computed(() => ({
  'ui-list--divided': props.divided,
  'ui-list--density-comfortable': props.density === 'comfortable',
  'ui-list--density-compact': props.density === 'compact',
  'ui-list--inset': props.inset,
  'ui-list--flush': !props.padded
}));
</script>

<style scoped>
.ui-list {
  list-style: none;
  margin: 0;
  padding: var(--sakai-space-2) 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.ui-list--flush {
  padding: 0;
}

.ui-list--inset {
  padding-inline: var(--sakai-space-3);
}

.ui-list--divided :deep(.ui-list-item + .ui-list-item) {
  border-top: 1px solid color-mix(in srgb, var(--sakai-border-color) 75%, transparent);
}

.ui-list--density-comfortable :deep(.ui-list-item) {
  padding-block: var(--sakai-space-4);
}

.ui-list--density-compact :deep(.ui-list-item) {
  padding-block: var(--sakai-space-2);
}
</style>
