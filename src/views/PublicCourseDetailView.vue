<template>
  <ThemePage>
    <div
      class="public-course"
      :class="{ 'public-course--rtl': isRtl, 'public-course--sticky': stickyCtaVisible }"
      :style="themeStyle"
    >
      <section
        v-if="course && teacher"
        class="public-course__hero"
        :class="{ 'public-course__hero--image': Boolean(courseHeroImage) }"
        :style="heroStyle"
        ref="heroSection"
      >
        <div class="public-course__hero-inner">
          <UiButton
            variant="link"
            color="secondary"
            class="public-course__back"
            prepend-icon="ArrowLeftOutlined"
            @click="goBack"
          >
            {{ t('publicCourse.back') }}
          </UiButton>
          <div v-if="heroBanner" class="public-course__hero-banner">
            <span class="public-course__hero-banner-icon">
              <UiIcon :name="heroBanner.icon" :size="18" />
            </span>
            <div class="public-course__hero-banner-body">
              <p class="public-course__hero-banner-title">{{ heroBanner.title }}</p>
              <p class="public-course__hero-banner-meta">{{ heroBanner.meta }}</p>
            </div>
            <UiButton
              v-if="heroBanner.action"
              variant="link"
              color="secondary"
              size="sm"
              class="public-course__hero-banner-cta"
              @click="heroBanner.action?.()"
            >
              {{ heroBanner.actionLabel }}
            </UiButton>
          </div>
          <div class="public-course__hero-body">
            <div class="public-course__hero-main">
              <div class="public-course__chips">
                <UiTag v-if="course.type" color="secondary" variant="solid" pill size="sm">
                  {{ course.type }}
                </UiTag>
                <UiTag v-if="course.level" color="primary" variant="soft" pill size="sm">
                  {{ course.level }}
                </UiTag>
                <UiTag v-if="course.language" color="primary" variant="outline" pill size="sm">
                  {{ course.language.toUpperCase() }}
                </UiTag>
                <UiTag color="secondary" variant="soft" pill size="sm">
                  {{ priceLabel }}
                </UiTag>
              </div>
              <h1 class="public-course__title">{{ course.title }}</h1>
              <p class="public-course__summary">
                {{ course.description || t('publicCourse.noDescription') }}
              </p>
              <div class="public-course__hero-footer">
                <div class="public-course__cta">
                  <UiButton
                    v-if="course"
                    color="primary"
                    size="lg"
                    :loading="enrollmentLoading"
                    @click="handleEnrollmentCta"
                  >
                    {{ enrollmentCtaLabel }}
                  </UiButton>
                  <UiButton
                    v-if="course.cta?.liveRoute"
                    variant="tonal"
                    color="primary"
                    size="lg"
                    @click="navigateTo(course.cta.liveRoute)"
                  >
                    {{ t('publicCourse.cta.live') }}
                  </UiButton>
                  <UiButton
                    v-if="course.cta?.tutoringRoute"
                    variant="soft"
                    color="secondary"
                    size="lg"
                    @click="navigateTo(course.cta.tutoringRoute)"
                  >
                    {{ t('publicCourse.cta.tutoring') }}
                  </UiButton>
                  <UiButton
                    v-if="course && teacher"
                    variant="outline"
                    color="secondary"
                    size="lg"
                    prepend-icon="ShoppingCartOutlined"
                    @click="handleSubscriptionCta"
                  >
                    {{ t('publicCourse.cta.subscribe') }}
                  </UiButton>
                  <UiButton
                    v-if="course"
                    variant="link"
                    color="secondary"
                    size="md"
                    class="public-course__share"
                    prepend-icon="ShareAltOutlined"
                    :disabled="sharing"
                    @click="handleShare"
                  >
                    {{ t('publicCourse.share') }}
                  </UiButton>
                </div>
                <div class="public-course__stats">
                  <div v-for="item in statsItems" :key="item.key" class="public-course__stat">
                    <span class="public-course__stat-icon">
                      <UiIcon :name="item.icon" :size="22" />
                    </span>
                    <div class="public-course__stat-body">
                      <span class="public-course__stat-value">{{ item.value }}</span>
                      <span class="public-course__stat-label">{{ item.label }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <aside class="public-course__teacher">
              <p class="public-course__teacher-header">{{ t('publicCourse.teacherHeader') }}</p>
              <TeacherLandingHeader
                :teacher="teacherHeader || teacher"
                :landing-href="teacherLandingHref"
                :register-href="teacherRegisterHref"
                :aria-label="t('teacherLanding.navigation.label')"
              />
              <div v-if="course.reviews?.count" class="public-course__reviews public-course__reviews--hero">
                <UiIcon name="StarFilled" color="warning" />
                <span>
                  {{ course.reviews.rating?.toFixed(1) ?? '0.0' }} ·
                  {{ t('publicCourse.reviewsCount', { count: course.reviews.count }) }}
                </span>
              </div>
            </aside>
          </div>
        </div>
      </section>
      <div class="public-course__content">
        <div v-if="loading && !course" class="public-course__loading">
          <div class="public-course__loading-hero">
            <UiSkeleton height="2.75rem" />
            <UiSkeleton height="1.25rem" />
            <UiSkeleton width="11rem" height="2.5rem" shape="pill" />
          </div>
          <div class="public-course__loading-section">
            <UiSkeleton height="1.5rem" />
            <UiSkeleton height="10rem" />
          </div>
        </div>
        <UiAlert v-else-if="notFound" color="warning" variant="soft" class="public-course__alert">
          <div class="public-course__alert-content">
            <div class="public-course__alert-text">
              <p class="public-course__alert-title">{{ t('publicCourse.notFound.title') }}</p>
              <p class="public-course__alert-description">{{ t('publicCourse.notFound.description') }}</p>
            </div>
            <UiButton size="md" color="primary" variant="soft" @click="goBack">
              {{ t('publicCourse.back') }}
            </UiButton>
          </div>
        </UiAlert>
        <UiAlert v-else-if="error" color="danger" variant="soft" class="public-course__alert">
          {{ t('publicCourse.loadError') }}
        </UiAlert>
        <template v-else-if="course && teacher">
          <section v-if="highlightItems.length" class="public-course__section public-course__section--accent">
            <h2 class="public-course__section-title">{{ t('publicCourse.glanceTitle') }}</h2>
            <div class="public-course__highlights">
              <article v-for="item in highlightItems" :key="item.key" class="public-course__highlight">
                <span class="public-course__highlight-icon">
                  <UiIcon :name="item.icon" :size="24" />
                </span>
                <div class="public-course__highlight-body">
                  <p class="public-course__highlight-label">{{ item.label }}</p>
                  <p class="public-course__highlight-value">{{ item.value }}</p>
                  <p v-if="item.description" class="public-course__highlight-description">{{ item.description }}</p>
                </div>
              </article>
            </div>
          </section>
          <section class="public-course__section">
            <h2 class="public-course__section-title">{{ t('publicCourse.aboutTitle') }}</h2>
            <p class="public-course__section-text">
              {{ course.description || t('publicCourse.noDescription') }}
            </p>
          </section>
          <section ref="curriculumSection" class="public-course__section">
            <h2 class="public-course__section-title">{{ t('publicCourse.curriculumTitle') }}</h2>
            <UiAccordion
              v-if="curriculumItems.length"
              class="public-course__curriculum"
              :items="curriculumItems"
              multiple
              :collapsible="true"
            >
              <template #content="{ item }">
                <p class="public-course__module-description">{{ item.content }}</p>
              </template>
            </UiAccordion>
            <p v-else class="public-course__empty">{{ t('publicCourse.curriculumEmpty') }}</p>
          </section>
          <section class="public-course__section">
            <h2 class="public-course__section-title">{{ t('publicCourse.nextLivesTitle') }}</h2>
            <ul
              v-if="course.nextLiveSessions?.length"
              class="public-course__list public-course__list--timeline"
            >
              <li
                v-for="session in course.nextLiveSessions"
                :key="session.id"
                class="public-course__list-item"
              >
                <UiIcon name="CalendarOutlined" />
                <div class="public-course__list-content">
                  <p class="public-course__list-title">{{ session.title }}</p>
                  <p class="public-course__list-meta">
                    {{ formatDateTime(session.scheduledAt) }} ·
                    {{ formatDuration(session.durationMinutes) }}
                  </p>
                </div>
                <UiButton
                  class="public-course__list-action"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  prepend-icon="CalendarOutlined"
                  :loading="calendarDownloadId === session.id"
                  :aria-label="t('publicCourse.liveAddToCalendar')"
                  @click="downloadLiveSessionCalendar(session)"
                >
                  {{ t('publicCourse.liveAddToCalendar') }}
                </UiButton>
              </li>
            </ul>
            <p v-else class="public-course__empty">{{ t('publicCourse.nextLivesEmpty') }}</p>
          </section>
          <section class="public-course__section">
            <h2 class="public-course__section-title">{{ t('publicCourse.offersTitle') }}</h2>
            <ul v-if="course.offers?.length" class="public-course__offers">
              <li v-for="offer in course.offers" :key="offer.code" class="public-course__offer">
                <UiTag color="secondary" variant="solid" pill size="sm">{{ offer.code }}</UiTag>
                <div class="public-course__offer-body">
                  <p class="public-course__offer-value">{{ formatOfferValue(offer) }}</p>
                  <p v-if="offer.validUntil" class="public-course__offer-meta">
                    {{ t('publicCourse.offerValidUntil', { date: formatDate(offer.validUntil) }) }}
                  </p>
                </div>
              </li>
            </ul>
            <p v-else class="public-course__empty">{{ t('publicCourse.offersEmpty') }}</p>
          </section>
          <section class="public-course__section">
            <h2 class="public-course__section-title">{{ t('publicCourse.samplesTitle') }}</h2>
            <div v-if="course.sampleLessons?.length" class="public-course__samples">
              <article v-for="sample in course.sampleLessons" :key="sample.lessonId" class="public-course__sample">
                <div class="public-course__sample-video" v-if="sample.ytId">
                  <iframe
                    :src="youtubeEmbed(sample.ytId)"
                    :title="sample.title"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    loading="lazy"
                    allowfullscreen
                    referrerpolicy="strict-origin-when-cross-origin"
                  ></iframe>
                </div>
                <h3 class="public-course__sample-title">{{ sample.title }}</h3>
                <p v-if="sample.durationMinutes" class="public-course__sample-meta">
                  {{ formatDuration(sample.durationMinutes) }}
                </p>
              </article>
            </div>
            <p v-else class="public-course__empty">{{ t('publicCourse.samplesEmpty') }}</p>
          </section>
          <section class="public-course__section">
            <h2 class="public-course__section-title">{{ t('publicCourse.reviewsTitle') }}</h2>
            <div v-if="course.reviews?.count" class="public-course__reviews-summary">
              <UiIcon name="StarFilled" color="warning" />
              <span>
                {{ course.reviews.rating?.toFixed(1) ?? '0.0' }} ·
                {{ t('publicCourse.reviewsCount', { count: course.reviews.count }) }}
              </span>
            </div>
            <p v-else class="public-course__empty">{{ t('publicCourse.reviewsEmpty') }}</p>
            <CourseReviewsList
              v-if="reviewsFeatureEnabled && course"
              class="public-course__reviews-list"
              :course-id="course.id"
              :tenant-slug="slug"
              :preview="isPreview"
              :show-summary="false"
            />
          </section>
          <section class="public-course__section">
            <h2 class="public-course__section-title">{{ t('publicCourse.teacherTitle') }}</h2>
            <div class="public-course__teacher-card">
              <UiAvatar :src="teacherAvatarSrc" :name="teacher.name" size="lg" />
              <div>
                <p class="public-course__teacher-name">{{ teacher.name }}</p>
                <p v-if="teacher.subject" class="public-course__teacher-subject">{{ teacher.subject }}</p>
                <p v-if="teacher.tagline" class="public-course__teacher-tagline">{{ teacher.tagline }}</p>
              </div>
            </div>
          </section>
        </template>
      </div>
      <Transition name="public-course__sticky-transition">
        <div v-if="course && teacher && stickyCtaVisible" class="public-course__sticky-cta">
          <div class="public-course__sticky-info">
            <p class="public-course__sticky-title">{{ course.title }}</p>
            <p class="public-course__sticky-price">{{ priceLabel }}</p>
          </div>
          <div class="public-course__sticky-actions">
            <UiButton
              variant="outline"
              color="secondary"
              class="public-course__sticky-share"
              prepend-icon="ShareAltOutlined"
              :aria-label="t('publicCourse.share')"
              :disabled="sharing"
              @click="handleShare"
            />
            <UiButton
              color="primary"
              size="md"
              :loading="enrollmentLoading"
              @click="handleEnrollmentCta"
            >
              {{ enrollmentCtaLabel }}
            </UiButton>
          </div>
        </div>
      </Transition>
    </div>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiAvatar from '@/components/ui/UiAvatar.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiAccordion, { type UiAccordionItem } from '@/components/ui/UiAccordion.vue';
import TeacherLandingHeader from '@/components/teacherLanding/TeacherLandingHeader.vue';
import CourseReviewsList from '@/views/shared/reviews/CourseReviewsList.vue';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { useTenantStore } from '@/stores/tenant';
import { useFeaturesStore } from '@/stores/features';
import { FEATURE } from '@/constants/featureCatalog';
import { useStudentCheckoutStore } from '@/stores/studentCheckout';
import { getStudentCourses } from '@/services/student';
import { withPlaceholder } from '@/utils/placeholders';
import { withCacheBusting } from '@/utils/cacheBusting';
import { isPreviewEnabled } from '@/utils/preview';
import { getStoredTenantSlug } from '@/utils/tenantStorage';
import { useToast } from '@/composables/useToast';

interface PublicCoursePreviewResponse {
  course: {
    id: number;
    title: string;
    type: string;
    price: number;
    currency?: string;
    level?: string;
    language?: string;
    thumbnailUrl?: string;
    description?: string;
    stats: { modules: number; lessons: number; durationMinutes: number };
    reviews: { rating: number | null; count: number };
    offers: Array<{ code: string; type: string; value: number; validUntil?: string | null }>;
    nextLiveSessions: Array<{ id: number; title: string; scheduledAt: string; durationMinutes?: number | null }>;
    sampleLessons: Array<{ lessonId: number; title: string; durationMinutes?: number | null; ytId?: string | null }>;
    modules: Array<{ id: number; title: string; lessons: number }>;
    cta: { enrollRoute?: string; liveRoute?: string; tutoringRoute?: string };
  };
  teacher: {
    id: number;
    slug: string;
    name: string;
    subject?: string;
    tagline?: string | null;
    photoUrl?: string;
    branding?: Record<string, unknown> | null;
    landingUpdatedAt?: string | null;
  };
  seo: { title: string; description?: string | null };
}

interface HeroBannerConfig {
  icon: string;
  title: string;
  meta: string;
  action?: (() => void) | null;
  actionLabel?: string;
}

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const tenantStore = useTenantStore();
const featuresStore = useFeaturesStore();
const checkoutStore = useStudentCheckoutStore();
const auth = useAuthStore();
const toast = useToast();

const response = ref<PublicCoursePreviewResponse | null>(null);
const loading = ref(false);
const error = ref(false);
const enrollmentLoading = ref(false);
const hasEnrollmentData = ref(false);
const courseEnrolled = ref(false);
const sharing = ref(false);
const calendarDownloadId = ref<number | null>(null);
const curriculumSection = ref<HTMLElement | null>(null);
const heroSection = ref<HTMLElement | null>(null);
const notFound = ref(false);

const stickyCtaVisible = ref(false);
const heroInView = ref(true);
const isStickyBreakpoint = ref(false);

let heroObserver: IntersectionObserver | null = null;
let stickyMediaQuery: MediaQueryList | null = null;
let removeMediaListener: (() => void) | null = null;
let mediaQueryChangeListener: ((event: MediaQueryListEvent) => void) | null = null;

function handleStickyBreakpointChange(event: MediaQueryListEvent | MediaQueryList) {
  isStickyBreakpoint.value = event.matches;
  updateStickyVisibility();
}

function updateStickyVisibility() {
  stickyCtaVisible.value = isStickyBreakpoint.value || !heroInView.value;
}

function attachHeroObserver(element: HTMLElement | null) {
  heroObserver?.disconnect();

  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
    return;
  }

  if (!element) {
    heroInView.value = true;
    updateStickyVisibility();
    return;
  }

  heroObserver = new IntersectionObserver(
    (entries) => {
      if (!entries.length) {
        return;
      }
      heroInView.value = entries[0].isIntersecting;
      updateStickyVisibility();
    },
    { threshold: 0.2 }
  );

  heroObserver.observe(element);
}

