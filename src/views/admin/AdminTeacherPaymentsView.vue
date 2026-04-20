<template>
  <ThemePage :title="t('adminTeachers.payments.title')" :subtitle="t('adminTeachers.payments.subtitle')">
    <template #actions>
      <UiButton prepend-icon="DownloadOutlined" :disabled="loading || exporting" @click="downloadCsv">
        {{ exporting ? t('common.loading') : t('adminTeachers.payments.actions.export') }}
      </UiButton>
    </template>

    <section class="admin-teacher-payments">
      <UiCard hover>
        <template #title>{{ t('adminTeachers.payments.filtersTitle') }}</template>
        <template #subtitle>{{ t('adminTeachers.payments.filtersSubtitle') }}</template>

        <UiAlert v-if="error" color="danger" variant="soft" class="admin-teacher-payments__alert">
          {{ error }}
        </UiAlert>

        <div class="admin-teacher-payments__filters">
          <UiSelect
            :model-value="filters.teacherId"
            :label="t('adminTeachers.payments.filters.teacher')"
            clearable
            @update:model-value="onTeacherChange"
          >
            <option value="">{{ t('adminTeachers.payments.filters.teacherAll') }}</option>
            <option v-for="teacher in teacherOptions" :key="teacher.value" :value="teacher.value">
              {{ teacher.label }}
            </option>
          </UiSelect>

          <UiSelect
            :model-value="filters.courseId"
            :label="t('adminTeachers.payments.filters.course')"
            :disabled="!filters.teacherId || loadingCourses"
            clearable
            @update:model-value="(value) => updateFilter('courseId', value)"
          >
            <option value="">{{ t('adminTeachers.payments.filters.courseAll') }}</option>
            <option v-for="course in courseOptions" :key="course.value" :value="course.value">
              {{ course.label }}
            </option>
          </UiSelect>

          <UiSelect
            :model-value="filters.status"
            :label="t('adminTeachers.payments.filters.status')"
            clearable
            @update:model-value="(value) => updateFilter('status', value)"
          >
            <option value="">{{ t('adminTeachers.payments.filters.statusAll') }}</option>
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </UiSelect>

          <UiSelect
            :model-value="filters.method"
            :label="t('adminTeachers.payments.filters.method')"
            clearable
            @update:model-value="(value) => updateFilter('method', value)"
          >
            <option value="">{{ t('adminTeachers.payments.filters.methodAll') }}</option>
            <option v-for="option in methodOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </UiSelect>

          <UiInput
            v-model="filters.search"
            :label="t('adminTeachers.payments.filters.search')"
            :placeholder="t('adminTeachers.payments.filters.searchPlaceholder')"
            start-icon="SearchOutlined"
            @keyup.enter="applyFilters"
          />

          <UiInput v-model="filters.dateFrom" type="date" :label="t('adminTeachers.payments.filters.dateFrom')" />
          <UiInput v-model="filters.dateTo" type="date" :label="t('adminTeachers.payments.filters.dateTo')" />
        </div>

        <div class="admin-teacher-payments__actions-row">
          <div class="admin-teacher-payments__chips">
            <span v-for="chip in activeFilterChips" :key="chip" class="admin-teacher-payments__chip">{{ chip }}</span>
            <span v-if="!activeFilterChips.length" class="admin-teacher-payments__chip admin-teacher-payments__chip--muted">
              {{ t('adminTeachers.payments.filters.none') }}
            </span>
          </div>
          <div class="admin-teacher-payments__actions">
            <UiButton variant="link" color="secondary" @click="resetFilters">
              {{ t('adminTeachers.payments.filters.reset') }}
            </UiButton>
            <UiButton color="primary" @click="applyFilters">
              {{ t('adminTeachers.payments.filters.apply') }}
            </UiButton>
          </div>
        </div>
      </UiCard>

      <div class="admin-teacher-payments__stats">
        <UiCard hover>
          <div class="admin-teacher-payments__stat">
            <span class="admin-teacher-payments__stat-label">{{ t('adminTeachers.payments.stats.totalRows') }}</span>
            <strong class="admin-teacher-payments__stat-value">{{ totalPaymentsLabel }}</strong>
          </div>
        </UiCard>
        <UiCard hover>
          <div class="admin-teacher-payments__stat">
            <span class="admin-teacher-payments__stat-label">{{ t('adminTeachers.payments.stats.visibleAmount') }}</span>
            <strong class="admin-teacher-payments__stat-value">{{ visibleAmountLabel }}</strong>
          </div>
        </UiCard>
        <UiCard hover>
          <div class="admin-teacher-payments__stat">
            <span class="admin-teacher-payments__stat-label">{{ t('adminTeachers.payments.stats.visibleTeachers') }}</span>
            <strong class="admin-teacher-payments__stat-value">{{ visibleTeachersCount }}</strong>
          </div>
        </UiCard>
        <UiCard hover>
          <div class="admin-teacher-payments__stat">
            <span class="admin-teacher-payments__stat-label">{{ t('adminTeachers.payments.stats.visibleCourses') }}</span>
            <strong class="admin-teacher-payments__stat-value">{{ visibleCoursesCount }}</strong>
          </div>
        </UiCard>
        <UiCard hover>
          <div class="admin-teacher-payments__stat">
            <span class="admin-teacher-payments__stat-label">{{ t('adminTeachers.payments.stats.pendingRows') }}</span>
            <strong class="admin-teacher-payments__stat-value">{{ pendingCount }}</strong>
          </div>
        </UiCard>
        <UiCard hover>
          <div class="admin-teacher-payments__stat">
            <span class="admin-teacher-payments__stat-label">{{ t('adminTeachers.payments.stats.approvedRows') }}</span>
            <strong class="admin-teacher-payments__stat-value">{{ approvedCount }}</strong>
          </div>
        </UiCard>
        <UiCard hover>
          <div class="admin-teacher-payments__stat">
            <span class="admin-teacher-payments__stat-label">{{ t('adminTeachers.payments.stats.rejectedRows') }}</span>
            <strong class="admin-teacher-payments__stat-value">{{ rejectedCount }}</strong>
          </div>
        </UiCard>
      </div>

      <UiCard hover>
        <template #title>{{ t('adminTeachers.payments.tableTitle') }}</template>
        <template #subtitle>
          {{ t('adminTeachers.payments.tableSubtitle', { count: rows.length, total: totalPaymentsLabel }) }}
        </template>

        <UiTable
          :headers="headers"
          :items="rows"
          :loading="loading"
          :empty-text="t('adminTeachers.payments.empty')"
          bordered
        >
          <template #item.teacher="{ item }">
            <div class="admin-teacher-payments__cell">
              <a :href="teacherAdminHref(item.teacherId)" class="admin-teacher-payments__primary admin-teacher-payments__link">
                {{ item.teacherName || t('adminTeachers.payments.unknownTeacher') }}
              </a>
              <span class="admin-teacher-payments__secondary">#{{ item.teacherId }}</span>
            </div>
          </template>

          <template #item.student="{ item }">
            <div class="admin-teacher-payments__cell">
              <span class="admin-teacher-payments__primary">{{ item.studentName }}</span>
              <span class="admin-teacher-payments__secondary">{{ item.studentEmail }}</span>
            </div>
          </template>

          <template #item.course="{ item }">
            <div class="admin-teacher-payments__cell">
              <a :href="courseAdminHref(item.courseId)" class="admin-teacher-payments__primary admin-teacher-payments__link">
                {{ item.courseTitle }}
              </a>
              <span class="admin-teacher-payments__secondary">#{{ item.courseId }}</span>
            </div>
          </template>

          <template #item.amount="{ item }">
            <span>{{ formatAmount(item.amount, item.currency) }}</span>
          </template>

          <template #item.method="{ item }">
            <div class="admin-teacher-payments__tags">
              <UiTag color="secondary" size="sm">{{ formatMethod(item.method) }}</UiTag>
              <UiTag v-if="item.gateway" color="info" size="sm">{{ item.gateway }}</UiTag>
            </div>
          </template>

          <template #item.status="{ item }">
            <UiTag :color="paymentStatusColor(item.status)" size="sm">
              {{ formatPaymentStatus(item.status) }}
            </UiTag>
          </template>

          <template #item.createdAt="{ item }">
            <span>{{ formatDateTime(item.createdAt) }}</span>
          </template>

          <template #item.reviewedAt="{ item }">
            <span>{{ formatDateTime(item.reviewedAt) }}</span>
          </template>

          <template #item.proof="{ item }">
            <div class="admin-teacher-payments__proof-actions">
              <UiButton
                v-if="item.proofUrl"
                size="sm"
                variant="link"
                @click="openProofPreview(item)"
              >
                {{ t('adminTeachers.payments.actions.previewProof') }}
              </UiButton>
              <a
                v-if="item.proofUrl"
                :href="resolveProofUrl(item.proofUrl)"
                target="_blank"
                rel="noopener"
                class="admin-teacher-payments__link"
              >
                {{ t('adminTeachers.payments.viewProof') }}
              </a>
              <span v-else>{{ t('adminTeachers.payments.emptyValue') }}</span>
            </div>
          </template>
        </UiTable>

        <div v-if="totalPayments > 0" class="admin-teacher-payments__footer">
          <span>
            {{
              t('adminTeachers.payments.pagination.summary', {
                from: currentRangeStart,
                to: currentRangeEnd,
                total: totalPayments
              })
            }}
          </span>
          <div class="admin-teacher-payments__pager">
            <UiSelect :model-value="String(filters.size)" :label="t('adminTeachers.payments.pagination.pageSize')" @update:model-value="onSizeChange">
              <option v-for="sizeOption in sizeOptions" :key="sizeOption" :value="String(sizeOption)">{{ sizeOption }}</option>
            </UiSelect>
            <UiButton variant="link" size="sm" :disabled="isFirstPage || loading" @click="changePage(filters.page - 1)">
              {{ t('adminTeachers.payments.pagination.prev') }}
            </UiButton>
            <span class="admin-teacher-payments__page-label">
              {{ t('adminTeachers.payments.pagination.page', { current: filters.page, total: totalPages }) }}
            </span>
            <UiButton variant="link" size="sm" :disabled="isLastPage || loading" @click="changePage(filters.page + 1)">
              {{ t('adminTeachers.payments.pagination.next') }}
            </UiButton>
          </div>
        </div>
      </UiCard>
    </section>

    <UiDialog v-model="proofDialog.open" :title="proofDialogTitle" width="880px" @hide="closeProofPreview">
      <div v-if="proofDialog.url" class="admin-teacher-payments__proof-dialog">
        <img v-if="proofDialog.isImage" :src="proofDialog.url" :alt="proofDialogTitle" class="admin-teacher-payments__proof-image" />
        <iframe
          v-else
          :src="proofDialog.url"
          class="admin-teacher-payments__proof-frame"
          :title="proofDialogTitle"
        ></iframe>
        <div class="admin-teacher-payments__dialog-actions">
          <UiButton variant="link" color="secondary" @click="closeProofPreview">{{ t('common.close') }}</UiButton>
          <a :href="proofDialog.url" target="_blank" rel="noopener" class="admin-teacher-payments__link">
            {{ t('adminTeachers.payments.actions.openProofNewTab') }}
          </a>
        </div>
      </div>
    </UiDialog>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiTag from '@/components/ui/UiTag.vue';
