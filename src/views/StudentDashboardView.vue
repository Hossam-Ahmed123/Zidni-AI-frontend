<template>
  <ThemePage>
    <UiDialog
      v-if="showTenantPrompt"
      :model-value="showTenantPrompt"
      :title="t('student.tenantSwitcher.promptTitle')"
      :mask-closable="false"
      @update:model-value="showTenantPrompt = $event"
    >
      <p class="tenant-switcher__lead">{{ t('student.tenantSwitcher.promptBody') }}</p>
      <StudentTenantSwitcher
        ref="tenantSwitcherRef"
        embedded
        :auto-open="true"
        @switched="handleTenantSwitched"
        @links-loaded="handleLinksLoaded"
      />
      <p v-if="tenantPromptEmpty" class="tenant-switcher__empty">
        {{ t('student.tenantSwitcher.emptyState') }}
      </p>
    </UiDialog>

    <UiDialog
      v-model="courseAccessDialog.visible"
      :title="t('student.courseAccessDialogTitle', { course: courseAccessDialog.courseTitle })"
      :mask-closable="false"
    >
      <p class="course-access-dialog__lead">{{ t('student.courseAccessDialogMessage') }}</p>
      <ul class="course-access-dialog__list">
        <li
          class="course-access-dialog__item"
          :class="courseAccessDialog.hasEnrollment
            ? courseAccessDialog.enrollmentActive
              ? 'is-complete'
              : 'is-warning'
            : 'is-missing'"
        >
          <strong>{{ t('student.courseAccessStepEnrollment') }}</strong>
          <span v-if="!courseAccessDialog.hasEnrollment">{{ t('student.courseAccessHintEnrollment') }}</span>
          <span v-else-if="!courseAccessDialog.enrollmentActive">{{ t('student.courseAccessHintEnrollmentPending') }}</span>
          <span v-else>{{ t('student.courseAccessComplete') }}</span>
        </li>
        <li
          class="course-access-dialog__item"
          :class="normalizeManualStatus(courseAccessDialog.paymentStatus) === 'approved'
            ? 'is-complete'
            : normalizeManualStatus(courseAccessDialog.paymentStatus) === 'pending'
              ? 'is-warning'
              : 'is-missing'"
        >
          <strong>{{ t('student.courseAccessStepPayment') }}</strong>
          <span v-if="normalizeManualStatus(courseAccessDialog.paymentStatus) === 'approved'">{{ t('student.courseAccessComplete') }}</span>
          <span v-else-if="normalizeManualStatus(courseAccessDialog.paymentStatus) === 'pending'">{{ t('student.courseAccessHintPaymentPending') }}</span>
          <span v-else-if="normalizeManualStatus(courseAccessDialog.paymentStatus) === 'rejected'">{{ t('student.courseAccessHintPaymentRejected') }}</span>
          <span
            v-if="normalizeManualStatus(courseAccessDialog.paymentStatus) === 'rejected' && courseAccessDialog.paymentNotes"
            class="course-access-dialog__note"
          >
            {{ courseAccessDialog.paymentNotes }}
          </span>
          <span v-else>{{ t('student.courseAccessHintPayment') }}</span>
        </li>
        <li
          class="course-access-dialog__item"
          :class="courseAccessDialog.teacherActive ? 'is-complete' : 'is-missing'"
        >
          <strong>{{ t('student.courseAccessStepTeacher') }}</strong>
          <span v-if="courseAccessDialog.teacherActive">{{ t('student.courseAccessComplete') }}</span>
          <span v-else>{{ t('student.courseAccessHintTeacher') }}</span>
        </li>
      </ul>
      <template #footer>
        <UiButton variant="outline" @click="courseAccessDialog.visible = false">
          {{ t('common.close') }}
        </UiButton>
        <UiButton color="primary" @click="handleCourseDialogAction">
          {{ courseDialogRejected ? t('student.resubmitPaymentAction') : t('student.courseAccessDialogAction') }}
        </UiButton>
      </template>
    </UiDialog>

    <div class="student-dashboard">
      <header class="student-dashboard__header">
        <UiCard class="student-hero-card" hover>
          <div class="student-hero-card__inner">
            <div class="student-hero-card__copy">
              <UiBadge variant="soft" color="primary" size="sm">{{ t('student.profile') }}</UiBadge>
              <h2 class="student-hero-card__title">{{ welcomeMessage }}</h2>
              <p class="student-hero-card__subtitle">
                <span>{{ t('student.enrollments') }} · {{ totalEnrollments }}</span>
                <span class="dot-divider"></span>
                <span>{{ t('student.payments') }} · {{ totalPaymentsCount }}</span>
                <span v-if="showTenantSwitching" class="student-hero-card__switching" aria-live="polite">
                  <span class="student-hero-card__spinner" aria-hidden="true"></span>
                </span>
              </p>
              <div class="student-hero-card__actions">
                <UiButton
                  v-if="quickActions[0]"
                  color="primary"
                  :prepend-icon="quickActions[0].icon"
                  @click="quickActions[0].action()"
                >
                  {{ quickActions[0].label }}
                </UiButton>
                <UiButton
                  v-if="quickActions[1]"
                  variant="outline"
                  color="secondary"
                  :prepend-icon="quickActions[1].icon"
                  @click="quickActions[1].action()"
                >
                  {{ quickActions[1].label }}
                </UiButton>
              </div>
            </div>
            <div class="student-hero-card__insights">
              <div class="student-progress-circle-wrap">
                <UiProgressCircle :value="completionRate" :size="96" :stroke-width="10" show-value />
                <span class="student-progress-circle-wrap__label">{{ t('student.tableProgress') }}</span>
              </div>
              <div class="student-hero-card__stats">
                <div class="stat-mini">
                  <span class="stat-mini__label">{{ t('student.tableStatus') }}</span>
                  <strong class="stat-mini__value">{{ activeEnrollments }}</strong>
                  <small>{{ t('student.enrollments') }}</small>
                </div>
                <div class="stat-mini">
                  <span class="stat-mini__label">{{ t('student.payments') }}</span>
                  <strong class="stat-mini__value">{{ pendingPayments }}</strong>
                  <small>{{ t('student.tableStatus') }}</small>
                </div>
              </div>
            </div>
          </div>
        </UiCard>
      </header>

      <section class="student-dashboard__metrics">
        <UiStatCard
          :label="t('student.enrollments')"
          :value="totalEnrollments.toString()"
          icon="SchoolOutlined"
          color="primary"
          :description="`${t('student.tableStatus')} · ${activeEnrollments}`"
        />

        <UiStatCard
          :label="t('student.payments')"
          :value="pendingPayments.toString()"
          icon="CreditCardOutlined"
          color="warning"
          :description="`${t('student.tableStatus')} · ${pendingPaymentRate}%`"
        />

        <UiStatCard
          :label="t('student.notifications')"
          :value="notificationsCount.toString()"
          icon="BellOutlined"
          color="info"
          :description="`${t('student.notifications')} · ${notificationsCount}`"
        />

        <UiStatCard
          :label="t('achievements.nav')"
          :value="achievementsStore.data?.certificates?.length?.toString() || '0'"
          icon="TrophyOutlined"
          color="success"
          :description="t('certificates.student.title')"
        />
      </section>

      <div class="student-dashboard__layout">
        <main class="student-dashboard__main">
          <UiCard :title="t('student.enrollments')" class="student-dashboard__card">
            <div class="student-dashboard__table-wrap">
              <UiTable :headers="enrollmentHeaders" :items="studentStore.enrollments">
              <template #item.courseTitle="{ item }">
                 <span class="course-cell-title">{{ item.courseTitle }}</span>
              </template>
              <template #item.teacherName="{ item }">
                <div class="teacher-cell">
                  <UiAvatar :src="item.teacherPhotoUrl" :size="32" :label="item.teacherName" />
                  <div class="teacher-cell__info">
                    <span class="teacher-cell__name">{{ item.teacherName || t('student.unknownTeacher') }}</span>
                    <small v-if="item.teacherSubject" class="teacher-cell__subject">{{ item.teacherSubject }}</small>
                  </div>
                </div>
              </template>
              <template #item.status="{ item }">
                <UiBadge :color="statusTone(item.status)" variant="soft" size="sm">{{ item.status }}</UiBadge>
              </template>
              <template #item.startAt="{ item }">
                <span class="date-cell">{{ formatDate(item.startAt) }}</span>
              </template>
              <template #item.endAt="{ item }">
                <span class="date-cell">{{ formatDate(item.endAt) }}</span>
              </template>
              <template #item.progress="{ item }">
                <div class="progress-cell">
                  <UiProgressBar :value="item.progress" size="sm" :color="item.progress >= 100 ? 'success' : 'primary'" />
                  <span class="progress-cell__value">{{ Math.round(Number(item.progress || 0)) }}%</span>
                </div>
              </template>
              </UiTable>
            </div>
            <div class="student-dashboard__list" role="list">
              <article
                v-for="item in studentStore.enrollments"
                :key="item.courseId"
                class="student-dashboard__list-item"
                role="listitem"
              >
                <header class="student-dashboard__list-header">
                  <h3>{{ item.courseTitle }}</h3>
                  <UiBadge :color="statusTone(item.status)" variant="soft" size="sm">{{ item.status }}</UiBadge>
                </header>
                <div class="student-dashboard__list-field">
                  <label>{{ t('student.teacher') }}</label>
                  <span>{{ item.teacherName || t('student.unknownTeacher') }}</span>
                </div>
                <div class="student-dashboard__list-field">
                  <label>{{ t('student.tableProgress') }}</label>
                  <div class="student-dashboard__list-progress">
                    <UiProgressBar :value="item.progress" :show-value="false" size="sm" />
                    <span>{{ Math.round(Number(item.progress || 0)) }}%</span>
                  </div>
                </div>
                <div class="student-dashboard__list-field">
                  <label>{{ t('student.startDate') }}</label>
                  <span>{{ formatDate(item.startAt) }}</span>
                </div>
                <div class="student-dashboard__list-field">
                  <label>{{ t('student.endDate') }}</label>
                  <span>{{ formatDate(item.endAt) }}</span>
                </div>
              </article>
            </div>
          </UiCard>
          <UiCard :title="t('student.payments')" class="student-dashboard__card">
            <div class="student-dashboard__payments-filter">
              <UiSegmentedControl
                v-model="paymentStatusFilter"
                :options="paymentFilterOptions"
                size="sm"
              />
            </div>
            <div class="student-dashboard__table-wrap">
              <UiTable :headers="paymentHeaders" :items="filteredPayments">
              <template #item.courseTitle="{ item }">
                 <span class="course-cell-title">{{ item.courseTitle }}</span>
              </template>
              <template #item.method="{ item }">
                <span class="method-cell">{{ formatManualMethod(item.method) }}</span>
              </template>
              <template #item.proofUrl="{ item }">
                <UiButton
                  v-if="item.proofUrl"
                  variant="ghost"
                  size="sm"
                  color="info"
                  prepend-icon="ExportOutlined"
                  :href="item.proofUrl"
                  target="_blank"
                >
                  {{ t('student.viewProof') }}
                </UiButton>
                <span v-else class="text-muted">—</span>
              </template>
              <template #item.status="{ item }">
                <UiBadge :color="statusTone(item.status)" variant="soft" size="sm">
                  {{ formatPaymentStatus(item.status) }}
                </UiBadge>
              </template>
              <template #item.notes="{ item }">
                <span class="text-muted">{{ item.notes || '—' }}</span>
              </template>
              <template #item.action="{ item }">
                <UiButton
                  v-if="normalizeManualStatus(item.status) === 'rejected'"
                  size="sm"
                  variant="outline"
                  color="primary"
                  @click="routeToCheckout(item.courseId)"
                >
                  {{ t('student.resubmitPaymentAction') }}
                </UiButton>
              </template>
              </UiTable>
            </div>
            <div class="student-dashboard__list" role="list">
              <article
                v-for="item in filteredPayments"
                :key="item.id || `${item.courseId}-${item.method}-${item.createdAt}`"
                class="student-dashboard__list-item"
                role="listitem"
              >
                <header class="student-dashboard__list-header">
                  <h3>{{ item.courseTitle }}</h3>
                  <UiBadge :color="statusTone(item.status)" variant="soft" size="sm">
                    {{ formatPaymentStatus(item.status) }}
                  </UiBadge>
                </header>
                <div class="student-dashboard__list-field">
                  <label>{{ t('student.amount') }}</label>
                  <span>{{ item.amount }}</span>
                </div>
                <div class="student-dashboard__list-field">
                  <label>{{ t('student.paymentMethod') }}</label>
                  <span>{{ formatManualMethod(item.method) }}</span>
                </div>
                <div class="student-dashboard__list-field">
                  <label>{{ t('student.notes') }}</label>
                  <span>{{ item.notes || '—' }}</span>
                </div>
                <div v-if="normalizeManualStatus(item.status) === 'rejected'" class="student-dashboard__list-action">
                  <UiButton
                    size="sm"
                    variant="outline"
                    color="primary"
                    @click="routeToCheckout(item.courseId)"
                  >
                    {{ t('student.resubmitPaymentAction') }}
                  </UiButton>
                </div>
              </article>
            </div>
          </UiCard>
        </main>

        <aside class="student-dashboard__sidebar">
          <UiCard :title="t('student.myCourses')" class="student-dashboard__card">
            <div class="course-mini-list">
              <div v-if="!courseSummaries.length" class="empty-state">
                <UiIcon name="BookOutlined" :size="32" class="text-muted" />
                <p>{{ t('student.noCourses') }}</p>
              </div>
              <button
                v-for="course in courseSummaries"
                :key="course.id"
                class="course-mini-item"
                @click="handleCourseClick(course)"
              >
                <div class="course-mini-item__info">
                  <span class="course-mini-item__title">{{ course.title }}</span>
                  <UiBadge :color="course.badgeColor" size="sm" variant="soft">
                    {{ course.statusLabel }}
                  </UiBadge>
                </div>
                <UiIcon name="RightOutlined" :size="14" class="course-mini-item__arrow" />
              </button>
            </div>
          </UiCard>

          <UiCard :title="t('certificates.student.title')" class="student-dashboard__card">
            <div class="certificate-mini-list">
              <div v-if="!certificateItems.length" class="empty-state">
                <UiIcon name="SafetyCertificateOutlined" :size="32" class="text-muted" />
                <p>{{ t('certificates.student.empty') }}</p>
              </div>
              <div v-else class="certificate-mini-list__items">
                <div v-for="certificate in certificateItems" :key="certificate.id" class="certificate-mini-item">
                  <div class="certificate-mini-item__info">
                    <span class="certificate-mini-item__title">{{ certificate.courseTitle }}</span>
                    <small class="certificate-mini-item__date">{{ formatDate(certificate.issuedAt) }}</small>
                  </div>
                  <UiButton
                    size="xs"
                    variant="outline"
                    color="primary"
                    :href="certificate.downloadUrl"
                    target="_blank"
                    rel="noopener"
                  >
                    {{ t('certificates.student.download') }}
                  </UiButton>
                </div>
                <UiButton
                  v-if="certificateItems.length"
                  variant="link"
                  color="secondary"
                  size="sm"
                  class="certificate-mini-list__view-all"
                  @click="router.push({ name: 'student-achievements' })"
                >
                  {{ t('certificates.student.viewAll') }}
                </UiButton>
              </div>
            </div>
          </UiCard>

          <UiCard :title="t('student.profile')" class="student-dashboard__card">
            <div class="profile-summary">
              <UiAvatar :size="64" :label="studentStore.profile?.name" />
              <div class="profile-summary__info">
                <strong>{{ studentStore.profile?.name }}</strong>
                <span class="text-muted">{{ studentStore.profile?.email }}</span>
              </div>
            </div>
            <div class="profile-grid-actions">
              <UiButton
                v-for="action in quickActions.slice(2)"
                :key="action.label"
                variant="outline"
                size="sm"
                :prepend-icon="action.icon"
                @click="action.action()"
                class="profile-action-btn"
              >
                {{ action.label }}
              </UiButton>
              <UiButton variant="outline" color="danger" size="sm" prepend-icon="LogoutOutlined" @click="logout" class="profile-action-btn">
                {{ t('nav.logout') }}
              </UiButton>
            </div>
          </UiCard>

          <UiCard :title="t('student.notifications')" class="student-dashboard__card">
            <div class="notification-feed">
              <div v-if="!studentStore.notifications.length" class="empty-state">
                 <UiIcon name="BellOutlined" :size="32" class="text-muted" />
                <p>{{ t('student.noNotifications') }}</p>
              </div>
              <div v-for="notification in studentStore.notifications.slice(0, 5)" :key="notification.id" class="notification-feed__item">
                <div class="notification-feed__dot"></div>
                <div class="notification-feed__content">
                  <p class="notification-feed__message">{{ notificationMessage(notification) }}</p>
                  <p v-if="notificationNote(notification.context)" class="notification-feed__note">
                    {{ t('notifications.reasonLabel') }}: {{ notificationNote(notification.context) }}
                  </p>
                  <UiButton
                    v-if="notification.type === 'payment' && notificationStatus(notification.context) === 'REJECTED'"
                    size="xs"
                    variant="outline"
                    color="primary"
                    class="notification-feed__action"
                    @click="routeToCheckout(notificationCourseId(notification.context))"
                  >
                    {{ t('student.resubmitPaymentAction') }}
                  </UiButton>
                  <small class="notification-feed__date">{{ formatDate(notification.createdAt) }}</small>
                </div>
              </div>
            </div>
          </UiCard>
        </aside>
      </div>
    </div>
  </ThemePage>