function bindStickyMediaQuery() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return;
  }

  removeMediaListener?.();
  mediaQueryChangeListener = null;

  stickyMediaQuery = window.matchMedia('(max-width: 768px)');
  handleStickyBreakpointChange(stickyMediaQuery);

  mediaQueryChangeListener = (event: MediaQueryListEvent) => handleStickyBreakpointChange(event);

  if (typeof stickyMediaQuery.addEventListener === 'function') {
    stickyMediaQuery.addEventListener('change', mediaQueryChangeListener);
    removeMediaListener = () => {
      if (stickyMediaQuery && mediaQueryChangeListener) {
        stickyMediaQuery.removeEventListener('change', mediaQueryChangeListener);
      }
      removeMediaListener = null;
    };
  } else if (typeof stickyMediaQuery.addListener === 'function') {
    stickyMediaQuery.addListener(mediaQueryChangeListener);
    removeMediaListener = () => {
      if (stickyMediaQuery && mediaQueryChangeListener) {
        stickyMediaQuery.removeListener(mediaQueryChangeListener);
      }
      removeMediaListener = null;
    };
  }
}

const slug = computed(
  () => (route.params.slug as string) || tenantStore.branding?.slug || getStoredTenantSlug().raw || 'demo'
);
const isPreview = computed(() => isPreviewEnabled(route.query.preview));
const courseId = computed(() => Number(route.params.courseId));