import { useToast } from '@/composables/useToast';
import api from '@/services/api';
import { fetchTeacherSummaries } from '@/services/admin';
import {
  exportAdminTeacherPaymentsCsv,
  fetchAdminTeacherCourses,
  fetchAdminTeacherManualPayments,
  type TeacherManualPaymentItem
} from '@/services/adminTeacherPayments';
import type { ManualPaymentMethod, ManualPaymentStatus, PaymentGateway } from '@/services/student';

interface Option {
  value: string;
  label: string;
}

interface PaymentRow {
  paymentId: number;
  teacherId: number;
  teacherName: string;
  studentName: string;
  studentEmail: string;
  courseId: number;
  courseTitle: string;
  amount: number;
  currency?: string | null;
  method: ManualPaymentMethod;
  gateway?: PaymentGateway | null;
  status: ManualPaymentStatus;
  createdAt: string;
  reviewedAt?: string | null;
  proofUrl?: string | null;
}

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();

const loading = ref(false);
const loadingCourses = ref(false);
const exporting = ref(false);
const error = ref('');
const rows = ref<PaymentRow[]>([]);
const totalPayments = ref(0);
const teacherOptions = ref<Option[]>([]);
const courseOptions = ref<Option[]>([]);
const sizeOptions = [10, 25, 50, 100];