</template>

<script setup lang="ts">
import { FEATURE } from '@/constants/featureCatalog';
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';

import { useI18n } from 'vue-i18n';
import { useStudentStore } from '@/stores/student';
import { useAchievementsStore } from '@/stores/achievements';
import { useTenantStore } from '@/stores/tenant';
import { getStoredTenantSlug, sanitizeTenantSlug } from '@/utils/tenantStorage';
import { parseNotificationContext } from '@/utils/notifications';
import { useFeaturesStore } from '@/stores/features';
import { useAuthStore } from '@/stores/auth';
import type { ManualPaymentMethod, ManualPaymentStatus } from '@/services/student';
import { getStudentCourses } from '@/services/student';
import { useStudentCheckoutStore } from '@/stores/studentCheckout';
import { useVisibilityRefresh } from '@/composables/useVisibilityRefresh';
import { withCacheBusting } from '@/utils/cacheBusting';
 
import UiCard from '@/components/ui/UiCard.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiBadge from '@/components/ui/UiBadge.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiStatCard from '@/components/ui/UiStatCard.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiAvatar from '@/components/ui/UiAvatar.vue';
import UiProgressBar from '@/components/ui/UiProgressBar.vue';
import UiProgressCircle from '@/components/ui/UiProgressCircle.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import UiSegmentedControl from '@/components/ui/UiSegmentedControl.vue';
import StudentTenantSwitcher from '@/components/student/StudentTenantSwitcher.vue';
import ThemePage from '@/layout/theme/ThemePage.vue';