const course = computed<PublicCoursePreviewResponse['course'] | null>(
  () => response.value?.course ?? null
);
const courseCurrency = computed(() => (course.value?.currency || 'EGP').toUpperCase());
const teacher = computed<PublicCoursePreviewResponse['teacher'] | null>(
  () => response.value?.teacher ?? null
);
const teacherHeader = computed(() => {
  const value = teacher.value;
  if (!value) {
    return null;
  }
  return {
    ...value,
    avatarUrl: value.photoUrl,
    updatedAt: value.landingUpdatedAt ?? null
  };
});
const teacherAvatarSrc = computed(() => {
  const base = teacher.value?.photoUrl?.trim() || '';
  if (!base) {
    return '';
  }
  return withCacheBusting(base, teacher.value?.landingUpdatedAt ?? null);
});
const teacherLandingHref = computed(() => {
  const teacherValue = teacher.value;
  if (!teacherValue?.slug) {
    return '';
  }
  return router.resolve({ name: 'public-teacher-landing', params: { teacherSlug: teacherValue.slug } }).href;
});
const teacherRegisterHref = computed(() =>
  router.resolve({
    name: 'student-register',
    query: { tenant: slug.value }
  }).href
);
const nextLiveSession = computed<NextLiveSession | null>(() => course.value?.nextLiveSessions?.[0] ?? null);
const isRtl = computed(() => locale.value === 'ar');
const reviewsFeatureEnabled = computed(() => featuresStore.hasFeature(FEATURE.reviews));
const enrollmentCtaLabel = computed(() => {
  if (auth.isStudent && hasEnrollmentData.value && courseEnrolled.value) {
    return t('publicCourse.cta.continue');
  }
  return t('publicCourse.cta.enroll');
});