const filters = reactive({
  teacherId: '',
  courseId: '',
  status: '',
  method: '',
  search: '',
  dateFrom: '',
  dateTo: '',
  page: 1,
  size: 25
});

const proofDialog = reactive({
  open: false,
  url: '',
  paymentId: 0,
  isImage: false
});

let syncingRoute = false;

const headers = computed(() => [
  { title: t('adminTeachers.payments.columns.teacher'), key: 'teacher' },
  { title: t('adminTeachers.payments.columns.student'), key: 'student' },
  { title: t('adminTeachers.payments.columns.course'), key: 'course' },
  { title: t('adminTeachers.payments.columns.amount'), key: 'amount' },
  { title: t('adminTeachers.payments.columns.method'), key: 'method' },
  { title: t('adminTeachers.payments.columns.status'), key: 'status' },
  { title: t('adminTeachers.payments.columns.createdAt'), key: 'createdAt' },
  { title: t('adminTeachers.payments.columns.reviewedAt'), key: 'reviewedAt' },
  { title: t('adminTeachers.payments.columns.proof'), key: 'proof' }
]);

const methodOptions = computed<Option[]>(() => [
  { value: 'bank', label: t('teacher.paymentMethod.bank') },
  { value: 'cash', label: t('teacher.paymentMethod.cash') },
  { value: 'transfer', label: t('teacher.paymentMethod.transfer') },
  { value: 'instapay', label: t('teacher.paymentMethod.instapay') },
  { value: 'vodafone_cash', label: t('teacher.paymentMethod.vodafone_cash') },
  { value: 'paypal', label: t('teacher.paymentMethod.paypal') },
  { value: 'paymob', label: t('teacher.paymentMethod.paymob') },
  { value: 'custom_link', label: t('teacher.paymentMethod.custom_link') },
  { value: 'other', label: t('teacher.paymentMethod.other') }
]);