const { t } = useI18n();
const studentStore = useStudentStore();
const achievementsStore = useAchievementsStore();
const tenantStore = useTenantStore();
const featuresStore = useFeaturesStore();
const auth = useAuthStore();
const router = useRouter();

const courses = ref<Array<{ id: number; title: string; price?: number | null; currency?: string | null }>>([]);
const fetchedCourses = ref<Array<{ id: number; title: string; price?: number | null; currency?: string | null }>>([]);
const checkoutStore = useStudentCheckoutStore();
const showTenantPrompt = ref(false);
const tenantPromptEmpty = ref(false);
const tenantSwitcherRef = ref<InstanceType<typeof StudentTenantSwitcher> | null>(null);
const dashboardHydrationInFlight = ref(false);
const showTenantSwitching = computed(() => dashboardHydrationInFlight.value || studentStore.loading);

const enrollmentHeaders = computed(() => [
  { title: t('student.tableCourse'), key: 'courseTitle' },
  { title: t('student.tableTeacher'), key: 'teacherName' },
  { title: t('student.tableStatus'), key: 'status' },
  { title: t('student.tableStart'), key: 'startAt' },
  { title: t('student.tableEnd'), key: 'endAt' },
  { title: t('student.tableProgress'), key: 'progress', align: 'end' as const }
]);