const themeStyle = computed(() => {
  const branding = (teacher.value?.branding as Record<string, any> | undefined) || {};
  const colors = (branding.colors as Record<string, string> | undefined) || {};
  return {
    '--public-primary': colors.primary || 'var(--sakai-primary-600)',
    '--public-secondary': colors.secondary || 'var(--sakai-secondary-500)'
  } as Record<string, string>;
});

const courseHeroImage = computed(() => withPlaceholder(course.value?.thumbnailUrl ?? null, 'course'));

const heroStyle = computed(() => ({
  '--public-course-hero-gradient': `linear-gradient(135deg, ${themeStyle.value['--public-primary']}, ${themeStyle.value['--public-secondary']})`,
  '--public-course-hero-image': `url(${courseHeroImage.value})`
}));

const heroBanner = computed<HeroBannerConfig | null>(() => {
  const courseValue = course.value;
  if (!courseValue) {
    return null;
  }

  const nextLive = nextLiveSession.value;
  if (nextLive) {
    const parts: string[] = [formatDateTime(nextLive.scheduledAt)];
    const relative = formatRelativeTimeToNow(nextLive.scheduledAt);
    if (relative) {
      parts.push(t('publicCourse.heroBanner.startsIn', { relative }));
    }

    return {
      icon: 'CalendarOutlined',
      title: t('publicCourse.heroBanner.nextLiveTitle'),
      meta: parts.join(' · '),
      action: courseValue.cta?.liveRoute ? () => navigateTo(courseValue.cta?.liveRoute) : null,
      actionLabel: courseValue.cta?.liveRoute ? t('publicCourse.heroBanner.nextLiveAction') : undefined
    };
  }

  const hasOnDemand = Boolean(courseValue.modules?.length || courseValue.sampleLessons?.length);
  return {
    icon: 'PlayCircleOutlined',
    title: t('publicCourse.heroBanner.noLiveTitle'),
    meta: t('publicCourse.heroBanner.noLiveDescription'),
    action: hasOnDemand ? () => scrollToCurriculum() : null,
    actionLabel: hasOnDemand ? t('publicCourse.heroBanner.noLiveAction') : undefined
  };
});

const managedMeta = new Map<string, { previous: string | null; created: boolean }>();
const managedLinks = new Map<string, { previous: string | null; created: boolean }>();

const originalTheme =
  typeof window !== 'undefined'
    ? {
        primary: getComputedStyle(document.documentElement).getPropertyValue('--ed-primary').trim(),
        secondary: getComputedStyle(document.documentElement).getPropertyValue('--ed-secondary').trim()
      }
    : { primary: '', secondary: '' };

const originalTitle = typeof document !== 'undefined' ? document.title : '';

const activeThemeOverrides: { primary?: string; secondary?: string } = {};

const priceLabel = computed(() => {
  const amount = course.value?.price ?? 0;
  const currency = courseCurrency.value;
  try {
    return new Intl.NumberFormat(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency
    }).format(amount);
  } catch (err) {
    return `${currency} ${amount}`;
  }
});

interface HighlightItem {
  key: string;
  icon: string;
  label: string;
  value: string;
  description?: string;
}

const statsItems = computed(() => {
  const stats = course.value?.stats;
  if (!stats) return [];
  return [
    {
      key: 'modules',
      label: t('publicCourse.stats.modules'),
      value: String(stats.modules),
      icon: 'BookOutlined'
    },
    {
      key: 'lessons',
      label: t('publicCourse.stats.lessons'),
      value: String(stats.lessons),
      icon: 'SolutionOutlined'
    },
    {
      key: 'duration',
      label: t('publicCourse.stats.duration'),
      value:
        stats.durationMinutes > 0
          ? `${stats.durationMinutes} ${t('publicCourse.minutesSuffix')}`
          : '—',
      icon: 'ClockCircleOutlined'
    }
  ];
});

const highlightItems = computed<HighlightItem[]>(() => {
  const items: HighlightItem[] = [];
  const stats = course.value?.stats;

  if (stats) {
    items.push({
      key: 'structure',
      icon: 'BookOutlined',
      label: t('publicCourse.highlight.structureLabel'),
      value: t('publicCourse.highlight.structureValue', {
        modules: stats.modules,
        lessons: stats.lessons
      }),
      description: t('publicCourse.highlight.structureDescription')
    });

    if (stats.durationMinutes > 0) {
      const durationLabel = formatDuration(stats.durationMinutes);
      items.push({
        key: 'duration',
        icon: 'ClockCircleOutlined',
        label: t('publicCourse.highlight.durationLabel'),
        value: durationLabel,
        description: t('publicCourse.highlight.durationDescription', { duration: durationLabel })
      });
    }
  }

  const nextLive = course.value?.nextLiveSessions?.[0];
  if (nextLive) {
    items.push({
      key: 'live',
      icon: 'CalendarOutlined',
      label: t('publicCourse.highlight.liveLabel'),
      value: formatDateTime(nextLive.scheduledAt),
      description: nextLive.durationMinutes
        ? t('publicCourse.highlight.liveDescriptionDuration', {
            duration: formatDuration(nextLive.durationMinutes)
          })
        : t('publicCourse.highlight.liveDescription')
    });
  }

  if (course.value?.reviews?.count) {
    items.push({
      key: 'reviews',
      icon: 'StarOutlined',
      label: t('publicCourse.highlight.reviewsLabel'),
      value: `${course.value.reviews.rating?.toFixed(1) ?? '0.0'} / 5`,
      description: t('publicCourse.highlight.reviewsDescription', {
        count: course.value.reviews.count
      })
    });
  }

  const activeOffer = course.value?.offers?.[0];
  if (activeOffer) {
    items.push({
      key: 'offers',
      icon: 'TagOutlined',
      label: t('publicCourse.highlight.offersLabel'),
      value: formatOfferValue(activeOffer),
      description: activeOffer.validUntil
        ? t('publicCourse.highlight.offersDescription', { date: formatDate(activeOffer.validUntil) })
        : t('publicCourse.highlight.offersOpen')
    });
  }

  if (course.value?.sampleLessons?.length) {
    items.push({
      key: 'samples',
      icon: 'PlayCircleOutlined',
      label: t('publicCourse.highlight.samplesLabel'),
      value: t('publicCourse.highlight.samplesValue', {
        count: course.value.sampleLessons.length
      }),
      description: t('publicCourse.highlight.samplesDescription')
    });
  }

  return items;
});

const curriculumItems = computed<UiAccordionItem[]>(() => {
  const modules = course.value?.modules ?? [];
  return modules.map((module, index) => ({
    value: module.id ?? index,
    title: module.title,
    subtitle: t('publicCourse.moduleLessons', { count: module.lessons }),
    content: t('publicCourse.moduleDescription', { count: module.lessons })
  }));
});