const statusOptions = computed<Option[]>(() => [
  { value: 'PENDING_REVIEW', label: t('teacher.paymentStatus.PENDING_REVIEW') },
  { value: 'APPROVED', label: t('teacher.paymentStatus.APPROVED') },
  { value: 'REJECTED', label: t('teacher.paymentStatus.REJECTED') }
]);

const totalPaymentsLabel = computed(() => new Intl.NumberFormat(locale.value).format(totalPayments.value));
const visibleTeachersCount = computed(() => new Set(rows.value.map((item) => item.teacherId)).size);
const visibleCoursesCount = computed(() => new Set(rows.value.map((item) => item.courseId)).size);
const pendingCount = computed(() => rows.value.filter((item) => item.status === 'PENDING_REVIEW').length);
const approvedCount = computed(() => rows.value.filter((item) => item.status === 'APPROVED').length);
const rejectedCount = computed(() => rows.value.filter((item) => item.status === 'REJECTED').length);
const totalPages = computed(() => Math.max(1, Math.ceil(totalPayments.value / filters.size)));
const isFirstPage = computed(() => filters.page <= 1);
const isLastPage = computed(() => filters.page >= totalPages.value);
const currentRangeStart = computed(() => (totalPayments.value === 0 ? 0 : (filters.page - 1) * filters.size + 1));
const currentRangeEnd = computed(() => Math.min(filters.page * filters.size, totalPayments.value));

const visibleAmountLabel = computed(() => {
  if (!rows.value.length) {
    return t('adminTeachers.payments.zeroAmount');
  }
  const total = rows.value.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const firstCurrency = rows.value.find((item) => item.currency)?.currency ?? 'EGP';
  return formatAmount(total, firstCurrency);
});