const paymentHeaders = computed(() => [
  { title: t('student.tableCourse'), key: 'courseTitle' },
  { title: t('student.tableAmount'), key: 'amount' },
  { title: t('student.tableMethod'), key: 'method' },
  { title: t('student.tableProof'), key: 'proofUrl' },
  { title: t('student.tableStatus'), key: 'status' },
  { title: t('student.tableNotes'), key: 'notes' },
  { title: t('student.tableAction'), key: 'action' }
]);

const normalizeCurrency = (value?: string | null) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed.toUpperCase();
    }
  }
  return null;
};

type CourseSummary = {
  id: number;
  title: string;
  badgeColor: 'success' | 'warning' | 'danger' | 'info';
  statusLabel: string;
  hasEnrollment: boolean;
  enrollmentActive: boolean;
  paymentStatus: ManualPaymentStatus | null;
  teacherActive: boolean;
  accessible: boolean;
};

const courseAccessDialog = reactive({
  visible: false,
  courseId: null as number | null,
  courseTitle: '',
  hasEnrollment: false,
  enrollmentActive: false,
  paymentStatus: null as ManualPaymentStatus | null,
  paymentNotes: null as string | null,
  teacherActive: true
});
const courseDialogRejected = computed(
  () => normalizeManualStatus(courseAccessDialog.paymentStatus) === 'rejected'
);

const totalEnrollments = computed(() => studentStore.enrollments.length);
const activeEnrollments = computed(() =>
  studentStore.enrollments.filter((item) => item.status === 'active' || item.status === 'approved').length
);
const normalizeManualStatus = (status?: ManualPaymentStatus | null | string): ManualPaymentStatus => {
  const value = String(status ?? '').toUpperCase();
  switch (value) {
    case 'APPROVED':
    case 'SUCCESS':
      return 'approved';
    case 'PENDING_REVIEW':
    case 'PENDING':
      return 'pending';
    case 'REJECTED':
    case 'FAILED':
      return 'rejected';
    default:
      return (status ?? '') as ManualPaymentStatus;
  }
};

