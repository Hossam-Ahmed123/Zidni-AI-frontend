<template>
  <li
    class="ui-list-item"
    :class="itemClasses"
    :tabindex="props.clickable ? 0 : undefined"
    :role="props.clickable ? 'button' : undefined"
    @click="handleClick"
    @keydown.enter.prevent="handleKeyDown"
    @keydown.space.prevent="handleKeyDown"
  >
    <div v-if="$slots.leading" class="ui-list-item__leading">
      <slot name="leading" />
    </div>
    <div class="ui-list-item__content">
      <div class="ui-list-item__header">
        <div class="ui-list-item__title">
          <slot name="title">
            <slot />
          </slot>
        </div>
        <div v-if="$slots.meta" class="ui-list-item__meta">
          <slot name="meta" />
        </div>
      </div>
      <div v-if="$slots.subtitle" class="ui-list-item__subtitle">
        <slot name="subtitle" />
      </div>
      <div v-if="$slots.description" class="ui-list-item__description">
        <slot name="description" />
      </div>
    </div>
    <div v-if="$slots.actions" class="ui-list-item__actions">
      <slot name="actions" />
    </div>
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type UiListItemAlign = 'center' | 'start';

const props = withDefaults(
  defineProps<{
    clickable?: boolean;
    align?: UiListItemAlign;
  }>(),
  {
    clickable: false,
    align: 'center'
  }
);

const emit = defineEmits<{ (event: 'click', payload: MouseEvent | KeyboardEvent): void }>();

const itemClasses = computed(() => ({
  'ui-list-item--clickable': props.clickable,
  'ui-list-item--align-start': props.align === 'start'
}));

const handleClick = (event: MouseEvent) => {
  if (!props.clickable) {
    return;
  }
  emit('click', event);
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (!props.clickable) {
    return;
  }
  emit('click', event);
};
</script>

<style scoped>
.ui-list-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-3) 0;
  color: var(--sakai-text-color);
}

.ui-list-item--align-start {
  align-items: flex-start;
}

.ui-list-item--clickable {
  cursor: pointer;
  transition: background-color var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.ui-list-item--clickable:hover {
  background: color-mix(in srgb, var(--sakai-primary) 8%, transparent);
}

.ui-list-item__leading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
}

.ui-list-item__content {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
}

.ui-list-item__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--sakai-space-3);
}

.ui-list-item__title {
  font-weight: var(--sakai-font-weight-medium);
  color: var(--sakai-text-color);
  line-height: 1.4;
}

.ui-list-item__subtitle {
  color: var(--sakai-text-color-tertiary);
  font-size: 0.9rem;
}

.ui-list-item__description {
  color: var(--sakai-text-color-secondary);
  font-size: 0.9rem;
}

.ui-list-item__meta {
  color: var(--sakai-text-color-tertiary);
  font-size: 0.85rem;
}

.ui-list-item__actions {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-2);
}

@media (max-width: 640px) {
  .ui-list-item {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .ui-list-item__leading,
  .ui-list-item__actions {
    justify-content: flex-start;
  }

  .ui-list-item__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
