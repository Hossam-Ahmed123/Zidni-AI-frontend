<template>
  <v-layout class="bg-background rounded rounded-md h-screen overflow-hidden">
    <!-- Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail && !mobile"
      permanent
      @click="rail = false"
      class="border-e app-shell-drawer"
      width="280"
      color="surface"
      elevation="0"
    >
      <div class="d-flex flex-column h-100">
        <!-- Logo Area -->
        <div class="px-4 py-4 d-flex align-center gap-3 border-b">
           <v-avatar color="primary" variant="tonal" rounded size="40" class="font-weight-bold text-h6">
              {{ brandInitials }}
           </v-avatar>
           <div v-if="!rail || mobile" class="d-flex flex-column overflow-hidden transition-swing">
              <span class="text-subtitle-1 font-weight-bold text-truncate">{{ brandName }}</span>
              <span v-if="brandTagline" class="text-caption text-medium-emphasis text-truncate">{{ brandTagline }}</span>
           </div>
           <v-spacer v-if="!rail && !mobile"></v-spacer>
            <v-btn
              v-if="!mobile && !rail"
              icon="pi pi-chevron-left"
              variant="text"
              density="comfortable"
              size="small"
              @click.stop="rail = true"
            ></v-btn>
        </div>

        <!-- Navigation Items -->
        <v-list class="flex-grow-1 px-3 py-4" nav density="comfortable">
             <template v-for="(item, i) in navItems" :key="i">
                <v-list-item
                  v-if="item.to"
                  :to="item.to"
                  :prepend-icon="getIcon(item.icon)"
                  :title="!rail ? item.label : undefined"
                  rounded="lg"
                  class="mb-1"
                  color="primary"
                  :value="item.to"
                >
                   <template v-if="rail" #default></template> <!-- Hide text in rail mode explicitly if needed, but rail prop handles it -->
                   <template v-if="item.badge" #append>
                      <v-badge v-if="!rail" :content="item.badge" color="error" inline></v-badge>
                   </template> 
                </v-list-item>
                <v-list-item
                   v-else-if="item.href"
                   :href="item.href"
                   :target="item.external ? '_blank' : undefined"
                   :prepend-icon="getIcon(item.icon)"
                   :title="!rail ? item.label : undefined"
                   rounded="lg"
                   class="mb-1"
                ></v-list-item>
             </template>
        </v-list>

        <!-- User Profile -->
        <div class="px-3 py-2 border-t mt-auto">
            <v-menu v-model="userMenuOpen" :close-on-content-click="false" location="top start" origin="bottom start">
                <template #activator="{ props }">
                    <v-list-item
                        v-bind="props"
                        rounded="lg"
                        nav
                        lines="one"
                        class="px-2"
                    >
                        <template #prepend>
                            <v-avatar color="secondary" variant="tonal" size="36">
                                {{ brandInitials }}
                            </v-avatar>
                        </template>
                        <v-list-item-title class="font-weight-medium">{{ headerUserName }}</v-list-item-title>
                        <v-list-item-subtitle class="text-caption">{{ t('nav.student') }}</v-list-item-subtitle>
                        <template #append>
                           <v-icon icon="pi pi-ellipsis-v" size="small" color="medium-emphasis"></v-icon>
                        </template>
                    </v-list-item>
                </template>
                <v-card min-width="200" rounded="lg" elevation="2">
                    <v-list density="compact" nav>
                         <v-list-item prepend-icon="pi pi-sign-out" :title="t('nav.logout')" @click="handleLogout"></v-list-item>
                    </v-list>
                </v-card>
            </v-menu>
        </div>
      </div>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar flat border-b color="background" height="64" class="px-4">
        <v-app-bar-nav-icon v-if="mobile" @click="drawer = !drawer"></v-app-bar-nav-icon>
        
        <!-- Breadcrumbs (Simplified) -->
        <div class="d-none d-md-flex align-center ml-2">
            <span class="text-h6 font-weight-bold">{{ pageTitle }}</span>
        </div>

        <v-spacer></v-spacer>

        <!-- Search -->
        <div class="d-none d-sm-flex align-center mx-4" style="max-width: 300px; width: 100%">
             <v-text-field
                v-model="searchQuery"
                :placeholder="t('nav.searchPlaceholder')"
                prepend-inner-icon="pi pi-search"
                variant="outlined"
                density="compact"
                hide-details
                rounded="lg"
                bg-color="surface"
                class="w-100"
             ></v-text-field>
        </div>

        <!-- Actions -->
        <div class="d-flex align-center gap-2">
            <StudentTenantSwitcher v-if="showStudentTenantSwitcher" />
            <v-btn icon min-width="40" height="40" rounded="lg" variant="text" @click="toggleLanguage">
                <UiIcon name="GlobalOutlined" :size="20" />
            </v-btn>
            <v-btn icon min-width="40" height="40" rounded="lg" variant="text" @click="themeStore.toggleTheme()">
                 <v-icon :icon="themeStore.isDark ? 'pi pi-sun' : 'pi pi-moon'"></v-icon>
            </v-btn>
             <v-btn 
                v-if="notificationsUnifiedEnabled"
                icon 
                min-width="40" 
                height="40" 
                rounded="lg" 
                variant="text" 
                to="/student/notifications"
             >
                <v-badge v-if="showNotificationsBadge" :content="notificationsBadgeLabel" color="error" dot>
                    <v-icon icon="pi pi-bell"></v-icon>
                </v-badge>
                <v-icon v-else icon="pi pi-bell"></v-icon>
             </v-btn>
        </div>
    </v-app-bar>

    <v-main class="bg-background">
      <v-container fluid class="pa-6 h-100">
         <slot />
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useTenantStore } from '@/stores/tenant';
import { useThemeStore } from '@/stores/theme';
import { useFeaturesStore } from '@/stores/features';
import { useStudentStore } from '@/stores/student';
import { useNotificationStore } from '@/stores/notifications';
import { useI18n } from 'vue-i18n';
import { useDisplay } from 'vuetify';
import { useRouter, useRoute } from 'vue-router';
import { buildStudentNavItems } from '@/layout/theme/buildStudentNavItems';
import StudentTenantSwitcher from '@/components/student/StudentTenantSwitcher.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import { FEATURE } from '@/constants/featureCatalog';
import { loadLocaleMessages, LOCALE_STORAGE_KEY } from '@/plugins/i18n';
import { iconMap } from '@/constants/iconMap';