const formatManualMethod = (method?: ManualPaymentMethod | string | null) => {
  if (!method) return '—';
  const value = String(method);
  const studentKey = `student.paymentMethod.${value}`;
  const studentTranslated = t(studentKey);
  if (studentTranslated !== studentKey) return studentTranslated;
  const teacherKey = `teacher.paymentMethod.${value}`;
  const teacherTranslated = t(teacherKey);
  if (teacherTranslated !== teacherKey) return teacherTranslated;
  return value.replace(/_/g, ' ');
};

const formatPaymentStatus = (status?: ManualPaymentStatus | string | null) => {
  const normalized = normalizeManualStatus(status);
  const studentKey = `student.paymentStatus.${normalized}`;
  const studentTranslated = t(studentKey);
  if (studentTranslated !== studentKey) return studentTranslated;
  const teacherKey = `teacher.paymentStatus.${String(status ?? normalized).toUpperCase()}`;
  const teacherTranslated = t(teacherKey);
  if (teacherTranslated !== teacherKey) return teacherTranslated;
  return normalized || (status ? String(status) : 'â€”');
};

const unpaidPayments = computed(() =>
  studentStore.payments.filter((item) => normalizeManualStatus(item.status) !== 'approved')
);
const paymentStatusFilter = ref<'all' | 'pending' | 'approved' | 'rejected'>('all');
const paymentFilterOptions = computed(() => [
  { value: 'all', label: t('student.paymentFilterAll') },
  { value: 'pending', label: t('student.paymentFilterPending') },
  { value: 'approved', label: t('student.paymentFilterApproved') },
  { value: 'rejected', label: t('student.paymentFilterRejected') }
]);
const filteredPayments = computed(() => {
  const filter = paymentStatusFilter.value;
  if (filter === 'all') return studentStore.payments;
  return studentStore.payments.filter((item) => normalizeManualStatus(item.status) === filter);
});
const pendingPayments = computed(() =>
  unpaidPayments.value.filter((item) => normalizeManualStatus(item.status) === 'pending').length
);
const notificationsCount = computed(() => studentStore.notifications.length);
const totalPaymentsCount = computed(() => studentStore.payments.length);
const certificateItems = computed(() =>
  (achievementsStore.data?.certificates ?? []).slice(0, 3).map((certificate) => ({
    ...certificate,
    downloadUrl: withCacheBusting(certificate.pdfUrl)
  }))
);
const completionRate = computed(() => {
  const total = totalEnrollments.value;
  if (!total) return 0;
  return Math.min(100, Math.round((activeEnrollments.value / total) * 100));
});
const pendingPaymentRate = computed(() => {
  const total = totalPaymentsCount.value;
  if (!total) return 0;
  return Math.round((pendingPayments.value / total) * 100);
});
const welcomeMessage = computed(() => {
  const name = studentStore.profile?.name?.trim() || '';
  const [first] = name.split(/\s+/).filter(Boolean);
  if (first) {
    return t('teacher.welcome', { name: first });
  }
  return t('student.profile');
});

const multiTeacherEnabled = computed(() => featuresStore.hasFeature(FEATURE.multiTeacherStudent));

const combinedCourses = computed(() => {
  const map = new Map<number, { id: number; title: string }>();
  courses.value.forEach((course) => {
    if (course.id != null) map.set(course.id, course);
  });
  studentStore.enrollments.forEach((enrollment) => {
    if (!map.has(enrollment.courseId)) {
      map.set(enrollment.courseId, { id: enrollment.courseId, title: enrollment.courseTitle });
    }
  });
  return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
});

const isEnrollmentActive = (status?: string | null) => {
  const normalized = (status ?? '').toString().toLowerCase();
  return ['active', 'approved', 'trial', 'in_progress', 'enrolled'].includes(normalized);
};

const paymentStatusForCourse = (courseId: number): ManualPaymentStatus | null => {
  let result: ManualPaymentStatus | null = null;
  studentStore.payments.forEach((payment) => {
    if (payment.courseId !== courseId) return;
    const normalized = normalizeManualStatus(payment.status);
    if (normalized === 'approved') {
      result = 'approved';
      return;
    }
    if (normalized === 'pending' && result !== 'approved') {
      result = 'pending';
    } else if (result == null) {
      result = normalized;
    }
  });
  return result;
};

const paymentNotesForCourse = (courseId: number): string | null => {
  const match = studentStore.payments.find((payment) => payment.courseId === courseId && payment.notes);
  const notes = match?.notes?.trim();
  return notes && notes.length ? notes : null;
};