function youtubeEmbed(ytId: string | undefined | null) {
  if (!ytId) return '';
  return `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`;
}

function scrollToCurriculum() {
  if (typeof window === 'undefined') {
    return;
  }

  requestAnimationFrame(() => {
    curriculumSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function formatDuration(minutes?: number | null) {
  if (!minutes) {
    return t('publicCourse.durationFallback');
  }
  return `${minutes} ${t('publicCourse.minutesSuffix')}`;
}

function formatDateTime(value: string) {
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat(locale.value === 'ar' ? 'ar-EG' : 'en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  } catch (err) {
    return value;
  }
}

function formatRelativeTimeToNow(value: string) {
  try {
    const target = new Date(value);
    if (Number.isNaN(target.getTime())) {
      return '';
    }

    const diffMs = target.getTime() - Date.now();
    if (diffMs <= 0) {
      return '';
    }
    const minute = 60_000;
    const hour = 60 * minute;
    const day = 24 * hour;

    const rtf = new Intl.RelativeTimeFormat(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
      numeric: 'auto'
    });

    if (Math.abs(diffMs) >= day) {
      return rtf.format(Math.round(diffMs / day), 'day');
    }

    if (Math.abs(diffMs) >= hour) {
      return rtf.format(Math.round(diffMs / hour), 'hour');
    }

    return rtf.format(Math.round(diffMs / minute), 'minute');
  } catch (err) {
    return '';
  }
}

function formatIcsDate(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function sanitizeFilename(value: string) {
  const sanitized = value
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
    .replace(/\.$/, '');

  return sanitized || 'event';
}

function formatDate(value: string) {
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat(locale.value === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'medium' }).format(date);
  } catch (err) {
    return value;
  }
}

function formatOfferValue(offer: { type: string; value: number }) {
  if (offer.type === 'PERCENTAGE') {
    return t('publicCourse.offerPercentage', { value: offer.value });
  }
  if (offer.type === 'BUNDLE') {
    return t('publicCourse.offerBundle', { price: formatCurrency(offer.value) });
  }
  return t('publicCourse.offerFixed', { amount: formatCurrency(offer.value) });
}

function formatCurrency(amount: number) {
  const currency = courseCurrency.value;
  try {
    return new Intl.NumberFormat(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency
    }).format(amount);
  } catch (err) {
    return `${currency} ${amount}`;
  }
}

function navigateTo(target?: string) {
  if (!target) return;
  router.push(target);
}

async function refreshEnrollmentStatus() {
  if (!auth.isStudent || !course.value?.id) {
    hasEnrollmentData.value = false;
    courseEnrolled.value = false;
    return;
  }
  enrollmentLoading.value = true;
  hasEnrollmentData.value = false;
  try {
    const catalog = await getStudentCourses();
    const matched = catalog.find((item) => item.id === course.value?.id);
    courseEnrolled.value = Boolean(matched?.active);
    hasEnrollmentData.value = true;
  } catch (err) {
    console.warn('Failed to load enrollment status', err);
    courseEnrolled.value = false;
  } finally {
    enrollmentLoading.value = false;
  }
}

async function handleShare() {
  if (!course.value || typeof window === 'undefined' || sharing.value) {
    return;
  }

  const url = window.location.href;
  const title = course.value.title;
  const shareText = teacher.value?.name
    ? t('publicCourse.shareMessage', { course: course.value.title, teacher: teacher.value.name })
    : course.value.title;

  sharing.value = true;

  try {
    const shareNavigator = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
    };

    if (typeof shareNavigator.share === 'function') {
      await shareNavigator.share({ title, text: shareText, url });
      return;
    }

    await copyToClipboard(url);
    toast.success({ detail: t('publicCourse.shareCopied') });
    return;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return;
    }

    try {
      await copyToClipboard(url);
      toast.success({ detail: t('publicCourse.shareCopied') });
    } catch (copyError) {
      console.warn('Failed to share course', copyError);
      toast.error({ detail: t('publicCourse.shareError') });
    }
  } finally {
    sharing.value = false;
  }
}

type NextLiveSession = PublicCoursePreviewResponse['course']['nextLiveSessions'][number];

async function downloadLiveSessionCalendar(session: NextLiveSession) {
  if (!course.value || typeof document === 'undefined') {
    return;
  }

  if (!session?.scheduledAt) {
    toast.error({ detail: t('publicCourse.liveCalendarError') });
    return;
  }

  calendarDownloadId.value = session.id;

  try {
    const start = new Date(session.scheduledAt);
    if (Number.isNaN(start.getTime())) {
      throw new Error('Invalid date');
    }

    const durationMinutes = session.durationMinutes && session.durationMinutes > 0 ? session.durationMinutes : 60;
    const end = new Date(start.getTime() + durationMinutes * 60_000);

    const dtStamp = formatIcsDate(new Date());
    const dtStart = formatIcsDate(start);
    const dtEnd = formatIcsDate(end);

    const description = course.value.description ? escapeIcsText(course.value.description) : '';
    const summary = escapeIcsText(`${course.value.title} – ${session.title}`);
    const location = escapeIcsText(t('publicCourse.liveCalendarLocation'));

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Zidni AI//PublicCourse//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${session.id}@Zidni AI.app`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${summary}`,
      description ? `DESCRIPTION:${description}` : null,
      `LOCATION:${location}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean) as string[];

    const blob = new Blob([`${lines.join('\r\n')}\r\n`], {
      type: 'text/calendar;charset=utf-8'
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${sanitizeFilename(`${course.value.title} - ${session.title}`)}.ics`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    const href = link.href;
    link.remove();
    URL.revokeObjectURL(href);

    toast.success({ detail: t('publicCourse.liveCalendarDownloaded') });
  } catch (err) {
    console.warn('Failed to download calendar event', err);
    toast.error({ detail: t('publicCourse.liveCalendarError') });
  } finally {
    calendarDownloadId.value = null;
  }
}

function handleEnrollmentCta() {
  if (!course.value) {
    return;
  }
  if (auth.isStudent) {
    if (courseEnrolled.value) {
      router.push({ name: 'student-learning', query: { courseId: String(course.value.id) } });
      return;
    }
    startCheckout();
    return;
  }

  if (auth.isTeacher) {
    router.push({ name: 'teacher-courses' });
    return;
  }

  router.push({ name: 'login-student-fallback', query: { next: route.fullPath } });
}

