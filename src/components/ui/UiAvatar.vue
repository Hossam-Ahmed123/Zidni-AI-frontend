<template>
  <span
    class="ui-avatar"
    :class="[
      `ui-avatar--${sizeClass}`,
      `ui-avatar--${props.shape}`,
      { 'ui-avatar--bordered': props.bordered, [`ui-avatar--status-${props.status}`]: !!props.status }
    ]"
    :style="customStyle"
  >
    <img
      v-if="props.src && !hasError"
      :src="props.src"
      :alt="props.alt || props.name || 'avatar'"
      class="ui-avatar__image"
      @error="handleError"
    />
    <UiIcon v-else-if="props.icon" :name="props.icon" :size="iconSize" />
    <span v-else class="ui-avatar__initials">{{ initials }}</span>
    <span v-if="props.status" class="ui-avatar__status" aria-hidden="true"></span>
    <slot name="badge" />
  </span>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import UiIcon from '@/components/ui/UiIcon.vue';

type UiAvatarSize = 'sm' | 'md' | 'lg';
type UiAvatarShape = 'circle' | 'rounded';
type UiAvatarStatus = 'online' | 'offline' | 'busy' | 'away';

const props = withDefaults(
  defineProps<{
    src?: string;
    alt?: string;
    name?: string;
    icon?: string;
    size?: UiAvatarSize | number;
    shape?: UiAvatarShape;
    bordered?: boolean;
    status?: UiAvatarStatus;
  }>(),
  {
    src: undefined,
    alt: undefined,
    name: '',
    icon: 'UserOutlined',
    size: 'md',
    shape: 'circle',
    bordered: false,
    status: undefined
  }
);

const hasError = ref(false);

const initials = computed(() => {
  if (!props.name) return '?';
  const parts = props.name.split(' ').filter(Boolean);
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return `${first}${last}`.toUpperCase();
});

const sizeClass = computed(() => {
  if (typeof props.size === 'number') {
    return 'custom';
  }
  return props.size;
});

const customStyle = computed(() => {
  if (typeof props.size !== 'number') {
    return undefined;
  }
  return {
    width: `${props.size}px`,
    height: `${props.size}px`,
    fontSize: `${Math.max(props.size / 2.6, 12)}px`
  };
});

const iconSize = computed(() => {
  if (typeof props.size === 'number') {
    return Math.max(props.size / 2, 18);
  }
  switch (props.size) {
    case 'sm':
      return 16;
    case 'lg':
      return 28;
    default:
      return 22;
  }
});

const handleError = () => {
  hasError.value = true;
};
</script>

<style scoped>
.ui-avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: color-mix(in srgb, var(--sakai-primary) 12%, transparent);
  color: var(--sakai-primary-700);
  font-weight: var(--sakai-font-weight-semibold);
  text-transform: uppercase;
  overflow: hidden;
}

.ui-avatar--sm {
  width: 32px;
  height: 32px;
  font-size: 0.8rem;
}

.ui-avatar--md {
  width: 44px;
  height: 44px;
  font-size: 1rem;
}

.ui-avatar--lg {
  width: 64px;
  height: 64px;
  font-size: 1.35rem;
}

.ui-avatar--rounded {
  border-radius: var(--sakai-border-radius-lg);
}

.ui-avatar--bordered {
  box-shadow: 0 0 0 2px var(--sakai-surface), 0 0 0 4px color-mix(in srgb, var(--sakai-primary) 45%, transparent);
}

.ui-avatar__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ui-avatar__initials {
  letter-spacing: 0.02em;
}

.ui-avatar__status {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--sakai-success);
  border: 2px solid var(--sakai-surface);
}

.ui-avatar--status-offline .ui-avatar__status {
  background: var(--sakai-border-color);
}

.ui-avatar--status-busy .ui-avatar__status {
  background: var(--sakai-danger);
}

.ui-avatar--status-away .ui-avatar__status {
  background: var(--sakai-warning);
}
</style>