const courseSummaries = computed<CourseSummary[]>(() => {
  return combinedCourses.value.map((course) => {
    const enrollment = studentStore.enrollments.find((item) => item.courseId === course.id);
    const hasEnrollment = Boolean(enrollment);
    const enrollmentActive = hasEnrollment && isEnrollmentActive(enrollment?.status);
    const teacherActive = enrollment?.teacherActive !== false;
    const paymentStatus = paymentStatusForCourse(course.id);
    const paymentApproved = normalizeManualStatus(paymentStatus) === 'approved';

    let badgeColor: CourseSummary['badgeColor'] = 'info';
    let statusLabel = '';

    if (!hasEnrollment) {
      badgeColor = 'warning';
      statusLabel = t('student.courseAccessStatusEnroll');
    } else if (!enrollmentActive) {
      badgeColor = 'warning';
      statusLabel = t('student.courseAccessStatusEnrollmentPending');
    } else if (!teacherActive) {
      badgeColor = 'danger';
      statusLabel = t('student.courseAccessStatusTeacherInactive');
    } else if (paymentApproved) {
      badgeColor = 'success';
      statusLabel = t('student.courseAccessStatusReady');
    } else if (paymentStatus === 'pending') {
      badgeColor = 'warning';
      statusLabel = t('student.courseAccessStatusPaymentPending');
    } else if (paymentStatus === 'rejected') {
      badgeColor = 'danger';
      statusLabel = t('student.courseAccessStatusPaymentRejected');
    } else {
      badgeColor = 'danger';
      statusLabel = t('student.courseAccessStatusPaymentMissing');
    }

    return {
      id: course.id,
      title: course.title,
      badgeColor,
      statusLabel,
      hasEnrollment,
      enrollmentActive,
      paymentStatus,
      teacherActive,
      accessible: hasEnrollment && enrollmentActive && teacherActive && paymentApproved
    };
  });
});

const quickActions = computed(() => [
  { label: t('assessments.studentTitle'), icon: 'AuditOutlined', color: 'primary', action: () => router.push({ name: 'student-assessments' }) },
  { label: t('liveSessions.studentNav'), icon: 'VideoCameraOutlined', color: 'secondary', action: () => router.push({ name: 'student-live-sessions' }) },
  { label: t('tutoring.student.nav'), icon: 'ClockCircleOutlined', color: 'primary', action: () => router.push({ name: 'student-tutoring' }) },
  { label: t('learning.student.nav'), icon: 'SchoolOutlined', color: 'secondary', action: () => router.push({ name: 'student-learning' }) },
  { label: t('achievements.nav'), icon: 'TrophyOutlined', color: 'primary', action: () => router.push({ name: 'student-achievements' }) }
]);

const handleCourseClick = (course: CourseSummary) => {
  if (course.accessible) {
    router.push({ name: 'student-learning', query: { courseId: String(course.id) } });
    return;
  }
  Object.assign(courseAccessDialog, {
    courseId: course.id,
    courseTitle: course.title,
    hasEnrollment: course.hasEnrollment,
    enrollmentActive: course.enrollmentActive,
    paymentStatus: course.paymentStatus,
    paymentNotes: paymentNotesForCourse(course.id),
    teacherActive: course.teacherActive,
    visible: true
  });
};

const routeToCheckout = async (courseId: number | null) => {
  if (courseId == null) return;
  const match = courses.value.find((course) => course.id === courseId);
  if (match) {
    checkoutStore.setItems([{
      courseId: match.id,
      qty: 1,
      title: match.title,
      price: match.price,
      currency: normalizeCurrency(match.currency)
    }]);
  } else {
    checkoutStore.setItems([{ courseId, qty: 1 }]);
  }
  const slug = tenantStore.branding?.slug?.trim();
  await router.push({ name: 'student-checkout', query: { courseId: String(courseId), ...(slug ? { slug } : {}) } });
};

const handleCourseDialogAction = async () => {
  const { courseId } = courseAccessDialog;
  courseAccessDialog.visible = false;
  await nextTick();
  await routeToCheckout(courseId);
};

const logout = async () => {
  const storedTenant = getStoredTenantSlug();
  const tenantSlug = [
    sanitizeTenantSlug(studentStore.profile?.teacherSlug),
    sanitizeTenantSlug(tenantStore.rawSlug),
    sanitizeTenantSlug(tenantStore.slug),
    sanitizeTenantSlug(storedTenant.raw),
    sanitizeTenantSlug(storedTenant.normalized)
  ].find(Boolean) || '';

  await auth.logout();
  if (tenantSlug) {
    tenantStore.setSlug(tenantSlug);
    try { await router.push({ name: 'login-student', params: { tenant: tenantSlug } }); } catch (e) {}
    return;
  }
  try { await router.push({ name: 'login-student-fallback' }); } catch (e) {}
};

const statusTone = (status: string) => {
  const normalized = normalizeManualStatus(status);
  const s = (normalized || status || '').toLowerCase();
  if (s === 'approved' || s === 'active' || s === 'success') return 'success';
  if (s === 'pending' || s === 'trial') return 'warning';
  if (s === 'rejected' || s === 'cancelled' || s === 'failed') return 'danger';
  return 'primary';
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  try {
    return new Intl.DateTimeFormat(tenantStore.branding?.branding?.defaultLocale || 'en', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  } catch (e) { return value; }
};

const notificationNote = (context?: string | null): string | null => {
  const parsed = parseNotificationContext(context);
  const notes = typeof parsed?.notes === 'string' ? parsed.notes.trim() : '';
  return notes.length ? notes : null;
};

const notificationCourseTitle = (context?: string | null): string | null => {
  const parsed = parseNotificationContext(context);
  const title = typeof parsed?.courseTitle === 'string' ? parsed.courseTitle.trim() : '';
  return title.length ? title : null;
};

const notificationStatus = (context?: string | null): string | null => {
  const parsed = parseNotificationContext(context);
  const status = typeof parsed?.status === 'string' ? parsed.status.trim() : '';
  return status.length ? status : null;
};

const notificationCourseId = (context?: string | null): number | null => {
  const parsed = parseNotificationContext(context);
  const value = parsed?.courseId;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsedId = Number(value.trim());
    return Number.isFinite(parsedId) ? parsedId : null;
  }
  return null;
};