const activeFilterChips = computed(() => {
  const chips: string[] = [];
  const teacher = teacherOptions.value.find((item) => item.value === filters.teacherId);
  const course = courseOptions.value.find((item) => item.value === filters.courseId);
  if (teacher) chips.push(`${t('adminTeachers.payments.filters.teacher')}: ${teacher.label}`);
  if (course) chips.push(`${t('adminTeachers.payments.filters.course')}: ${course.label}`);
  if (filters.status) chips.push(`${t('adminTeachers.payments.filters.status')}: ${formatPaymentStatus(filters.status as ManualPaymentStatus)}`);
  if (filters.method) chips.push(`${t('adminTeachers.payments.filters.method')}: ${formatMethod(filters.method as ManualPaymentMethod)}`);
  if (filters.search.trim()) chips.push(`${t('adminTeachers.payments.filters.search')}: ${filters.search.trim()}`);
  if (filters.dateFrom) chips.push(`${t('adminTeachers.payments.filters.dateFrom')}: ${filters.dateFrom}`);
  if (filters.dateTo) chips.push(`${t('adminTeachers.payments.filters.dateTo')}: ${filters.dateTo}`);
  return chips;
});

const proofDialogTitle = computed(() =>
  proofDialog.paymentId
    ? t('adminTeachers.payments.proofDialogTitle', { id: proofDialog.paymentId })
    : t('adminTeachers.payments.proofDialogFallback')
);

const toRow = (item: TeacherManualPaymentItem): PaymentRow => ({
  paymentId: item.paymentId,
  teacherId: item.teacherId,
  teacherName: item.teacherName || '',
  studentName: item.student.name,
  studentEmail: item.student.email,
  courseId: item.course.id,
  courseTitle: item.course.title,
  amount: Number(item.amount || 0),
  currency: item.currency,
  method: item.method,
  gateway: item.gateway,
  status: item.status,
  createdAt: item.createdAt,
  reviewedAt: item.reviewedAt,
  proofUrl: item.proofUrl
});

const resolveProofUrl = (url?: string | null) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window === 'undefined') return url;
  const base = api.defaults.baseURL || '/api';
  try {
    const origin = /^https?:\/\//i.test(base) ? new URL(base).origin : window.location.origin;
    const normalizedPath = url.startsWith('/') ? url.substring(1) : url;
    const normalizedBase = normalizedPath.startsWith('static/')
      ? `${origin}/`
      : (() => {
          const candidate = /^https?:\/\//i.test(base)
            ? base
            : new URL(base.startsWith('/') ? base : `/${base}` || '.', window.location.origin).toString();
          return candidate.endsWith('/') ? candidate : `${candidate}/`;
        })();
    return new URL(normalizedPath, normalizedBase).toString();
  } catch (err) {
    console.warn('[AdminTeacherPaymentsView] Unable to resolve proof URL', err);
    return url;
  }
};

const isImageProof = (url: string) => /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(url);