function handleSubscriptionCta() {
  if (!course.value || !teacher.value) {
    return;
  }
  if (!auth.isStudent) {
    const tenantSlug = slug.value?.trim();
    if (tenantSlug) {
      router.push({
        name: 'login-student',
        params: { tenant: tenantSlug },
        query: { next: route.fullPath }
      });
    } else {
      router.push({
        name: 'login-student-fallback',
        query: { next: route.fullPath }
      });
    }
    return;
  }
  if (hasEnrollmentData.value && courseEnrolled.value) {
    router.push({ name: 'student-learning', query: { courseId: String(course.value.id) } });
    return;
  }
  startCheckout();
}

function startCheckout() {
  if (!course.value || !teacher.value) {
    return;
  }
  checkoutStore.setItems([
    {
      courseId: course.value.id,
      qty: 1,
      title: course.value.title,
      price: course.value.price,
      currency: course.value.currency ?? null
    }
  ]);
  router.push({ name: 'student-checkout', query: { slug: teacher.value.slug } });
}

function goBack() {
  if (router.hasRoute('public-course-list')) {
    router.push({
      name: 'public-course-list',
      params: { slug: slug.value },
      query: isPreview.value ? { preview: '1' } : undefined
    });
    return;
  }
  router.push({
    name: 'public-teacher-landing',
    params: { teacherSlug: slug.value },
    query: isPreview.value ? { preview: '1' } : undefined
  });
}

async function loadCourse() {
  if (!slug.value || Number.isNaN(courseId.value)) {
    return;
  }
  loading.value = true;
  error.value = false;
  notFound.value = false;
  try {
    const params = isPreview.value ? { preview: 1 } : undefined;
    const { data } = await api.get<PublicCoursePreviewResponse>(
      `/public/tenants/${slug.value}/courses/${courseId.value}`,
      { params }
    );
    response.value = {
      ...data,
      course: {
        ...data.course,
        currency: data.course?.currency ? data.course.currency.toUpperCase() : data.course?.currency
      }
    };
    updateMeta(data);
    applyBranding(data.teacher.branding as Record<string, unknown> | undefined);
    await refreshEnrollmentStatus();
  } catch (err: any) {
    console.warn('Failed to load public course', err);
    response.value = null;
    if (err?.response?.status === 404) {
      notFound.value = true;
      error.value = false;
    } else {
      error.value = true;
    }
    resetHead();
    restoreBranding();
  } finally {
    loading.value = false;
  }
}

function applyBranding(branding?: Record<string, unknown>) {
  if (typeof document === 'undefined') return;

  restoreBranding();

  if (!branding) return;
  const colors = (branding.colors as Record<string, string> | undefined) || {};
  if (colors.primary) {
    document.documentElement.style.setProperty('--ed-primary', colors.primary);
    activeThemeOverrides.primary = colors.primary;
  }
  if (colors.secondary) {
    document.documentElement.style.setProperty('--ed-secondary', colors.secondary);
    activeThemeOverrides.secondary = colors.secondary;
  }
}

function updateMeta(data: PublicCoursePreviewResponse) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  document.title = data.seo?.title || data.course.title;
  const description = data.seo?.description || data.course.description || '';
  setMeta('description', description);
  setMeta('og:title', data.seo?.title || data.course.title);
  setMeta('og:description', description);
  const image = withPlaceholder(data.course.thumbnailUrl || '', 'course');
  setMeta('og:image', image);
  setMeta('twitter:image', image);
  setMeta('twitter:title', data.seo?.title || data.course.title);
  setMeta('twitter:description', description);
  setLink('canonical', `${window.location.origin}/teacher/${data.teacher.slug}/courses/${data.course.id}`);
}

function setMeta(name: string, content: string) {
  if (!content || typeof document === 'undefined') return;
  let tag = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
    if (!managedMeta.has(name)) {
      managedMeta.set(name, { previous: null, created: true });
    }
  } else if (!managedMeta.has(name)) {
    managedMeta.set(name, { previous: tag.getAttribute('content'), created: false });
  }
  tag.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  if (!href || typeof document === 'undefined') return;
  let link = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
    if (!managedLinks.has(rel)) {
      managedLinks.set(rel, { previous: null, created: true });
    }
  } else if (!managedLinks.has(rel)) {
    managedLinks.set(rel, { previous: link.getAttribute('href'), created: false });
  }
  link.setAttribute('href', href);
}

onMounted(async () => {
  bindStickyMediaQuery();
  if (heroSection.value) {
    attachHeroObserver(heroSection.value);
  }

  if (!tenantStore.branding) {
    await tenantStore.fetchBranding(slug.value);
  }
  await loadCourse();
});

onBeforeUnmount(() => {
  resetHead();
  restoreBranding();
  heroObserver?.disconnect();
  heroObserver = null;
  removeMediaListener?.();
  mediaQueryChangeListener = null;
  stickyMediaQuery = null;
});

watch(
  () => route.fullPath,
  async () => {
    await loadCourse();
  }
);

watch(
  () => heroSection.value,
  (element) => {
    if (typeof window === 'undefined') {
      return;
    }
    attachHeroObserver(element);
  },
  { flush: 'post' }
);

watch(
  () => auth.isStudent,
  async (isStudent) => {
    if (isStudent) {
      await refreshEnrollmentStatus();
    } else {
      hasEnrollmentData.value = false;
      courseEnrolled.value = false;
    }
  }
);

watch(
  () => course.value,
  (value) => {
    if (!value) {
      heroInView.value = true;
      updateStickyVisibility();
    }
  }
);

async function copyToClipboard(value: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (typeof document === 'undefined') {
    throw new Error('Clipboard not supported');
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    const successful = document.execCommand('copy');
    if (!successful) {
      throw new Error('Copy command was unsuccessful');
    }
  } finally {
    textarea.remove();
  }
}

function restoreBranding() {
  if (typeof document === 'undefined') return;
  const style = document.documentElement.style;

  if (activeThemeOverrides.primary) {
    if (originalTheme.primary) {
      style.setProperty('--ed-primary', originalTheme.primary);
    } else {
      style.removeProperty('--ed-primary');
    }
    delete activeThemeOverrides.primary;
  }

  if (activeThemeOverrides.secondary) {
    if (originalTheme.secondary) {
      style.setProperty('--ed-secondary', originalTheme.secondary);
    } else {
      style.removeProperty('--ed-secondary');
    }
    delete activeThemeOverrides.secondary;
  }
}

function resetHead() {
  if (typeof document === 'undefined') return;

  managedMeta.forEach((entry, name) => {
    const tag = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
    if (!tag) {
      return;
    }

    if (entry.created) {
      tag.remove();
    } else if (entry.previous !== null) {
      tag.setAttribute('content', entry.previous);
    } else {
      tag.removeAttribute('content');
    }
  });

  managedLinks.forEach((entry, rel) => {
    const link = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
    if (!link) {
      return;
    }

    if (entry.created) {
      link.remove();
    } else if (entry.previous) {
      link.setAttribute('href', entry.previous);
    } else {
      link.removeAttribute('href');
    }
  });

  managedMeta.clear();
  managedLinks.clear();

  if (originalTitle) {
    document.title = originalTitle;
  }
}
</script>