const notificationMessage = (notification: { type: string; message: string; context?: string | null }) => {
  if (notification.type !== 'payment') return notification.message;
  const status = notificationStatus(notification.context);
  const courseTitle = notificationCourseTitle(notification.context);
  if (status === 'APPROVED') {
    return t('notifications.paymentApproved', { course: courseTitle ?? t('student.course') });
  }
  if (status === 'REJECTED') {
    return t('notifications.paymentRejected', { course: courseTitle ?? t('student.course') });
  }
  return notification.message;
};

const loadCourses = async () => {
  try {
    const items = await getStudentCourses();
    fetchedCourses.value = items.map((c) => ({
      id: c.id,
      title: c.title || t('student.course'),
      price: c.price,
      currency: normalizeCurrency(c.currency)
    }));
  } catch (e) { console.warn('Failed to load courses', e); }

  const enrollmentCourses = studentStore.enrollments.map((e) => ({
    id: e.courseId,
    title: e.courseTitle,
    currency: null
  }));

  const map = new Map<number, any>();
  [...fetchedCourses.value, ...enrollmentCourses].forEach(c => map.set(c.id, c));
  courses.value = Array.from(map.values());
};

const ensureTenantContext = async () => {
  if (!auth.isStudent) return true;
  if (!multiTeacherEnabled.value) {
    if (!tenantStore.branding) await tenantStore.fetchBranding();
    return true;
  }
  const storedTenant = getStoredTenantSlug().normalized;
  if (storedTenant) {
    await auth.setTenantContext({ teacherSlug: storedTenant });
    return true;
  }
  showTenantPrompt.value = true;
  await nextTick();
  tenantSwitcherRef.value?.focusSearch();
  return false;
};

const refreshStudentDashboard = async (reason: string) => {
  if (dashboardHydrationInFlight.value || showTenantPrompt.value) return;
  dashboardHydrationInFlight.value = true;
  try {
    if (await ensureTenantContext()) {
       await auth.refreshStudentContext();
       await loadCourses();
    }
  } catch (e) { console.error('Dashboard refresh failed', e); }
  finally { dashboardHydrationInFlight.value = false; }
};

useVisibilityRefresh((reason) => refreshStudentDashboard(reason), { includeActivated: true, throttleMs: 500 });

watch(() => studentStore.enrollments, () => loadCourses(), { deep: true });

onMounted(async () => {
  await refreshStudentDashboard('mounted');
  achievementsStore.load('alltime', 3).catch(() => {});
});

const handleTenantSwitched = async () => {
  showTenantPrompt.value = false;
  fetchedCourses.value = [];
  courses.value = [];
  achievementsStore.load('alltime', 3).catch(() => {});
};

const handleLinksLoaded = (links: unknown) => {
  if (Array.isArray(links)) tenantPromptEmpty.value = links.length === 0;
};
</script>

<style scoped>
.student-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-6);
  padding-bottom: var(--sakai-space-8);
}

/* Hero Section */
.student-hero-card {
  overflow: hidden;
  position: relative;
}

.student-hero-card__inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--sakai-space-6);
  flex-wrap: wrap;
}

.student-hero-card__copy {
  flex: 1;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.student-hero-card__title {
  font-size: 2.25rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, var(--sakai-primary) 0%, var(--sakai-primary-700) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.student-hero-card__subtitle {
  font-size: 1rem;
  color: var(--sakai-text-color-secondary);
  display: flex;
  align-items: center;
  gap: var(--sakai-space-3);
  flex-wrap: wrap; /* Prevent overlap in long English text */
}

.student-hero-card__switching {
  display: inline-flex;
  align-items: center;
}

.student-hero-card__spinner {
  width: 12px;
  height: 12px;
  border: 2px solid color-mix(in srgb, var(--sakai-border-color) 60%, transparent);
  border-top-color: var(--sakai-primary);
  border-radius: 50%;
  animation: student-dashboard-spin 0.8s linear infinite;
}

.dot-divider {
  width: 4px;
  height: 4px;
  background: var(--sakai-border-color);
  border-radius: 50%;
}

.student-hero-card__actions {
  display: flex;
  flex-wrap: wrap; /* Prevent overlap of buttons */
  gap: var(--sakai-space-3);
  margin-top: var(--sakai-space-4);
}

.student-hero-card__insights {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-6);
  padding: var(--sakai-space-5);
  background: var(--sakai-surface-alt);
  border-radius: var(--sakai-border-radius-2xl);
  border: 1px solid var(--sakai-border-color);
  flex-wrap: wrap; /* Support for long content on narrow desktops */
  justify-content: center;
}

.student-progress-circle-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sakai-space-2);
}

.student-progress-circle-wrap__label {
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--sakai-text-color-muted);
}

.student-hero-card__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--sakai-space-4);
  flex: 1; /* Allow it to grow and take space */
}

.certificate-mini-list {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.certificate-mini-list__items {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
}

.certificate-mini-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-2);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid var(--sakai-border-color);
  background: var(--sakai-surface-alt);
}

.certificate-mini-item__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.certificate-mini-item__title {
  font-weight: 600;
  color: var(--sakai-text-color);
}

.certificate-mini-item__date {
  font-size: 0.75rem;
  color: var(--sakai-text-color-secondary);
}

.certificate-mini-list__view-all {
  align-self: flex-start;
  padding-inline-start: 0;
}

.stat-mini {
  display: flex;
  flex-direction: column;
}

.stat-mini__label {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: var(--sakai-text-color-muted);
  font-weight: 600;
}

.stat-mini__value {
  font-size: 1.5rem;
  color: var(--sakai-text-color);
}

@keyframes student-dashboard-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Metrics Grid */
.student-dashboard__metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--sakai-space-4);
}

.student-dashboard__payments-filter {
  margin-bottom: var(--sakai-space-3);
}

/* Content Layout */
.student-dashboard__layout {
  display: flex;
  gap: var(--sakai-space-6);
  align-items: flex-start;
}