const formatAmount = (amount: number | string, currency?: string | null) => {
  const numericAmount = Number(amount || 0);
  try {
    return new Intl.NumberFormat(locale.value, {
      style: 'currency',
      currency: currency || 'EGP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericAmount);
  } catch {
    return `${numericAmount.toFixed(2)} ${currency || 'EGP'}`;
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return t('adminTeachers.payments.emptyValue');
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
};

const formatMethod = (value: ManualPaymentMethod) => {
  const key = `teacher.paymentMethod.${String(value).toLowerCase()}`;
  const translated = t(key);
  return translated === key ? String(value) : translated;
};

const formatPaymentStatus = (value: ManualPaymentStatus) => {
  const directKey = `teacher.paymentStatus.${String(value)}`;
  const directTranslation = t(directKey);
  if (directTranslation !== directKey) return directTranslation;
  const fallbackKey = `teacher.paymentStatus.${String(value).toLowerCase()}`;
  const fallbackTranslation = t(fallbackKey);
  return fallbackTranslation === fallbackKey ? String(value) : fallbackTranslation;
};

const paymentStatusColor = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'REJECTED':
      return 'danger';
    default:
      return 'warning';
  }
};

const buildQuery = () => ({
  teacherId: filters.teacherId ? Number(filters.teacherId) : undefined,
  courseId: filters.courseId ? Number(filters.courseId) : undefined,
  status: (filters.status || undefined) as ManualPaymentStatus | undefined,
  method: (filters.method || undefined) as ManualPaymentMethod | undefined,
  search: filters.search.trim() || undefined,
  dateFrom: filters.dateFrom || undefined,
  dateTo: filters.dateTo || undefined,
  page: filters.page,
  size: filters.size,
  sortField: 'createdAt',
  sortDesc: true
});

const buildRouteQuery = () => {
  const query: Record<string, string> = {};
  if (filters.teacherId) query.teacherId = filters.teacherId;
  if (filters.courseId) query.courseId = filters.courseId;
  if (filters.status) query.status = filters.status;
  if (filters.method) query.method = filters.method;
  if (filters.search.trim()) query.q = filters.search.trim();
  if (filters.dateFrom) query.dateFrom = filters.dateFrom;
  if (filters.dateTo) query.dateTo = filters.dateTo;
  if (filters.page > 1) query.page = String(filters.page);
  if (filters.size !== 25) query.size = String(filters.size);
  return query;
};

const applyRouteFilters = async () => {
  syncingRoute = true;
  filters.teacherId = typeof route.query.teacherId === 'string' ? route.query.teacherId : '';
  filters.courseId = typeof route.query.courseId === 'string' ? route.query.courseId : '';
  filters.status = typeof route.query.status === 'string' ? route.query.status : '';
  filters.method = typeof route.query.method === 'string' ? route.query.method : '';
  filters.search = typeof route.query.q === 'string' ? route.query.q : '';
  filters.dateFrom = typeof route.query.dateFrom === 'string' ? route.query.dateFrom : '';
  filters.dateTo = typeof route.query.dateTo === 'string' ? route.query.dateTo : '';
  filters.page = typeof route.query.page === 'string' ? Math.max(1, Number(route.query.page) || 1) : 1;
  const routeSize = typeof route.query.size === 'string' ? Number(route.query.size) : 25;
  filters.size = sizeOptions.includes(routeSize) ? routeSize : 25;
  if (filters.teacherId) {
    await loadCourses();
  } else {
    courseOptions.value = [];
  }
  await loadPayments();
  syncingRoute = false;
};

const updateRoute = async () => {
  await router.replace({ name: 'admin-teacher-payments', query: buildRouteQuery() });
};

const loadTeachers = async () => {
  const teachers = await fetchTeacherSummaries();
  teacherOptions.value = teachers
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((teacher) => ({
      value: String(teacher.id),
      label: `${teacher.name} (#${teacher.id})`
    }));
};

const loadCourses = async () => {
  if (!filters.teacherId) {
    courseOptions.value = [];
    return;
  }
  loadingCourses.value = true;
  try {
    const data = await fetchAdminTeacherCourses(Number(filters.teacherId));
    courseOptions.value = data.map((course) => ({
      value: String(course.id),
      label: course.title
    }));
  } finally {
    loadingCourses.value = false;
  }
};

const loadPayments = async () => {
  loading.value = true;
  error.value = '';
  try {
    const data = await fetchAdminTeacherManualPayments(buildQuery());
    rows.value = data.items.map(toRow);
    totalPayments.value = data.total;
  } catch (err) {
    console.error('[AdminTeacherPaymentsView] failed to load payments', err);
    error.value = t('adminTeachers.payments.errors.load');
  } finally {
    loading.value = false;
  }
};

const applyFilters = async () => {
  filters.page = 1;
  await updateRoute();
};

const resetFilters = async () => {
  filters.teacherId = '';
  filters.courseId = '';
  filters.status = '';
  filters.method = '';
  filters.search = '';
  filters.dateFrom = '';
  filters.dateTo = '';
  filters.page = 1;
  filters.size = 25;
  courseOptions.value = [];
  await updateRoute();
};

const updateFilter = (key: 'courseId' | 'status' | 'method', value: string | number | boolean) => {
  filters[key] = value ? String(value) : '';
};

const onTeacherChange = async (value: string | number | boolean) => {
  filters.teacherId = value ? String(value) : '';
  filters.courseId = '';
  filters.page = 1;
  await loadCourses();
};

const changePage = async (nextPage: number) => {
  if (nextPage < 1 || nextPage === filters.page) return;
  filters.page = nextPage;
  await updateRoute();
};

const onSizeChange = async (value: string | number | boolean) => {
  const nextSize = Number(value);
  if (!sizeOptions.includes(nextSize)) return;
  filters.size = nextSize;
  filters.page = 1;
  await updateRoute();
};

const downloadCsv = async () => {
  exporting.value = true;
  try {
    const data = await exportAdminTeacherPaymentsCsv(buildQuery());
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `admin-teacher-payments-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('[AdminTeacherPaymentsView] failed to export csv', err);
    toast.error(t('adminTeachers.payments.errors.export'));
  } finally {
    exporting.value = false;
  }
};

const teacherAdminHref = (teacherId: number) => `/admin/teachers?teacherId=${teacherId}`;
const courseAdminHref = (courseId: number) => `/platform/courses/${courseId}`;

const openProofPreview = (item: PaymentRow) => {
  const resolved = resolveProofUrl(item.proofUrl);
  proofDialog.open = true;
  proofDialog.url = resolved;
  proofDialog.paymentId = item.paymentId;
  proofDialog.isImage = isImageProof(resolved);
};

const closeProofPreview = () => {
  proofDialog.open = false;
  proofDialog.url = '';
  proofDialog.paymentId = 0;
  proofDialog.isImage = false;
};

watch(
  () => route.query,
  async () => {
    await applyRouteFilters();
  }
);

onMounted(async () => {
  try {
    await loadTeachers();
    await applyRouteFilters();
  } catch (err) {
    console.error('[AdminTeacherPaymentsView] failed to initialize', err);
    toast.error(t('adminTeachers.payments.errors.init'));
  }
});
</script>

<style scoped>
.admin-teacher-payments {
  display: grid;
  gap: 1.25rem;
}

.admin-teacher-payments__alert {
  margin-bottom: 1rem;
}

.admin-teacher-payments__filters {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.admin-teacher-payments__actions-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
  align-items: flex-start;
  flex-wrap: wrap;
}

.admin-teacher-payments__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.admin-teacher-payments__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.admin-teacher-payments__chip {
  background: var(--sakai-primary-soft);
  color: var(--sakai-primary-color);
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.admin-teacher-payments__chip--muted {
  background: var(--sakai-surface-muted);
  color: var(--sakai-text-muted);
}

.admin-teacher-payments__stats {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
}

.admin-teacher-payments__stat {
  display: grid;
  gap: 0.35rem;
}

.admin-teacher-payments__stat-label {
  color: var(--sakai-text-muted);
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.admin-teacher-payments__stat-value {
  font-size: 1.35rem;
}

.admin-teacher-payments__cell {
  display: grid;
  gap: 0.15rem;
}

.admin-teacher-payments__primary {
  font-weight: 600;
}

.admin-teacher-payments__secondary {
  color: var(--sakai-text-muted);
  font-size: 0.85rem;
}

.admin-teacher-payments__tags,
.admin-teacher-payments__proof-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

.admin-teacher-payments__link {
  color: var(--sakai-primary-color);
  font-weight: 600;
  text-decoration: none;
}

.admin-teacher-payments__link:hover {
  text-decoration: underline;
}

.admin-teacher-payments__footer {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.admin-teacher-payments__pager {
  display: flex;
  gap: 0.75rem;
  align-items: end;
  flex-wrap: wrap;
}

.admin-teacher-payments__page-label {
  min-width: 7rem;
  text-align: center;
  font-size: 0.92rem;
  color: var(--sakai-text-muted);
}

.admin-teacher-payments__proof-dialog {
  display: grid;
  gap: 1rem;
}

.admin-teacher-payments__proof-image,
.admin-teacher-payments__proof-frame {
  width: 100%;
  min-height: 520px;
  border: 1px solid var(--sakai-border-color);
  border-radius: 1rem;
  background: #fff;
}

.admin-teacher-payments__proof-image {
  object-fit: contain;
  padding: 0.5rem;
}

.admin-teacher-payments__dialog-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

@media (max-width: 720px) {
  .admin-teacher-payments__footer,
  .admin-teacher-payments__dialog-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .admin-teacher-payments__page-label {
    text-align: left;
  }
}
</style>