<style scoped>
.public-course {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-8);
  padding-block: clamp(var(--sakai-space-8), 7vw, calc(var(--sakai-space-12) + var(--sakai-space-4)));
  padding-inline: clamp(var(--sakai-space-4), 6vw, var(--sakai-space-8));
  background: var(--sakai-surface-section);
  min-height: 100vh;
}

.public-course--rtl {
  direction: rtl;
}

.public-course--sticky {
  padding-bottom: calc(var(--sakai-space-12) + 5rem);
}

.public-course__hero {
  position: relative;
  border-radius: var(--sakai-border-radius-xl);
  overflow: hidden;
  color: var(--sakai-text-color-inverse);
  box-shadow: var(--sakai-shadow-lg);
  width: min(100%, 1120px);
  margin: 0 auto;
}

.public-course__hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--public-course-hero-gradient, var(--sakai-surface-hero));
  opacity: 0.94;
}

.public-course__hero--image::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, color-mix(in srgb, var(--sakai-overlay-strong) 70%, transparent), transparent),
    var(--public-course-hero-image, none);
  background-size: cover;
  background-position: center;
  filter: saturate(1.05);
}

.public-course__hero-inner {
  position: relative;
  display: grid;
  gap: var(--sakai-space-5);
  padding: clamp(var(--sakai-space-7), 7vw, calc(var(--sakai-space-10) + var(--sakai-space-2)));
  width: min(100%, 1120px);
  margin: 0 auto;
}

.public-course__hero-banner {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--sakai-space-3);
  align-items: center;
  padding: var(--sakai-space-3) var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid color-mix(in srgb, var(--sakai-text-color-inverse) 25%, transparent);
  background: color-mix(in srgb, var(--sakai-surface-card) 20%, transparent);
  backdrop-filter: blur(12px);
  box-shadow: var(--sakai-shadow-sm);
}

.public-course__hero-banner-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--sakai-border-radius-full);
  background: color-mix(in srgb, var(--public-primary) 22%, transparent);
  color: var(--public-primary);
}

.public-course__hero-banner-body {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
}

.public-course__hero-banner-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.public-course__hero-banner-meta {
  margin: 0;
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--sakai-text-color-inverse) 70%, transparent);
}

.public-course__hero-banner-cta {
  font-weight: var(--sakai-font-weight-medium);
  white-space: nowrap;
}

.public-course__back {
  justify-self: flex-start;
  color: color-mix(in srgb, var(--sakai-text-color-inverse) 85%, transparent);
}

.public-course__hero-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: clamp(var(--sakai-space-6), 6vw, var(--sakai-space-10));
  align-items: start;
}

.public-course__hero-main {
  display: grid;
  gap: var(--sakai-space-4);
  max-width: 720px;
}

.public-course__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-3);
}

.public-course__title {
  margin: 0;
  font-size: clamp(2.25rem, 4vw, 3rem);
  font-weight: var(--sakai-font-weight-bold);
}

.public-course__summary {
  margin: 0;
  font-size: 1.05rem;
  color: color-mix(in srgb, var(--sakai-text-color-inverse) 82%, transparent);
  line-height: var(--sakai-line-height-lg);
}

.public-course__hero-footer {
  display: grid;
  gap: var(--sakai-space-5);
  align-items: start;
}

.public-course__cta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-3);
  align-items: center;
}

.public-course__share {
  margin-inline-start: auto;
  font-weight: var(--sakai-font-weight-medium);
  color: color-mix(in srgb, var(--sakai-text-color-inverse) 85%, transparent);
}

.public-course--rtl .public-course__share {
  margin-inline-start: 0;
  margin-inline-end: auto;
}

.public-course__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--sakai-space-4);
}

.public-course__stat {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  background: color-mix(in srgb, var(--sakai-surface-card) 18%, transparent);
  backdrop-filter: blur(6px);
  box-shadow: var(--sakai-shadow-sm);
}

.public-course__stat-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--sakai-border-radius-full);
  background: color-mix(in srgb, var(--sakai-surface-card) 35%, transparent);
  color: var(--public-primary);
}

.public-course__stat-body {
  display: grid;
  gap: 0.25rem;
}

.public-course__stat-value {
  font-size: 1.5rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.public-course__stat-label {
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--sakai-text-color-inverse) 75%, transparent);
}

.public-course__section--accent {
  background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--public-primary) 20%, transparent),
      color-mix(in srgb, var(--public-secondary) 12%, transparent)
    ),
    var(--sakai-surface-card);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 45%, transparent);
}

.public-course__highlights {
  display: grid;
  gap: var(--sakai-space-4);
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.public-course__highlight {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  background: color-mix(in srgb, var(--sakai-surface-card) 65%, transparent);
  box-shadow: var(--sakai-shadow-sm);
}

.public-course__highlight-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: var(--sakai-border-radius-full);
  background: color-mix(in srgb, var(--public-primary) 18%, transparent);
  color: var(--public-primary);
}

.public-course__highlight-body {
  display: grid;
  gap: 0.35rem;
}

.public-course__highlight-label {
  margin: 0;
  font-size: 0.95rem;
  font-weight: var(--sakai-font-weight-medium);
  color: var(--sakai-text-color-secondary);
}

.public-course__highlight-value {
  margin: 0;
  font-size: 1.2rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.public-course__highlight-description {
  margin: 0;
  font-size: 0.9rem;
  color: var(--sakai-text-color-secondary);
}

.public-course__teacher {
  display: grid;
  gap: var(--sakai-space-4);
  align-content: start;
}

.public-course__teacher-header {
  margin: 0;
  font-size: 0.75rem;
  font-weight: var(--sakai-font-weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--sakai-text-color-inverse) 70%, transparent);
}

.public-course__teacher-name {
  margin: 0;
  font-size: 1.25rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.public-course__teacher-subject,
.public-course__teacher-tagline {
  margin: 0;
  color: color-mix(in srgb, var(--sakai-text-color-inverse) 78%, transparent);
}

.public-course__reviews {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-2);
  margin-top: var(--sakai-space-2);
  font-weight: var(--sakai-font-weight-medium);
}

.public-course__reviews--hero {
  margin: 0;
}

.public-course__content {
  display: grid;
  gap: var(--sakai-space-7);
  width: min(100%, 1120px);
  margin: 0 auto;
}

.public-course__loading {
  display: grid;
  gap: var(--sakai-space-6);
}