.student-dashboard__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-6);
  min-width: 0; /* Important for flex-child grid/tables */
}

.student-dashboard__sidebar {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-6);
  flex-shrink: 0;
}

/* Cards & Tables */
.student-dashboard__card {
  height: fit-content;
}

.student-dashboard__table-wrap {
  width: 100%;
  overflow-x: auto;
}

.student-dashboard__table-wrap :deep(table) {
  min-width: 720px;
}

.course-cell-title {
  font-weight: 600;
  color: var(--sakai-text-color);
}

.teacher-cell {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-3);
}

.teacher-cell__info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.teacher-cell__name {
  font-weight: 500;
  font-size: 0.9rem;
}

.teacher-cell__subject {
  font-size: 0.75rem;
  color: var(--sakai-text-color-muted);
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-3);
  min-width: 140px;
}

.progress-cell__value {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--sakai-text-color-secondary);
  width: 2.5rem;
  text-align: right;
}

.date-cell, .method-cell {
  white-space: nowrap;
  font-size: 0.85rem;
}

/* Mini Lists */
.course-mini-list {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
}

.course-mini-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sakai-space-3) var(--sakai-space-4);
  background: var(--sakai-surface-alt);
  border: 1px solid var(--sakai-border-color);
  border-radius: var(--sakai-border-radius-lg);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.course-mini-item:hover {
  border-color: var(--sakai-primary);
  background: var(--sakai-surface-card);
  transform: translateX(4px);
}

.course-mini-item__info {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
  min-width: 0; /* Allow text to be flexible */
  flex: 1;
}

.course-mini-item__title {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--sakai-text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap; /* Keep mini-list tidy */
}

.course-mini-item__arrow {
  color: var(--sakai-text-color-muted);
  transition: transform 0.2s;
}

.course-mini-item:hover .course-mini-item__arrow {
  color: var(--sakai-primary);
  transform: translateX(2px);
}

/* Profile Summary */
.profile-summary {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-4);
  margin-bottom: var(--sakai-space-5);
  padding: var(--sakai-space-2);
}

.profile-summary__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.profile-summary__info strong {
  font-size: 1.1rem;
}

.profile-summary__info span {
  font-size: 0.85rem;
}

.profile-grid-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--sakai-space-2);
}

.profile-action-btn :deep(.ui-button__text) {
  font-size: 0.75rem;
}

/* Notification Feed */
.notification-feed {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.notification-feed__item {
  display: flex;
  gap: var(--sakai-space-3);
  position: relative;
}

.notification-feed__dot {
  width: 8px;
  height: 8px;
  background: var(--sakai-primary);
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
}

.notification-feed__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.notification-feed__message {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
  color: var(--sakai-text-color);
}

.notification-feed__note {
  margin: 0;
  font-size: 0.75rem;
  color: var(--sakai-text-color-secondary);
}

.notification-feed__action {
  align-self: flex-start;
}

.notification-feed__date {
  font-size: 0.75rem;
  color: var(--sakai-text-color-muted);
}

.student-dashboard__list {
  display: none;
  gap: var(--sakai-space-3);
}

.student-dashboard__list-item {
  display: grid;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  background: color-mix(in srgb, var(--sakai-surface-card) 96%, transparent);
}

.student-dashboard__list-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-2);
}

.student-dashboard__list-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.student-dashboard__list-field {
  display: grid;
  gap: var(--sakai-space-2);
}

.student-dashboard__list-field label {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--sakai-text-color-muted);
}

.student-dashboard__list-progress {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-2);
}

.student-dashboard__list-action {
  display: flex;
  justify-content: flex-start;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-6);
  text-align: center;
  color: var(--sakai-text-color-muted);
}

.text-muted {
  color: var(--sakai-text-color-muted);
}

/* Responsive */
@media (max-width: 1024px) {
  .student-dashboard__layout {
    flex-direction: column;
  }
  
  .student-dashboard__sidebar {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .student-hero-card__inner {
    flex-direction: column;
    align-items: flex-start;
  }

  .student-hero-card__copy {
    min-width: 0;
    width: 100%;
  }

  .student-hero-card__actions {
    width: 100%;
    flex-direction: column;
  }

  .student-hero-card__actions :deep(.ui-button) {
    width: 100%;
    justify-content: center;
  }
  
  .student-hero-card__insights {
    width: 100%;
    justify-content: space-between;
  }
  
  .student-dashboard__sidebar {
    grid-template-columns: 1fr;
  }

  .profile-grid-actions {
    grid-template-columns: 1fr;
  }

  .student-dashboard__table-wrap {
    display: none;
  }

  .student-dashboard__list {
    display: grid;
  }
}

/* Course Access Dialog */
.course-access-dialog__lead {
  margin-bottom: var(--sakai-space-4);
  color: var(--sakai-text-color-secondary);
}

.course-access-dialog__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.course-access-dialog__item {
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
  background: var(--sakai-surface-alt);
  border-left: 4px solid var(--sakai-border-color);
}

.course-access-dialog__item.is-complete {
  border-left-color: var(--sakai-success);
  background: color-mix(in srgb, var(--sakai-success) 5%, transparent);
}

.course-access-dialog__item.is-warning {
  border-left-color: var(--sakai-warning);
  background: color-mix(in srgb, var(--sakai-warning) 5%, transparent);
}

.course-access-dialog__item.is-missing {
  border-left-color: var(--sakai-danger);
  background: color-mix(in srgb, var(--sakai-danger) 5%, transparent);
}

.course-access-dialog__note {
  font-size: 0.85rem;
  color: var(--sakai-text-color-secondary);
}
</style>