const { t, locale } = useI18n();
const auth = useAuthStore();
const tenantStore = useTenantStore();
const themeStore = useThemeStore();
const featuresStore = useFeaturesStore();
const studentStore = useStudentStore();
const notifications = useNotificationStore();
const { mobile } = useDisplay();
const router = useRouter();
const route = useRoute();

const drawer = ref(!mobile.value);
const rail = ref(false);
const searchQuery = ref('');
const userMenuOpen = ref(false);
const hasStoredLocale = ref(false);

const brandName = computed(() => tenantStore.branding?.name || 'Zidni AI');
const brandTagline = computed(() => tenantStore.branding?.branding?.tagline);
const brandInitials = computed(() => {
  const source = brandName.value;
  const letters = source.split(/\s+/).filter(Boolean).map(w => w[0]?.toUpperCase() || '');
  return letters.slice(0, 2).join('') || 'ZA';
});

const headerUserName = computed(() => studentStore.profile?.name?.trim() || brandName.value);

const notificationsUnifiedEnabled = computed(() => featuresStore.hasFeature(FEATURE.notificationsUnified));
const notificationsCount = computed(() => notifications.unreadCount);
const showNotificationsBadge = computed(() => notificationsCount.value > 0);
const notificationsBadgeLabel = computed(() => notificationsCount.value > 99 ? '99+' : String(notificationsCount.value));

const multiTeacherStudentEnabled = computed(() => featuresStore.hasFeature(FEATURE.multiTeacherStudent));
const showStudentTenantSwitcher = computed(() => multiTeacherStudentEnabled.value && auth.isStudent);

const navContext = computed(() => ({
  t,
  isStudent: auth.isStudent,
  isTeacher: auth.isTeacher,
  studentReportsEnabled: featuresStore.hasFeature(FEATURE.reportsStudent),
  badgesEnabled: featuresStore.hasFeature(FEATURE.badges),
  notificationsUnifiedEnabled: notificationsUnifiedEnabled.value,
  notificationsBadgeLabel: notificationsBadgeLabel.value,
  englishLabEnabled: featuresStore.hasFeature(FEATURE.englishLab),
  offersEnabled: featuresStore.hasFeature(FEATURE.offers)
}));

const navItems = computed(() => buildStudentNavItems(navContext.value));

const pageTitle = computed(() => {
   // Simplified title logic or use route meta
   return route.meta.title ? t(route.meta.title as string) : brandName.value;
});

const getIcon = (iconName: string) => {
  if (iconName in iconMap) return iconMap[iconName];
  if (iconName.startsWith('pi ')) return iconName;
  if (iconName.startsWith('pi-')) return `pi ${iconName}`;
  const lower = iconName.toLowerCase();
  const match = Object.keys(iconMap).find((key) => key.toLowerCase() === lower);
  return match ? iconMap[match] : 'pi pi-circle';
};

const handleLogout = async () => {
    await auth.logout();
    router.replace({ name: 'login-student' }); // Or login-teacher, generic login
};

const resolveDefaultLocale = (value?: string | null) => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized.startsWith('ar')) return 'ar';
  if (normalized.startsWith('en')) return 'en';
  return null;
};

const applyDefaultLocale = async (value?: string | null) => {
  if (hasStoredLocale.value) return;
  const resolved = resolveDefaultLocale(value);
  if (!resolved || locale.value === resolved) return;
  await loadLocaleMessages(resolved);
  locale.value = resolved;
};

const toggleLanguage = async () => {
  const nextLocale = locale.value === 'ar' ? 'en' : 'ar';
  await loadLocaleMessages(nextLocale);
  locale.value = nextLocale;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
  }
  hasStoredLocale.value = true;
};

onMounted(() => {
    if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
        hasStoredLocale.value = stored === 'ar' || stored === 'en';
    }
    if (auth.isStudent && !studentStore.profile) {
        studentStore.fetchProfile().catch(err => console.warn('Failed to load student profile', err));
    }
});

watch(
  () => tenantStore.branding?.branding?.defaultLocale as string | undefined,
  (value) => {
    void applyDefaultLocale(value ?? null);
  },
  { immediate: true }
);
</script>

<style scoped>
.app-shell-drawer {
    transition: width 0.2s;
}
.border-b {
    border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.border-t {
    border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.gap-3 { gap: 12px; }
.gap-2 { gap: 8px; }
</style>