.public-course__loading-hero {
  display: grid;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-6);
  border-radius: var(--sakai-border-radius-xl);
  background: var(--sakai-surface-card);
}

.public-course__loading-section {
  display: grid;
  gap: var(--sakai-space-3);
}

.public-course__alert {
  justify-self: center;
  max-width: 640px;
}

.public-course__alert-content {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.public-course__alert-text {
  display: grid;
  gap: var(--sakai-space-2);
}

.public-course__alert-title {
  margin: 0;
  font-weight: var(--sakai-font-weight-semibold);
  font-size: 1.1rem;
}

.public-course__alert-description {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  line-height: var(--sakai-line-height-lg);
}

@media (min-width: 640px) {
  .public-course__alert-content {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.public-course__section {
  display: grid;
  gap: var(--sakai-space-3);
  padding: clamp(var(--sakai-space-5), 5vw, var(--sakai-space-7));
  border-radius: var(--sakai-border-radius-xl);
  background: var(--sakai-surface-card);
  box-shadow: var(--sakai-shadow-sm);
}

.public-course__section-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.public-course__section-text {
  margin: 0;
  line-height: var(--sakai-line-height-lg);
  color: var(--sakai-text-color-secondary);
}

.public-course__offers,
.public-course__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--sakai-space-3);
}

.public-course__empty {
  margin: 0;
  color: var(--sakai-text-color-secondary);
}

.public-course__list-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--sakai-space-3);
  align-items: center;
  padding: var(--sakai-space-4);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 60%, transparent);
  border-radius: var(--sakai-border-radius-lg);
}

.public-course__list-content {
  display: grid;
  gap: 0.35rem;
}

.public-course__list-action {
  justify-self: flex-end;
}

.public-course__list-title {
  margin: 0;
  font-weight: var(--sakai-font-weight-medium);
}

.public-course__list-meta {
  margin: 0;
  color: var(--sakai-text-color-secondary);
}

.public-course__list--timeline {
  position: relative;
  padding-inline-start: calc(var(--sakai-space-3) + 1.5rem);
  border-inline-start: 1px solid color-mix(in srgb, var(--sakai-border-color) 65%, transparent);
}

.public-course--rtl .public-course__list--timeline {
  border-inline-start: none;
  border-inline-end: 1px solid color-mix(in srgb, var(--sakai-border-color) 65%, transparent);
  padding-inline-start: 0;
  padding-inline-end: calc(var(--sakai-space-3) + 1.5rem);
}

.public-course__list--timeline .public-course__list-item {
  position: relative;
}

.public-course__list--timeline .public-course__list-item::before {
  content: '';
  position: absolute;
  width: 0.85rem;
  height: 0.85rem;
  border-radius: var(--sakai-border-radius-full);
  background: var(--public-primary);
  inset-block-start: 50%;
  transform: translateY(-50%);
  inset-inline-start: calc(-1 * 1.5rem);
}

.public-course--rtl .public-course__list--timeline .public-course__list-item::before {
  inset-inline-start: auto;
  inset-inline-end: calc(-1 * 1.5rem);
}

@media (max-width: 640px) {
  .public-course__list-item {
    grid-template-columns: auto 1fr;
    align-items: flex-start;
  }

  .public-course__list-action {
    grid-column: 2 / 3;
    justify-self: flex-start;
    margin-block-start: var(--sakai-space-2);
  }
}

.public-course__curriculum {
  display: grid;
  gap: var(--sakai-space-3);
}

.public-course__module-description {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  line-height: var(--sakai-line-height-md);
}

.public-course__offer {
  display: flex;
  gap: var(--sakai-space-3);
  align-items: center;
  padding: var(--sakai-space-4);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 60%, transparent);
  border-radius: var(--sakai-border-radius-lg);
}

.public-course__offer-body {
  display: grid;
  gap: var(--sakai-space-1);
}

.public-course__offer-value {
  margin: 0;
  font-weight: var(--sakai-font-weight-semibold);
}

.public-course__offer-meta {
  margin: 0;
  color: var(--sakai-text-color-secondary);
}

.public-course__samples {
  display: grid;
  gap: var(--sakai-space-4);
}

.public-course__sample {
  display: grid;
  gap: var(--sakai-space-2);
}

.public-course__sample-video {
  position: relative;
  padding-top: 56.25%;
  border-radius: var(--sakai-border-radius-lg);
  overflow: hidden;
  background: color-mix(in srgb, var(--public-secondary) 25%, transparent);
}

.public-course__sample-video iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.public-course__sample-title {
  margin: 0;
  font-weight: var(--sakai-font-weight-medium);
}

.public-course__sample-meta {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  font-size: 0.9rem;
}

.public-course__reviews-summary {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-2);
  font-weight: var(--sakai-font-weight-medium);
}

.public-course__reviews-list {
  margin-top: var(--sakai-space-3);
}

.public-course__teacher-card {
  display: flex;
  gap: var(--sakai-space-4);
  align-items: center;
}

.public-course__sticky-cta {
  position: fixed;
  inset-inline: 0;
  inset-block-end: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-4) var(--sakai-space-5);
  background: color-mix(in srgb, var(--sakai-surface-card) 92%, transparent);
  border-top: 1px solid color-mix(in srgb, var(--sakai-border-color) 50%, transparent);
  box-shadow: 0 -12px 32px color-mix(in srgb, var(--sakai-shadow-color) 12%, transparent);
  z-index: 30;
  backdrop-filter: blur(14px);
}

.public-course__sticky-info {
  display: grid;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.public-course__sticky-title {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.public-course__sticky-price {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  font-size: 0.9rem;
}

.public-course__sticky-actions {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-3);
}

.public-course__sticky-share {
  padding: 0.55rem;
  min-width: 2.75rem;
}

.public-course__sticky-transition-enter-active,
.public-course__sticky-transition-leave-active {
  transition: transform 0.24s ease, opacity 0.24s ease;
}

.public-course__sticky-transition-enter-from,
.public-course__sticky-transition-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@media (max-width: 768px) {
  .public-course__hero-body {
    grid-template-columns: 1fr;
  }

  .public-course__hero-banner {
    grid-template-columns: auto 1fr;
    align-items: start;
    gap: var(--sakai-space-2);
  }

  .public-course__hero-banner-cta {
    grid-column: 1 / -1;
    justify-self: flex-start;
    padding-inline: 0;
    margin-top: var(--sakai-space-2);
  }

  .public-course__share {
    width: 100%;
    margin-inline-start: 0;
    justify-content: center;
  }

  .public-course__teacher {
    grid-template-columns: auto 1fr;
  }
}

@media (min-width: 992px) {
  .public-course__hero-footer {
    grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
    align-items: stretch;
  }
}
</style>
